export type AgentStreamEvent =
  | { event: 'thread'; data: { threadId: string } }
  | { event: 'token'; data: { text: string } }
  | { event: 'tool_start'; data: { id: string; name: string; summary: string } }
  | { event: 'tool_result'; data: { id: string; name: string; ok: boolean; summary: string } }
  | {
      event: 'confirm_required';
      data: {
        calls: Array<{ id: string; name: string; summary: string; risk: string }>;
      };
    }
  | { event: 'ui_action'; data: { type: string; payload: Record<string, unknown> } }
  | { event: 'sources'; data: Array<Record<string, unknown>> }
  | { event: 'done'; data: { usage: Record<string, number> | null } }
  | { event: 'error'; data: { message: string; code: string } };

export function formatSseFrame(event: AgentStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export const SSE_PING_FRAME = ': ping\n\n';

export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

export interface SseResponseLike {
  setHeader(name: string, value: string): unknown;
  write(chunk: string): unknown;
  flushHeaders?(): void;
  end(): unknown;
}

export class SseWriter {
  private readonly res: SseResponseLike;
  private readonly pingIntervalMs: number;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isClosed = false;

  constructor(res: SseResponseLike, pingIntervalMs = 15000) {
    this.res = res;
    this.pingIntervalMs = pingIntervalMs;
  }

  start(): void {
    if (this.isClosed) {
      return;
    }
    for (const [name, value] of Object.entries(SSE_HEADERS)) {
      this.res.setHeader(name, value);
    }
    if (typeof this.res.flushHeaders === 'function') {
      this.res.flushHeaders();
    }
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pingIntervalMs > 0) {
      this.pingTimer = setInterval(() => {
        if (!this.isClosed) {
          this.res.write(SSE_PING_FRAME);
        }
      }, this.pingIntervalMs);

      if (typeof (this.pingTimer as any)?.unref === 'function') {
        (this.pingTimer as any).unref();
      }
    }
  }

  send(event: AgentStreamEvent): void {
    if (this.isClosed) {
      return;
    }
    this.res.write(formatSseFrame(event));
  }

  close(): void {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.res.end();
  }

  get closed(): boolean {
    return this.isClosed;
  }
}
