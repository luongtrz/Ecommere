import {
  MessagesAnnotation,
  interrupt,
  END,
  type LangGraphRunnableConfig,
} from '@langchain/langgraph';
import {
  SystemMessage,
  ToolMessage,
  AIMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import type { ToolContext } from '../tools/tool.types';
import { toToolResult, toErrorMessage } from '../tools/tool-result.util';
import { requiresConfirmation } from './confirm-policy';
import { buildSystemPrompt } from './prompts/system.prompt';
import { trimHistory } from './history';
import type { AgentGraphDeps } from './agent.graph';

const VIETNAMESE_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export const getTodayVietnam = (now = Date.now()): string =>
  new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10);

export const getContext = (config?: LangGraphRunnableConfig): ToolContext =>
  (config?.configurable?.ctx ?? {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: '',
  }) as ToolContext;

export const getZodErrorMessage = (error: {
  issues: Array<{ message: string }>;
}): string => {
  const msg = error.issues?.[0]?.message;
  return msg && VIETNAMESE_REGEX.test(msg) ? msg : 'Tham số không hợp lệ';
};

export const findLastAIMessage = (
  messages: BaseMessage[],
): AIMessage | undefined =>
  messages
    .slice()
    .reverse()
    .find((m) => m.getType?.() === 'ai') as AIMessage | undefined;

const toolError = (id: string, name: string, error: string) =>
  new ToolMessage({
    tool_call_id: id,
    name,
    content: JSON.stringify({ ok: false, error }),
  });

const auditRole = (role: string): 'CUSTOMER' | 'ADMIN' | null =>
  role === 'GUEST' ? null : (role as 'CUSTOMER' | 'ADMIN');

export function routeAfterAgent(
  state: typeof MessagesAnnotation.State,
): 'confirm' | typeof END {
  const last = state.messages[state.messages.length - 1] as
    AIMessage | undefined;
  return last && Array.isArray(last.tool_calls) && last.tool_calls.length > 0
    ? 'confirm'
    : END;
}

export function createAgentNode(deps: AgentGraphDeps) {
  return async (
    state: typeof MessagesAnnotation.State,
    config?: LangGraphRunnableConfig,
  ) => {
    const ctx = getContext(config);
    const defs = deps.registry.forContext(ctx);
    const specs = defs.map((d) =>
      tool(async () => '', {
        name: d.name,
        description: d.description,
        schema: d.schema,
      }),
    );
    const system = new SystemMessage(
      buildSystemPrompt({
        app: ctx.app,
        role: ctx.role,
        today: getTodayVietnam(),
      }),
    );
    const history = trimHistory(state.messages, deps.limits.historyMaxMessages);
    const response = await deps.model
      .bindTools(specs)
      .invoke([system, ...history]);
    return { messages: [response] };
  };
}

export function createConfirmNode(deps: AgentGraphDeps) {
  return async (
    state: typeof MessagesAnnotation.State,
    config?: LangGraphRunnableConfig,
  ) => {
    const ctx = getContext(config);
    const last = findLastAIMessage(state.messages);
    const calls = last?.tool_calls ?? [];

    const pending = calls.filter((c) => {
      const def = deps.registry.get(c.name);
      return def
        ? requiresConfirmation({ app: ctx.app, role: ctx.role, risk: def.risk })
        : true;
    });
    if (pending.length === 0) return {};

    const callsPayload = await Promise.all(
      pending.map(async (c) => {
        const def = deps.registry.get(c.name);
        let summary = c.name;
        if (def) {
          try {
            const parsed = def.schema.safeParse(c.args);
            if (parsed.success) {
              let previewText: string | undefined;
              if (def.preview) {
                try {
                  previewText = await def.preview(parsed.data, ctx);
                } catch {
                  // preview failure falls back to summarize
                }
              }
              if (typeof previewText === 'string' && previewText.length > 0) {
                summary = previewText;
              } else {
                summary = def.summarize(parsed.data);
              }
            }
          } catch {
            summary = c.name;
          }
        }
        return {
          id: c.id ?? '',
          name: c.name,
          summary,
          risk: def?.risk ?? 'DESTRUCTIVE',
        };
      }),
    );

    const resume = interrupt({ kind: 'confirm', calls: callsPayload }) as
      { decisions?: Array<{ callId: string; approve: boolean }> } | undefined;

    const approvedIds = new Set<string>();
    if (
      resume &&
      typeof resume === 'object' &&
      Array.isArray(resume.decisions)
    ) {
      for (const d of resume.decisions) {
        if (
          d &&
          typeof d === 'object' &&
          typeof d.callId === 'string' &&
          d.callId.trim().length > 0 &&
          d.approve === true
        ) {
          approvedIds.add(d.callId.trim());
        }
      }
    }

    const declinedMessages: ToolMessage[] = [];
    for (const call of pending) {
      const id = typeof call.id === 'string' ? call.id.trim() : '';
      if (!id || !approvedIds.has(id)) {
        const def = deps.registry.get(call.name);
        declinedMessages.push(
          toolError(
            call.id ?? '',
            call.name,
            'Người dùng đã từ chối thao tác này',
          ),
        );
        try {
          await deps.audit.record({
            threadId: ctx.threadId,
            userId: ctx.userId,
            role: auditRole(ctx.role),
            app: ctx.app,
            toolName: call.name,
            risk: def?.risk ?? 'DESTRUCTIVE',
            status: 'DECLINED',
            args: call.args,
            error: 'Người dùng đã từ chối thao tác này',
          });
        } catch {}
      }
    }

    return { messages: declinedMessages };
  };
}

export function createToolsNode(deps: AgentGraphDeps) {
  return async (
    state: typeof MessagesAnnotation.State,
    config?: LangGraphRunnableConfig,
  ) => {
    const ctx = getContext(config);
    const last = findLastAIMessage(state.messages);
    const calls = last?.tool_calls ?? [];

    const doneIds = new Set<string>();
    for (const msg of state.messages) {
      if (msg.getType?.() === 'tool') {
        const id = (msg as { tool_call_id?: string }).tool_call_id;
        if (id && typeof id === 'string' && id.trim().length > 0) {
          doneIds.add(id.trim());
        }
      }
    }

    const lastIdx = last ? state.messages.lastIndexOf(last) : -1;
    const currentTurnToolMessages =
      lastIdx >= 0 ? state.messages.slice(lastIdx + 1) : [];

    const doneCallIndices = new Set<number>();
    for (let i = 0; i < calls.length; i++) {
      const callId = typeof calls[i].id === 'string' ? calls[i].id.trim() : '';
      if (callId && doneIds.has(callId)) {
        doneCallIndices.add(i);
      }
    }

    const unmatchedEmptyIdToolMsgs = currentTurnToolMessages.filter((m) => {
      if (m.getType?.() !== 'tool') return false;
      const tid = (m as { tool_call_id?: string }).tool_call_id;
      return !tid || (typeof tid === 'string' && tid.trim().length === 0);
    });

    for (let i = 0; i < calls.length; i++) {
      if (doneCallIndices.has(i)) continue;
      const callId = typeof calls[i].id === 'string' ? calls[i].id.trim() : '';
      if (!callId) {
        const matchIdx = unmatchedEmptyIdToolMsgs.findIndex(
          (m) => (m as { name?: string }).name === calls[i].name,
        );
        if (matchIdx >= 0) {
          doneCallIndices.add(i);
          unmatchedEmptyIdToolMsgs.splice(matchIdx, 1);
        }
      }
    }

    const remainingCalls = calls.filter((_, idx) => !doneCallIndices.has(idx));

    const toolMessages: ToolMessage[] = [];
    for (let i = 0; i < remainingCalls.length; i++) {
      const call = remainingCalls[i];
      const id = typeof call.id === 'string' ? call.id.trim() : '';
      if (!id) {
        toolMessages.push(
          toolError(call.id ?? '', call.name, 'Mã gọi công cụ không hợp lệ'),
        );
        continue;
      }

      if (i >= deps.limits.maxToolCallsPerTurn) {
        toolMessages.push(
          toolError(
            id,
            call.name,
            'Vượt quá số lượt gọi công cụ trong một lượt',
          ),
        );
        continue;
      }

      const def = deps.registry
        .forContext(ctx)
        .find((d) => d.name === call.name);
      if (!def) {
        toolMessages.push(toolError(id, call.name, 'Công cụ không khả dụng'));
        continue;
      }

      const parsed = def.schema.safeParse(call.args);
      if (!parsed.success) {
        toolMessages.push(
          toolError(id, call.name, getZodErrorMessage(parsed.error)),
        );
        continue;
      }

      const startMs = Date.now();
      let content: string;
      let status: 'OK' | 'ERROR';
      let handlerError: string | undefined;

      try {
        const result = await def.handler(parsed.data, ctx);
        content = toToolResult(def.project ? def.project(result) : result);
        status = 'OK';
      } catch (err) {
        handlerError = toErrorMessage(err);
        content = JSON.stringify({ ok: false, error: handlerError });
        status = 'ERROR';
      }
      const durationMs = Math.max(0, Date.now() - startMs);

      try {
        await deps.audit.record({
          threadId: ctx.threadId,
          userId: ctx.userId,
          role: auditRole(ctx.role),
          app: ctx.app,
          toolName: call.name,
          risk: def.risk,
          status,
          durationMs,
          args: parsed.data ?? call.args,
          resultSummary: content.slice(0, 300),
          ...(status === 'ERROR' && handlerError
            ? { error: handlerError }
            : {}),
        });
      } catch {}

      toolMessages.push(
        new ToolMessage({ tool_call_id: id, name: call.name, content }),
      );
    }

    return { messages: toolMessages };
  };
}
