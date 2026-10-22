import {
  AgentStreamEvent,
  formatSseFrame,
  SSE_HEADERS,
  SSE_PING_FRAME,
  SseResponseLike,
  SseWriter,
} from './sse.frames';

describe('SSE frames', () => {
  describe('formatSseFrame', () => {
    it('formats the exact frame string for a token event', () => {
      const event: AgentStreamEvent = {
        event: 'token',
        data: { text: 'hello world' },
      };
      const frame = formatSseFrame(event);
      expect(frame).toBe('event: token\ndata: {"text":"hello world"}\n\n');
    });

    it('ensures a token containing newline characters still gives a single data line', () => {
      const event: AgentStreamEvent = {
        event: 'token',
        data: { text: 'line 1\nline 2\r\nline 3\n' },
      };
      const frame = formatSseFrame(event);
      expect(frame).toBe(
        'event: token\ndata: {"text":"line 1\\nline 2\\r\\nline 3\\n"}\n\n',
      );

      const lines = frame.split('\n');
      const dataLines = lines.filter((line) => line.startsWith('data:'));
      expect(dataLines).toHaveLength(1);
      expect(dataLines[0]).toBe(
        'data: {"text":"line 1\\nline 2\\r\\nline 3\\n"}',
      );
    });

    it('formats all AgentStreamEvent variants with single-line data', () => {
      const events: AgentStreamEvent[] = [
        { event: 'thread', data: { threadId: 'thread_1' } },
        {
          event: 'tool_start',
          data: {
            id: 'call_1',
            name: 'search_product',
            summary: 'Searching products',
          },
        },
        {
          event: 'tool_result',
          data: {
            id: 'call_1',
            name: 'search_product',
            ok: true,
            summary: 'Found 3 items',
          },
        },
        {
          event: 'confirm_required',
          data: {
            calls: [
              {
                id: 'call_2',
                name: 'checkout',
                summary: 'Place order',
                risk: 'high',
              },
            ],
          },
        },
        {
          event: 'ui_action',
          data: { type: 'NAVIGATE', payload: { url: '/cart' } },
        },
        {
          event: 'sources',
          data: [{ title: 'Doc 1', uri: 'https://example.com/1' }],
        },
        {
          event: 'done',
          data: { usage: { promptTokens: 10, completionTokens: 5 } },
        },
        { event: 'done', data: { usage: null } },
        {
          event: 'error',
          data: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
        },
      ];

      for (const ev of events) {
        const frame = formatSseFrame(ev);
        expect(frame).toBe(
          `event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`,
        );
      }
    });
  });

  describe('SseWriter', () => {
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

    it('start() sets every header and flushes when flushHeaders exists', () => {
      const writer = new SseWriter(mockRes);
      writer.start();

      for (const [header, value] of Object.entries(SSE_HEADERS)) {
        expect(mockRes.setHeader).toHaveBeenCalledWith(header, value);
      }
      expect(mockRes.setHeader).toHaveBeenCalledTimes(
        Object.keys(SSE_HEADERS).length,
      );
      expect(mockRes.flushHeaders).toHaveBeenCalledTimes(1);
    });

    it('the writer works without flushHeaders', () => {
      const resWithoutFlush: SseResponseLike = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
      const writer = new SseWriter(resWithoutFlush);
      expect(() => writer.start()).not.toThrow();

      for (const [header, value] of Object.entries(SSE_HEADERS)) {
        expect(resWithoutFlush.setHeader).toHaveBeenCalledWith(header, value);
      }
    });

    it('the ping frame is written every interval and stops after close()', () => {
      const pingInterval = 15000;
      const writer = new SseWriter(mockRes, pingInterval);
      writer.start();

      expect(mockRes.write).not.toHaveBeenCalled();

      // First interval tick
      jest.advanceTimersByTime(pingInterval);
      expect(mockRes.write).toHaveBeenCalledTimes(1);
      expect(mockRes.write).toHaveBeenLastCalledWith(SSE_PING_FRAME);

      // Second interval tick
      jest.advanceTimersByTime(pingInterval);
      expect(mockRes.write).toHaveBeenCalledTimes(2);
      expect(mockRes.write).toHaveBeenLastCalledWith(SSE_PING_FRAME);

      // Close writer
      writer.close();

      // Timers advance further, no more pings should be written
      jest.advanceTimersByTime(pingInterval * 3);
      expect(mockRes.write).toHaveBeenCalledTimes(2);
    });

    it('close() is idempotent (end is called once)', () => {
      const writer = new SseWriter(mockRes);
      writer.start();
      expect(writer.closed).toBe(false);

      writer.close();
      expect(mockRes.end).toHaveBeenCalledTimes(1);
      expect(writer.closed).toBe(true);

      // Subsequent calls
      writer.close();
      writer.close();
      expect(mockRes.end).toHaveBeenCalledTimes(1);
      expect(writer.closed).toBe(true);
    });

    it('send() writes formatted frame when writer is open', () => {
      const writer = new SseWriter(mockRes);
      writer.start();

      const event: AgentStreamEvent = {
        event: 'token',
        data: { text: 'streaming word' },
      };
      writer.send(event);

      expect(mockRes.write).toHaveBeenCalledWith(formatSseFrame(event));
    });

    it('send() after close() writes nothing', () => {
      const writer = new SseWriter(mockRes);
      writer.start();
      writer.close();
      mockRes.write.mockClear();

      const event: AgentStreamEvent = {
        event: 'token',
        data: { text: 'never sent' },
      };
      writer.send(event);

      expect(mockRes.write).not.toHaveBeenCalled();
    });

    it('calls unref on the ping timer when timer supports it', () => {
      const unrefMock = jest.fn();
      const setIntervalSpy = jest
        .spyOn(global, 'setInterval')
        .mockReturnValue({ unref: unrefMock } as any);

      const writer = new SseWriter(mockRes, 5000);
      writer.start();

      expect(unrefMock).toHaveBeenCalledTimes(1);
      setIntervalSpy.mockRestore();
    });

    it('does not throw when the timer does not support unref', () => {
      const setIntervalSpy = jest
        .spyOn(global, 'setInterval')
        .mockReturnValue(12345 as any);

      const writer = new SseWriter(mockRes, 5000);
      expect(() => writer.start()).not.toThrow();
      setIntervalSpy.mockRestore();
    });
  });
});
