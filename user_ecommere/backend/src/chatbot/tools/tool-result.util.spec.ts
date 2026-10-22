import {
  HttpException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { ToolError, toToolResult, toErrorMessage } from './tool-result.util';

describe('tool-result.util', () => {
  describe('ToolError', () => {
    it('creates an instance with default message when no argument is passed', () => {
      const error = new ToolError();

      expect(error).toBeInstanceOf(ToolError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ToolError');
      expect(error.message).toBe('');
      expect(() => {
        throw error;
      }).toThrow(ToolError);
      expect(() => {
        throw error;
      }).toThrow('');
    });

    it('creates an instance with a custom message and preserves prototype chain', () => {
      const message = 'Order does not belong to user';
      const error = new ToolError(message);

      expect(error).toBeInstanceOf(ToolError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ToolError');
      expect(error.message).toBe(message);
      expect(Object.getPrototypeOf(error)).toBe(ToolError.prototype);
      expect(() => {
        throw error;
      }).toThrow(ToolError);
      expect(() => {
        throw error;
      }).toThrow(message);
    });

    it('preserves inheritance when subclassed', () => {
      class SubToolError extends ToolError {
        constructor(msg: string) {
          super(msg);
        }
      }

      const customError = new SubToolError('Subclassed tool failure');

      expect(customError).toBeInstanceOf(SubToolError);
      expect(customError).toBeInstanceOf(ToolError);
      expect(customError).toBeInstanceOf(Error);
      expect(customError.name).toBe('ToolError');
      expect(customError.message).toBe('Subclassed tool failure');
      expect(() => {
        throw customError;
      }).toThrow(SubToolError);
      expect(() => {
        throw customError;
      }).toThrow('Subclassed tool failure');
    });
  });

  describe('toToolResult', () => {
    describe('success paths without truncation (raw.length <= limit)', () => {
      it('serializes string value using default maxChars (6000)', () => {
        const value = 'success string';
        const result = toToolResult(value);

        expect(result).toBe(JSON.stringify({ ok: true, data: value }));
      });

      it('serializes primitive values (number, boolean, null, undefined)', () => {
        expect(toToolResult(42)).toBe(JSON.stringify({ ok: true, data: 42 }));
        expect(toToolResult(true)).toBe(
          JSON.stringify({ ok: true, data: true }),
        );
        expect(toToolResult(null)).toBe(
          JSON.stringify({ ok: true, data: null }),
        );
        expect(toToolResult(undefined)).toBe(
          JSON.stringify({ ok: true, data: undefined }),
        );
      });

      it('serializes arrays and structured objects', () => {
        const obj = { id: 'order-1', items: [{ name: 'Shirt', qty: 2 }] };
        const arr = [1, 'two', { three: 3 }];

        expect(toToolResult(obj)).toBe(JSON.stringify({ ok: true, data: obj }));
        expect(toToolResult(arr)).toBe(JSON.stringify({ ok: true, data: arr }));
      });

      it('returns raw serialized json when raw.length is exactly equal to limit', () => {
        const payload = { code: 'ORDER_OK' };
        const raw = JSON.stringify({ ok: true, data: payload });

        const result = toToolResult(payload, raw.length);

        expect(result).toBe(raw);
      });
    });

    describe('truncation for string values (raw.length > limit)', () => {
      it('truncates long string when limit >= 38', () => {
        const longStr = 'x'.repeat(200);
        const limit = 50;

        const result = toToolResult(longStr, limit);

        expect(result.length).toBeLessThanOrEqual(limit);
        const parsed = JSON.parse(result);
        expect(parsed.ok).toBe(true);
        expect(parsed.truncated).toBe(true);
        expect(typeof parsed.data).toBe('string');
        expect(longStr.startsWith(parsed.data)).toBe(true);
      });

      it('returns truncated flag without data when limit < 38', () => {
        const longStr = 'x'.repeat(100);

        const result = toToolResult(longStr, 35);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
        expect(result.length).toBe(28);
      });

      it('handles limit = 0 and negative maxChars by clamping to 0', () => {
        const longStr = 'cannot fit in 0 limit';

        const resultZero = toToolResult(longStr, 0);
        const resultNeg = toToolResult(longStr, -50);

        expect(resultZero).toBe(JSON.stringify({ ok: true, truncated: true }));
        expect(resultNeg).toBe(JSON.stringify({ ok: true, truncated: true }));
      });

      it('handles limit = 38 boundary where empty string data candidate is chosen', () => {
        const longStr = 'x'.repeat(100);

        const result = toToolResult(longStr, 38);

        expect(result).toBe(
          JSON.stringify({ ok: true, truncated: true, data: '' }),
        );
        expect(result.length).toBe(38);
      });

      it('handles UTF-16 surrogate pairs and avoids splitting trailing high surrogate', () => {
        const emoji = '😀'; // \uD83D\uDE00
        const textWithEmojis = 'prefix_' + emoji.repeat(25);
        const limit = 45;

        const result = toToolResult(textWithEmojis, limit);

        expect(result.length).toBeLessThanOrEqual(limit);
        const parsed = JSON.parse(result);
        expect(parsed.ok).toBe(true);
        expect(parsed.truncated).toBe(true);
        expect(/[\uD800-\uDBFF]$/.test(parsed.data)).toBe(false);
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });

    describe('truncation for non-string values (raw.length > limit)', () => {
      it('truncates serialized objects when raw exceeds limit', () => {
        const largeObject = {
          items: Array.from({ length: 40 }, (_, i) => ({
            id: `item-${i}`,
            title: `Product title ${i}`,
          })),
        };
        const limit = 60;

        const result = toToolResult(largeObject, limit);

        expect(result.length).toBeLessThanOrEqual(limit);
        const parsed = JSON.parse(result);
        expect(parsed.ok).toBe(true);
        expect(parsed.truncated).toBe(true);
        expect(typeof parsed.data).toBe('string');
      });

      it('handles undefined value with a limit lower than raw length to hit fallback empty string', () => {
        // raw is '{"ok":true}' (length 11). With limit = 5, raw.length > limit.
        // JSON.stringify(undefined) is undefined, triggering (JSON.stringify(value) ?? '').
        const result = toToolResult(undefined, 5);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
      });

      it('handles function value with a limit lower than raw length', () => {
        const fn = () => 'test';
        const result = toToolResult(fn, 5);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
      });
    });

    describe('outer catch block (when JSON.stringify throws)', () => {
      it('handles circular references by falling back to String(value) within limit', () => {
        const circular: Record<string, unknown> = { name: 'circular-node' };
        circular.self = circular;

        const result = toToolResult(circular, 100);

        expect(result).toBe(
          JSON.stringify({ ok: true, data: '[object Object]' }),
        );
      });

      it('handles circular references when fallback exceeds limit and limit < 38', () => {
        const circular: Record<string, unknown> = { name: 'circular-node' };
        circular.self = circular;

        const result = toToolResult(circular, 20);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
      });

      it('handles circular references with negative maxChars in outer catch', () => {
        const circular: Record<string, unknown> = { name: 'circular-node' };
        circular.self = circular;

        const result = toToolResult(circular, -10);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
      });

      it('handles BigInt within limit by converting to String', () => {
        const big = BigInt(1234567890);

        const result = toToolResult(big);

        expect(result).toBe(JSON.stringify({ ok: true, data: '1234567890' }));
      });

      it('truncates large BigInt when String representation exceeds limit (>= 38)', () => {
        const largeBigInt = BigInt('9'.repeat(100));
        const limit = 45;

        const result = toToolResult(largeBigInt, limit);

        expect(result.length).toBeLessThanOrEqual(limit);
        const parsed = JSON.parse(result);
        expect(parsed.ok).toBe(true);
        expect(parsed.truncated).toBe(true);
        expect(typeof parsed.data).toBe('string');
        expect(parsed.data.startsWith('999')).toBe(true);
      });
    });

    describe('inner catch block (when both JSON serialization and String conversion throw)', () => {
      const createExplosiveValue = () => ({
        get boom() {
          throw new Error('cannot serialize to JSON');
        },
        toString() {
          throw new Error('cannot convert to String');
        },
      });

      it('handles unserializable values within limit (>= 43)', () => {
        const explosive = createExplosiveValue();

        const result = toToolResult(explosive, 6000);

        expect(result).toBe(
          JSON.stringify({ ok: true, data: '[unserializable value]' }),
        );
      });

      it('handles exact boundary limit (43) for unserializable fallback', () => {
        const explosive = createExplosiveValue();
        const expected = JSON.stringify({
          ok: true,
          data: '[unserializable value]',
        });

        const result = toToolResult(explosive, expected.length);

        expect(result).toBe(expected);
      });

      it('truncates unserializable fallback when limit < 38', () => {
        const explosive = createExplosiveValue();

        const result = toToolResult(explosive, 30);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
      });

      it('truncates unserializable fallback when limit >= 38 and < 43', () => {
        const explosive = createExplosiveValue();

        const result = toToolResult(explosive, 40);

        expect(result.length).toBeLessThanOrEqual(40);
        const parsed = JSON.parse(result);
        expect(parsed.ok).toBe(true);
        expect(parsed.truncated).toBe(true);
        expect(typeof parsed.data).toBe('string');
        expect('[unserializable value]'.startsWith(parsed.data)).toBe(true);
      });

      it('handles negative maxChars for unserializable fallback', () => {
        const explosive = createExplosiveValue();

        const result = toToolResult(explosive, -5);

        expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
      });
    });
  });

  describe('toErrorMessage', () => {
    describe('ToolError paths', () => {
      it('returns message from ToolError instance', () => {
        const error = new ToolError('Không tìm thấy thông tin đơn hàng');

        expect(toErrorMessage(error)).toBe('Không tìm thấy thông tin đơn hàng');
      });

      it('returns empty message if ToolError was created with empty message', () => {
        const error = new ToolError('');

        expect(toErrorMessage(error)).toBe('');
      });

      it('returns message from Error object with name "ToolError"', () => {
        const duckTypedError = new Error('Cross-boundary tool error');
        duckTypedError.name = 'ToolError';

        expect(toErrorMessage(duckTypedError)).toBe(
          'Cross-boundary tool error',
        );
      });
    });

    describe('HttpException paths', () => {
      it('returns string response directly from HttpException', () => {
        const error = new HttpException(
          'Direct error message string',
          HttpStatus.BAD_REQUEST,
        );

        expect(toErrorMessage(error)).toBe('Direct error message string');
      });

      it('returns string response with preserved internal content when trimmed length > 0', () => {
        const error = new HttpException(
          '   Error with padded spaces   ',
          HttpStatus.BAD_REQUEST,
        );

        expect(toErrorMessage(error)).toBe('   Error with padded spaces   ');
      });

      it('handles not-found exception with string message inside response object', () => {
        const error = new NotFoundException('Sản phẩm không tồn tại');

        expect(toErrorMessage(error)).toBe('Sản phẩm không tồn tại');
      });

      it('handles conflict exception with string message inside response object', () => {
        const error = new ConflictException('Đơn hàng đã được thanh toán');

        expect(toErrorMessage(error)).toBe('Đơn hàng đã được thanh toán');
      });

      it('handles validation exception with array of message strings', () => {
        const error = new BadRequestException({
          message: [
            'Họ và tên không được để trống',
            'Số điện thoại không hợp lệ',
          ],
          error: 'Bad Request',
          statusCode: 400,
        });

        expect(toErrorMessage(error)).toBe(
          'Họ và tên không được để trống; Số điện thoại không hợp lệ',
        );
      });

      it('handles array message with mixed primitive types', () => {
        const error = new HttpException(
          { message: ['Mã lỗi', 4001, true] },
          HttpStatus.BAD_REQUEST,
        );

        expect(toErrorMessage(error)).toBe('Mã lỗi; 4001; true');
      });

      it('falls back to error.message when array of messages is empty', () => {
        const error = new BadRequestException({ message: [] });

        expect(toErrorMessage(error)).toBe(error.message);
      });

      it('falls back to error.message when array of messages contains only whitespace', () => {
        const error = new BadRequestException({ message: ['   '] });

        expect(toErrorMessage(error)).toBe(error.message);
      });

      it('falls back to the default message when response object has empty string message', () => {
        const error = new HttpException(
          { message: '' },
          HttpStatus.BAD_REQUEST,
        );

        expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
      });

      it('falls back to the default message when response object has whitespace string message', () => {
        const error = new HttpException(
          { message: '   ' },
          HttpStatus.BAD_REQUEST,
        );

        expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
      });

      it('falls back to error.message when response object lacks a message field', () => {
        const error = new HttpException(
          { error: 'Internal server error', statusCode: 500 },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

        expect(toErrorMessage(error)).toBe(error.message);
      });

      it('falls back to error.message when response object message field is not string or array', () => {
        const error = new HttpException(
          { message: 12345 },
          HttpStatus.BAD_REQUEST,
        );

        expect(toErrorMessage(error)).toBe(error.message);
      });

      it('falls back to error.message when string response is empty string', () => {
        const error = new HttpException('', HttpStatus.BAD_REQUEST);
        (error as any).message = 'Fallback message for empty response string';

        expect(toErrorMessage(error)).toBe(
          'Fallback message for empty response string',
        );
      });

      it('falls back to error.message when string response is whitespace', () => {
        const error = new HttpException('   ', HttpStatus.BAD_REQUEST);
        (error as any).message = 'Fallback message for whitespace response';

        expect(toErrorMessage(error)).toBe(
          'Fallback message for whitespace response',
        );
      });

      it('falls back to error.message when getResponse() returns null', () => {
        const error = new InternalServerErrorException(
          'Dependency service failed',
        );
        const spy = jest
          .spyOn(error, 'getResponse')
          .mockReturnValue(null as any);

        const result = toErrorMessage(error);

        expect(result).toBe('Dependency service failed');
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('falls back to default Vietnamese message when response and error.message are both empty', () => {
        const error = new HttpException('', HttpStatus.BAD_REQUEST);
        (error as any).message = '';

        expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
      });

      it('falls back to default Vietnamese message when response and error.message are both whitespace', () => {
        const error = new HttpException('   ', HttpStatus.BAD_REQUEST);
        (error as any).message = '   ';

        expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
      });
    });

    describe('generic error and non-error fallback paths', () => {
      it('returns default Vietnamese message for standard Error instance', () => {
        const error = new Error('Database connection timeout');

        expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
      });

      it('returns default Vietnamese message for TypeError instance', () => {
        const error = new TypeError('Cannot read properties of undefined');

        expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
      });

      it('returns default Vietnamese message for plain object that is not an Error instance', () => {
        expect(
          toErrorMessage({
            name: 'ToolError',
            message: 'Fake tool error object',
          }),
        ).toBe('Thao tác không thành công.');
        expect(
          toErrorMessage({
            message: 'Some error message in plain object',
          }),
        ).toBe('Thao tác không thành công.');
      });

      it('returns default Vietnamese message for non-error primitives and falsy values', () => {
        expect(toErrorMessage(null)).toBe('Thao tác không thành công.');
        expect(toErrorMessage(undefined)).toBe('Thao tác không thành công.');
        expect(toErrorMessage('Lỗi hệ thống dạng string')).toBe(
          'Thao tác không thành công.',
        );
        expect(toErrorMessage(500)).toBe('Thao tác không thành công.');
        expect(toErrorMessage(false)).toBe('Thao tác không thành công.');
      });
    });
  });
});
