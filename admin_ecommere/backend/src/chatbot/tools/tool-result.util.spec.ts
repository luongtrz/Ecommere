import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ToolError, toToolResult, toErrorMessage } from './tool-result.util';

describe('ToolResultUtil', () => {
  describe('ToolError', () => {
    it('should instantiate with a message and preserve prototype chain and name', () => {
      const error = new ToolError('Lỗi dữ liệu đầu vào');

      expect(error).toBeInstanceOf(ToolError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ToolError');
      expect(error.message).toBe('Lỗi dữ liệu đầu vào');
    });

    it('should instantiate without arguments and set default empty message', () => {
      const error = new ToolError();

      expect(error).toBeInstanceOf(ToolError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ToolError');
      expect(error.message).toBe('');
    });
  });

  describe('toToolResult', () => {
    it('should return raw serialized JSON when length is within limit', () => {
      const payload = { id: 'prod-1', name: 'Sơn Samurai', inStock: true };
      const result = toToolResult(payload);

      expect(result).toBe(JSON.stringify({ ok: true, data: payload }));
      expect(JSON.parse(result)).toEqual({ ok: true, data: payload });
    });

    it('should respect custom maxChars when within limit', () => {
      const payload = { count: 5 };
      const result = toToolResult(payload, 100);

      expect(result).toBe(JSON.stringify({ ok: true, data: payload }));
    });

    it('should return truncated minimal JSON when limit is below 38', () => {
      const longPayload = 'A'.repeat(50);
      const result = toToolResult(longPayload, 30);

      expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
    });

    it('should clamp negative maxChars to zero and return minimal truncated JSON', () => {
      const result = toToolResult('some data', -5);

      expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
    });

    it('should truncate string value when length exceeds limit >= 38', () => {
      const longStr = 'ABCDE'.repeat(30);
      const limit = 50;
      const result = toToolResult(longStr, limit);

      expect(result.length).toBeLessThanOrEqual(limit);
      const parsed = JSON.parse(result);
      expect(parsed.ok).toBe(true);
      expect(parsed.truncated).toBe(true);
      expect(typeof parsed.data).toBe('string');
      expect(longStr.startsWith(parsed.data)).toBe(true);
    });

    it('should truncate non-string object when length exceeds limit >= 38', () => {
      const largeObject = {
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          label: `item-${i}`,
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

    it('should handle undefined value when JSON.stringify produces undefined dataStr', () => {
      const resultUnder38 = toToolResult(undefined, 5);
      expect(resultUnder38).toBe(JSON.stringify({ ok: true, truncated: true }));

      const resultOver38 = toToolResult(undefined, 40);
      expect(resultOver38).toBe(JSON.stringify({ ok: true }));
    });

    it('should safely trim high surrogates when sliced across surrogate pairs', () => {
      // Emoji 😀 is \uD83D\uDE00. Let's create a string where mid lands on high surrogate.
      const emojiStr = 'prefix_' + '😀'.repeat(30);
      const limit = 45;
      const result = toToolResult(emojiStr, limit);

      expect(result.length).toBeLessThanOrEqual(limit);
      const parsed = JSON.parse(result);
      expect(parsed.ok).toBe(true);
      expect(parsed.truncated).toBe(true);
      // Valid string without lonely trailing high surrogate
      expect(/[\uD800-\uDBFF]$/.test(parsed.data)).toBe(false);
    });

    it('should fall back to String(value) when JSON.stringify throws (e.g. BigInt)', () => {
      const bigIntValue = BigInt(9007199254740991);
      const result = toToolResult(bigIntValue, 100);

      expect(result).toBe(
        JSON.stringify({ ok: true, data: '9007199254740991' }),
      );
    });

    it('should fall back to truncated String(value) when BigInt representation exceeds limit', () => {
      const hugeBigInt = BigInt('1' + '9'.repeat(100));
      const limit = 50;
      const result = toToolResult(hugeBigInt, limit);

      expect(result.length).toBeLessThanOrEqual(limit);
      const parsed = JSON.parse(result);
      expect(parsed.ok).toBe(true);
      expect(parsed.truncated).toBe(true);
      expect(typeof parsed.data).toBe('string');
    });

    it('should fall back to minimal truncated JSON when BigInt exceeds limit < 38', () => {
      const bigIntValue = BigInt(123456);
      const result = toToolResult(bigIntValue, 20);

      expect(result).toBe(JSON.stringify({ ok: true, truncated: true }));
    });

    it('should fall back to [unserializable value] when both JSON.stringify and String(value) throw', () => {
      const evilObj = Object.create(null);
      evilObj.bad = BigInt(42);
      // JSON.stringify throws TypeError due to BigInt
      // String(evilObj) throws TypeError because evilObj has no prototype / toString

      const normalLimitResult = toToolResult(evilObj, 100);
      expect(normalLimitResult).toBe(
        JSON.stringify({ ok: true, data: '[unserializable value]' }),
      );

      const truncatedLimitResult = toToolResult(evilObj, 40);
      expect(truncatedLimitResult.length).toBeLessThanOrEqual(40);
      const parsed = JSON.parse(truncatedLimitResult);
      expect(parsed.ok).toBe(true);
      expect(parsed.truncated).toBe(true);

      const smallLimitResult = toToolResult(evilObj, 20);
      expect(smallLimitResult).toBe(
        JSON.stringify({ ok: true, truncated: true }),
      );
    });
  });

  describe('toErrorMessage', () => {
    it('should return message from ToolError instance', () => {
      const error = new ToolError('Thông số mã đơn hàng không hợp lệ');

      expect(toErrorMessage(error)).toBe('Thông số mã đơn hàng không hợp lệ');
    });

    it('should return message from error with name ToolError', () => {
      const error = new Error('Lỗi từ hệ thống công cụ');
      error.name = 'ToolError';

      expect(toErrorMessage(error)).toBe('Lỗi từ hệ thống công cụ');
    });

    it('should return string response from HttpException', () => {
      const error = new HttpException(
        'Mã sản phẩm đã tồn tại',
        HttpStatus.CONFLICT,
      );

      expect(toErrorMessage(error)).toBe('Mã sản phẩm đã tồn tại');
    });

    it('should return joined messages when HttpException response contains message array', () => {
      const error = new BadRequestException({
        message: ['Tên sản phẩm không được để trống', 'Giá bán phải lớn hơn 0'],
      });

      expect(toErrorMessage(error)).toBe(
        'Tên sản phẩm không được để trống; Giá bán phải lớn hơn 0',
      );
    });

    it('should return single string message when HttpException response is an object with message property', () => {
      const error = new NotFoundException({
        message: 'Không tìm thấy danh mục yêu cầu',
      });

      expect(toErrorMessage(error)).toBe('Không tìm thấy danh mục yêu cầu');
    });

    it('should fall back to error.message when HttpException response object has whitespace-only message string', () => {
      const error = new HttpException(
        { message: '   ' },
        HttpStatus.BAD_REQUEST,
      );
      Object.defineProperty(error, 'message', {
        value: 'Lỗi kiểm tra dữ liệu',
      });

      expect(toErrorMessage(error)).toBe('Lỗi kiểm tra dữ liệu');
    });

    it('should fall back to error.message when HttpException response object has empty message array', () => {
      const error = new HttpException({ message: [] }, HttpStatus.BAD_REQUEST);

      expect(toErrorMessage(error)).toBe(error.message);
    });

    it('should fall back to error.message when HttpException response is whitespace-only string', () => {
      const error = new HttpException('   ', HttpStatus.BAD_REQUEST);
      Object.defineProperty(error, 'message', { value: 'Lỗi không xác định' });

      expect(toErrorMessage(error)).toBe('Lỗi không xác định');
    });

    it('should fall back to error.message when HttpException response is an object without message property', () => {
      const error = new HttpException(
        { error: 'InternalServer' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      expect(toErrorMessage(error)).toBe(error.message);
    });

    it('should fall back to default Vietnamese message when HttpException has empty error.message and empty response', () => {
      const error = new HttpException('', HttpStatus.BAD_REQUEST);
      // Override error.message to empty string
      Object.defineProperty(error, 'message', { value: '' });

      expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
    });

    it('should return default Vietnamese message for generic Error instances', () => {
      const error = new Error('Database connection failed');

      expect(toErrorMessage(error)).toBe('Thao tác không thành công.');
    });

    it('should return default Vietnamese message for string errors', () => {
      expect(toErrorMessage('Something went wrong')).toBe(
        'Thao tác không thành công.',
      );
    });

    it('should return default Vietnamese message for null, undefined, or numbers', () => {
      expect(toErrorMessage(null)).toBe('Thao tác không thành công.');
      expect(toErrorMessage(undefined)).toBe('Thao tác không thành công.');
      expect(toErrorMessage(500)).toBe('Thao tác không thành công.');
      expect(toErrorMessage({})).toBe('Thao tác không thành công.');
    });
  });
});
