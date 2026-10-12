import { Command } from '@langchain/langgraph';
import {
  HumanMessage,
  AIMessageChunk,
  type AIMessage,
  type ToolMessage,
} from '@langchain/core/messages';
import type { ToolRegistry } from '../tools/tool.registry';
import type { ToolContext } from '../tools/tool.types';
import type { AgentStreamEvent } from './sse.frames';

export class AgentBusyError extends Error {
  constructor(message = 'Cuộc trò chuyện đang được xử lý') {
    super(message);
    this.name = 'AgentBusyError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AgentNotPendingError extends Error {
  constructor(message = 'Không có thao tác nào đang chờ xác nhận') {
    super(message);
    this.name = 'AgentNotPendingError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface AgentTranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentRunnerDeps {
  graph: {
    stream(
      input: unknown,
      config: unknown,
    ): PromiseLike<AsyncIterable<unknown>> | AsyncIterable<unknown>;
    getState?(
      config: unknown,
    ): PromiseLike<unknown> | unknown;
    checkpointer?: {
      deleteThread(threadId: string): Promise<void>;
    };
  };
  registry: ToolRegistry;
  threads: {
    recordUsage(threadId: string, tokens: number): Promise<void>;
    setTitleIfEmpty(threadId: string, title: string): Promise<void>;
  };
  limits: { maxSteps: number; timeoutMs: number };
  now?: () => number;
}

export interface AgentRunParams {
  ctx: ToolContext;
  message?: string;
  clientContext?: Record<string, unknown>;
  resume?: { decisions: Array<{ callId: string; approve: boolean }> };
  sink: (event: AgentStreamEvent) => void;
  signal?: AbortSignal;
}

export class AgentRunner {
  private readonly runningThreads = new Set<string>();
  private readonly graph: AgentRunnerDeps['graph'];
  private readonly registry: ToolRegistry;
  private readonly threads: AgentRunnerDeps['threads'];
  private readonly limits: AgentRunnerDeps['limits'];
  private readonly now: () => number;

  constructor(deps: AgentRunnerDeps) {
    this.graph = deps.graph;
    this.registry = deps.registry;
    this.threads = deps.threads;
    this.limits = deps.limits;
    this.now = deps.now ?? Date.now;
  }

  run(params: AgentRunParams): Promise<void> {
    const threadId = params.ctx.threadId;
    if (this.runningThreads.has(threadId)) {
      throw new AgentBusyError('Cuộc trò chuyện đang được xử lý');
    }
    this.runningThreads.add(threadId);

    return (async () => {
      try {
        await this.execute(params);
      } finally {
        this.runningThreads.delete(threadId);
      }
    })();
  }

  async readTranscript(threadId: string): Promise<AgentTranscriptMessage[]> {
    if (!this.graph.getState) {
      return [];
    }

    const state = (await this.graph.getState({
      configurable: { thread_id: threadId },
    })) as
      | {
          values?: { messages?: unknown[] };
          messages?: unknown[];
        }
      | undefined
      | null;

    if (!state) {
      return [];
    }

    const rawMessages = state.values?.messages ?? state.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return [];
    }

    const transcript: AgentTranscriptMessage[] = [];

    for (let i = 0; i < rawMessages.length; i++) {
      const msg = rawMessages[i];
      if (!msg || typeof msg !== 'object') {
        continue;
      }

      let role: 'user' | 'assistant' | null = null;
      const type = this.resolveMessageType(msg);
      if (type === 'human' || type === 'user') {
        role = 'user';
      } else if (type === 'ai' || type === 'assistant') {
        role = 'assistant';
      } else {
        continue;
      }

      const content = this.extractMessageContent((msg as any).content);

      if (role === 'assistant' && (!content || content.length === 0)) {
        continue;
      }

      const rawId = (msg as any).id;
      const id =
        rawId !== undefined && rawId !== null && rawId !== ''
          ? String(rawId)
          : String(i);

      transcript.push({
        id,
        role,
        content,
      });
    }

    return transcript;
  }

  async assertResumable(threadId: string, callIds: string[]): Promise<void> {
    if (!this.graph.getState) {
      throw new AgentNotPendingError();
    }

    const state = (await this.graph.getState({
      configurable: { thread_id: threadId },
    })) as
      | {
          tasks?: Array<{
            interrupts?: Array<{
              value?: {
                calls?: Array<{ id?: string }>;
              };
            }>;
          }>;
        }
      | undefined
      | null;

    if (!state || !Array.isArray(state.tasks)) {
      throw new AgentNotPendingError();
    }

    const pendingCallIds: string[] = [];
    for (const task of state.tasks) {
      if (task && Array.isArray(task.interrupts)) {
        for (const interrupt of task.interrupts) {
          const calls = (interrupt as any)?.value?.calls;
          if (Array.isArray(calls)) {
            for (const call of calls) {
              const id = (call as any)?.id;
              if (typeof id === 'string') {
                pendingCallIds.push(id);
              }
            }
          }
        }
      }
    }

    if (pendingCallIds.length === 0) {
      throw new AgentNotPendingError();
    }

    if (callIds.length === 0) {
      throw new AgentNotPendingError();
    }

    const callIdSet = new Set<string>();
    for (const id of callIds) {
      if (callIdSet.has(id)) {
        throw new AgentNotPendingError();
      }
      callIdSet.add(id);
    }

    const pendingSet = new Set(pendingCallIds);
    if (callIdSet.size !== pendingSet.size || callIds.length !== pendingCallIds.length) {
      throw new AgentNotPendingError();
    }

    for (const id of callIdSet) {
      if (!pendingSet.has(id)) {
        throw new AgentNotPendingError();
      }
    }
  }

  async deleteCheckpoints(threadId: string): Promise<void> {
    if (this.graph.checkpointer) {
      await this.graph.checkpointer.deleteThread(threadId);
    }
  }

  private resolveMessageType(msg: unknown): string {
    if (!msg || typeof msg !== 'object') {
      return '';
    }
    const m = msg as Record<string, unknown>;
    if (typeof m.getType === 'function') {
      return (m.getType as () => string)();
    }
    if (typeof m._getType === 'function') {
      return (m._getType as () => string)();
    }
    if (typeof m.type === 'string') {
      return m.type;
    }
    if (typeof m.role === 'string') {
      return m.role;
    }
    return '';
  }

  private extractMessageContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      const parts: string[] = [];
      for (const part of content) {
        if (typeof part === 'string') {
          parts.push(part);
        } else if (part && typeof part === 'object') {
          const block = part as Record<string, unknown>;
          if (
            (block.type === 'text' || block.type === undefined) &&
            typeof block.text === 'string'
          ) {
            parts.push(block.text);
          }
        }
      }
      return parts.join('');
    }
    return '';
  }

  private async execute(params: AgentRunParams): Promise<void> {
    if (params.signal?.aborted) {
      return;
    }

    const controller = new AbortController();
    let timedOut = false;
    let clientAborted = false;

    let timeoutTimer: NodeJS.Timeout | null = null;
    if (this.limits.timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.limits.timeoutMs);
    }

    const onClientAbort = () => {
      clientAborted = true;
      controller.abort();
    };

    if (params.signal) {
      params.signal.addEventListener('abort', onClientAbort, { once: true });
    }

    let abortReject!: (err: unknown) => void;
    const abortPromise = new Promise<never>((_, reject) => {
      abortReject = reject;
    });
    abortPromise.catch(() => {});

    const onInternalAbort = () => {
      abortReject(controller.signal.reason ?? new Error('Aborted'));
    };

    if (controller.signal.aborted) {
      onInternalAbort();
    } else {
      controller.signal.addEventListener('abort', onInternalAbort, { once: true });
    }

    params.sink({
      event: 'thread',
      data: { threadId: params.ctx.threadId },
    });

    const ctx: ToolContext = params.clientContext
      ? { ...params.ctx, clientContext: params.clientContext }
      : params.ctx;

    const config = {
      configurable: {
        thread_id: ctx.threadId,
        ctx,
      },
      recursionLimit: this.limits.maxSteps,
      streamMode: ['messages', 'updates'],
      signal: controller.signal,
    };

    const input = params.resume
      ? new Command({ resume: params.resume })
      : { messages: [new HumanMessage(params.message ?? '')] };

    let totalTokens = 0;
    let hasUsage = false;

    try {
      const stream = await this.graph.stream(input, config);
      const iterator = stream[Symbol.asyncIterator]();

      try {
        while (true) {
          if (clientAborted || params.signal?.aborted) {
            return;
          }
          if (timedOut) {
            params.sink({
              event: 'error',
              data: {
                message: 'Yêu cầu quá thời gian, vui lòng thử lại.',
                code: 'AGENT_TIMEOUT',
              },
            });
            return;
          }

          const nextPromise = iterator.next();
          const { done, value } = await Promise.race([nextPromise, abortPromise]);
          if (done) {
            break;
          }

          const chunk = value;
          if (!Array.isArray(chunk) || chunk.length < 2) {
            continue;
          }

          const [mode, payload] = chunk;

          if (mode === 'messages') {
            if (Array.isArray(payload) && payload.length >= 2) {
              const [msgChunk, metadata] = payload;
              if (
                metadata?.langgraph_node === 'agent' &&
                msgChunk &&
                typeof msgChunk.content === 'string' &&
                msgChunk.content.length > 0
              ) {
                params.sink({
                  event: 'token',
                  data: { text: msgChunk.content },
                });
              }
            }
          } else if (mode === 'updates') {
            if (payload && typeof payload === 'object') {
              // Node 'agent'
              const agentUpdate = (payload as any).agent;
              if (agentUpdate && Array.isArray(agentUpdate.messages)) {
                for (const msg of agentUpdate.messages) {
                  if (
                    msg?.usage_metadata &&
                    typeof msg.usage_metadata.total_tokens === 'number'
                  ) {
                    totalTokens += msg.usage_metadata.total_tokens;
                    hasUsage = true;
                  }

                  if (Array.isArray(msg?.tool_calls) && msg.tool_calls.length > 0) {
                    for (const call of msg.tool_calls) {
                      const id = call.id ?? '';
                      const name = call.name ?? '';
                      let summary = name;
                      const def = this.registry.get(name);
                      if (def) {
                        try {
                          let args = call.args;
                          if (typeof args === 'string') {
                            try {
                              args = JSON.parse(args);
                            } catch {}
                          }
                          const parsed = def.schema.safeParse(args);
                          if (parsed.success) {
                            summary = def.summarize(parsed.data) ?? name;
                          }
                        } catch {
                          summary = name;
                        }
                      }
                      params.sink({
                        event: 'tool_start',
                        data: {
                          id,
                          name,
                          summary,
                        },
                      });
                    }
                  }
                }
              }

              // Node 'tools'
              const toolsUpdate = (payload as any).tools;
              if (toolsUpdate && Array.isArray(toolsUpdate.messages)) {
                for (const msg of toolsUpdate.messages) {
                  const toolCallId = msg?.tool_call_id ?? msg?.id ?? '';
                  const toolName = msg?.name ?? '';

                  let parsedContent: any = null;
                  try {
                    if (typeof msg?.content === 'string') {
                      parsedContent = JSON.parse(msg.content);
                    } else if (msg?.content && typeof msg.content === 'object') {
                      parsedContent = msg.content;
                    }
                  } catch {
                    parsedContent = null;
                  }

                  const ok = Boolean(parsedContent?.ok);
                  let summary: string;
                  if (ok) {
                    summary = 'Đã thực hiện thao tác';
                  } else {
                    const rawErr = parsedContent?.error;
                    let errText = 'Thao tác không thành công.';
                    if (typeof rawErr === 'string' && rawErr.length > 0) {
                      errText = rawErr;
                    } else if (rawErr) {
                      errText = JSON.stringify(rawErr);
                    }
                    summary = errText.slice(0, 200);
                  }

                  params.sink({
                    event: 'tool_result',
                    data: {
                      id: toolCallId,
                      name: toolName,
                      ok,
                      summary,
                    },
                  });

                  if (ok) {
                    const def = this.registry.get(toolName);
                    if (def?.uiAction) {
                      try {
                        const action = def.uiAction(parsedContent?.data);
                        if (action) {
                          params.sink({
                            event: 'ui_action',
                            data: action,
                          });
                        }
                      } catch {}
                    }

                    if (
                      toolName === 'recommend_products' &&
                      Array.isArray(parsedContent?.data?.sources)
                    ) {
                      params.sink({
                        event: 'sources',
                        data: parsedContent.data.sources,
                      });
                    }
                  }
                }
              }

              // Key '__interrupt__'
              if (Array.isArray((payload as any).__interrupt__)) {
                const interrupts = (payload as any).__interrupt__;
                const confirmInterrupt = interrupts.find(
                  (item: any) => item?.value?.kind === 'confirm',
                );
                if (confirmInterrupt) {
                  params.sink({
                    event: 'confirm_required',
                    data: {
                      calls: confirmInterrupt.value.calls,
                    },
                  });
                  return;
                }
              }
            }
          }
        }
      } finally {
        if (typeof iterator.return === 'function') {
          try {
            await iterator.return();
          } catch {}
        }
      }

      if (clientAborted || params.signal?.aborted) {
        return;
      }
      if (timedOut) {
        params.sink({
          event: 'error',
          data: {
            message: 'Yêu cầu quá thời gian, vui lòng thử lại.',
            code: 'AGENT_TIMEOUT',
          },
        });
        return;
      }

      // Finish (no interrupt)
      params.sink({
        event: 'done',
        data: {
          usage: hasUsage ? { totalTokens } : null,
        },
      });

      if (totalTokens > 0) {
        try {
          await this.threads.recordUsage(ctx.threadId, totalTokens);
        } catch {}
      }

      if (!params.resume && typeof params.message === 'string') {
        try {
          await this.threads.setTitleIfEmpty(ctx.threadId, params.message);
        } catch {}
      }
    } catch (err) {
      if (clientAborted || params.signal?.aborted) {
        return;
      }
      if (timedOut) {
        params.sink({
          event: 'error',
          data: {
            message: 'Yêu cầu quá thời gian, vui lòng thử lại.',
            code: 'AGENT_TIMEOUT',
          },
        });
        return;
      }
      params.sink({
        event: 'error',
        data: {
          message: 'Trợ lý tạm thời không phản hồi, vui lòng thử lại sau.',
          code: 'AGENT_ERROR',
        },
      });
    } finally {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      if (params.signal) {
        params.signal.removeEventListener('abort', onClientAbort);
      }
      controller.signal.removeEventListener('abort', onInternalAbort);
    }
  }
}
