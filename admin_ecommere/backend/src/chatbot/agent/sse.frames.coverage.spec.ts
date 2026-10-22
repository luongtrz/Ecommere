import {
  AgentStreamEvent,
  formatSseFrame,
  SSE_HEADERS,
  SSE_PING_FRAME,
  SseWriter,
} from './sse.frames';

describe('SSE frames Coverage Companion', () => {
  let mockRes: {
    setHeader: jest.Mock;
    write: jest.Mock;
    flushHeaders: jest.Mock;
    end: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockRes = {
      setHeader: jest.fn(),
      write: jest.fn(),
      flushHeaders: jest.fn(),
      end: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('constants verification', () => {
    it('exports expected SSE_PING_FRAME and SSE_HEADERS', () => {
      expect(SSE_PING_FRAME).toBe(': ping\n\n');
      expect(SSE_HEADERS).toEqual({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
    });
  });

  describe('formatSseFrame additional edge cases', () => {
    it('formats unicode, vietnamese text, and complex json payloads correctly', () => {
      const event: AgentStreamEvent = {
        event: 'token',
        data: { text: 'Nước hoa Charme thơm lâu chính hãng 100%' },
      };
      const frame = formatSseFrame(event);
      expect(frame).toBe(
        'event: token\ndata: {"text":"Nước hoa Charme thơm lâu chính hãng 100%"}\n\n',
      );
    });

    it('formats confirm_required with multiple actions', () => {
      const event: AgentStreamEvent = {
        event: 'confirm_required',
        data: {
          calls: [
            {
              id: 'call_1',
              name: 'delete_order',
              summary: 'Xóa đơn hàng #123',
              risk: 'DESTRUCTIVE',
            },
            {
              id: 'call_2',
              name: 'refund_payment',
              summary: 'Hoàn tiền 500,000 VND',
              risk: 'SENSITIVE',
            },
          ],
        },
      };

      const frame = formatSseFrame(event);
      expect(frame).toContain('event: confirm_required\ndata: {');
      expect(frame.endsWith('\n\n')).toBe(true);
      expect(
        JSON.parse(frame.replace('event: confirm_required\ndata: ', '').trim()),
      ).toEqual(event.data);
    });
  });

  describe('SseWriter branch coverage', () => {
    it('does not set headers or start timers when start() is called on an already closed writer', () => {
      const writer = new SseWriter(mockRes);
      writer.close();
      expect(writer.closed).toBe(true);
      expect(mockRes.end).toHaveBeenCalledTimes(1);

      mockRes.setHeader.mockClear();
      mockRes.flushHeaders.mockClear();
      mockRes.write.mockClear();

      writer.start();

      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(mockRes.flushHeaders).not.toHaveBeenCalled();
      expect(mockRes.write).not.toHaveBeenCalled();
      expect(writer.closed).toBe(true);
    });

    it('clears existing pingTimer and replaces it when start() is called a second time on an open writer', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const writer = new SseWriter(mockRes, 10000);

      writer.start();
      expect(mockRes.setHeader).toHaveBeenCalledTimes(4);

      // Call start again while writer is still open and pingTimer !== null
      writer.start();

      expect(clearIntervalSpy).toHaveBeenCalled();

      // Advancing timer ticks pings as expected with the new timer
      jest.advanceTimersByTime(10000);
      expect(mockRes.write).toHaveBeenCalledWith(SSE_PING_FRAME);

      writer.close();
      clearIntervalSpy.mockRestore();
    });

    it('does not create a ping timer when pingIntervalMs is 0', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const writer = new SseWriter(mockRes, 0);

      writer.start();

      expect(mockRes.setHeader).toHaveBeenCalledTimes(4);
      expect(setIntervalSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(60000);
      expect(mockRes.write).not.toHaveBeenCalled();

      writer.close();
      expect(writer.closed).toBe(true);
      setIntervalSpy.mockRestore();
    });

    it('does not create a ping timer when pingIntervalMs is negative', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const writer = new SseWriter(mockRes, -5000);

      writer.start();

      expect(mockRes.setHeader).toHaveBeenCalledTimes(4);
      expect(setIntervalSpy).not.toHaveBeenCalled();

      writer.close();
      expect(writer.closed).toBe(true);
      setIntervalSpy.mockRestore();
    });

    it('closes cleanly when writer was never started (pingTimer is null)', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const writer = new SseWriter(mockRes);

      expect(writer.closed).toBe(false);
      writer.close();

      expect(writer.closed).toBe(true);
      expect(mockRes.end).toHaveBeenCalledTimes(1);
      expect(clearIntervalSpy).not.toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('closes cleanly when writer was started with pingIntervalMs = 0 (pingTimer is null)', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const writer = new SseWriter(mockRes, 0);

      writer.start();
      writer.close();

      expect(writer.closed).toBe(true);
      expect(mockRes.end).toHaveBeenCalledTimes(1);
      expect(clearIntervalSpy).not.toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('prevents writing ping frame if timer callback fires when writer is closed', () => {
      let intervalCallback: (() => void) | null = null;

      const setIntervalSpy = jest
        .spyOn(global, 'setInterval')
        .mockImplementation(((callback: any) => {
          intervalCallback = callback;
          return 888 as any;
        }) as any);

      const writer = new SseWriter(mockRes, 5000);
      writer.start();
      expect(intervalCallback).not.toBeNull();

      // Close writer, making isClosed = true
      writer.close();
      mockRes.write.mockClear();

      // Manually trigger interval callback
      intervalCallback!();

      expect(mockRes.write).not.toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });

    it('allows send() before start() when writer is open', () => {
      const writer = new SseWriter(mockRes);
      const event: AgentStreamEvent = {
        event: 'token',
        data: { text: 'early token' },
      };

      writer.send(event);

      expect(mockRes.write).toHaveBeenCalledTimes(1);
      expect(mockRes.write).toHaveBeenCalledWith(formatSseFrame(event));
    });

    it('ignores send() if called when writer is closed without start', () => {
      const writer = new SseWriter(mockRes);
      writer.close();
      mockRes.write.mockClear();

      const event: AgentStreamEvent = {
        event: 'done',
        data: { usage: null },
      };
      writer.send(event);

      expect(mockRes.write).not.toHaveBeenCalled();
    });
  });
});
