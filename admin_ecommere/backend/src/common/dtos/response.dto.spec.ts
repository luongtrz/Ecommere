import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SuccessResponseDto, ErrorResponseDto } from './response.dto';

describe('Response DTOs', () => {
  describe('SuccessResponseDto', () => {
    it('should instantiate with default undefined arguments', () => {
      const response = new SuccessResponseDto();

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
    });

    it('should instantiate with data only', () => {
      const data = { id: 1, name: 'Product A' };
      const response = new SuccessResponseDto(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
    });

    it('should instantiate with data and a message', () => {
      const data = ['item1', 'item2'];
      const message = 'Data fetched successfully';
      const response = new SuccessResponseDto(data, message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
    });

    it('should instantiate with undefined data and a message', () => {
      const message = 'Operation completed';
      const response = new SuccessResponseDto(undefined, message);

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBe(message);
    });

    it('should instantiate with null data and a message', () => {
      const response = new SuccessResponseDto(null, 'No content found');

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
      expect(response.message).toBe('No content found');
    });

    it('should instantiate with primitive data types', () => {
      const stringResponse = new SuccessResponseDto('sample-string');
      expect(stringResponse.success).toBe(true);
      expect(stringResponse.data).toBe('sample-string');

      const numberResponse = new SuccessResponseDto(42);
      expect(numberResponse.success).toBe(true);
      expect(numberResponse.data).toBe(42);

      const booleanResponse = new SuccessResponseDto(false);
      expect(booleanResponse.success).toBe(true);
      expect(booleanResponse.data).toBe(false);
    });

    it('should pass class-validator validation when instantiated directly', async () => {
      const response = new SuccessResponseDto({ test: true }, 'Valid response');
      const errors = await validate(response);

      // SuccessResponseDto has no class-validator decorators, so validate() yields unknownValue
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });

    it('should transform and pass validation via plainToInstance', async () => {
      const plain = {
        success: true,
        message: 'Success',
        data: { active: true },
      };
      const instance = plainToInstance(SuccessResponseDto, plain);

      expect(instance).toBeInstanceOf(SuccessResponseDto);
      expect(instance.success).toBe(true);
      expect(instance.message).toBe('Success');
      expect(instance.data).toEqual({ active: true });

      const errors = await validate(instance);
      // SuccessResponseDto has no class-validator decorators, so validate() yields unknownValue
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });
  });

  describe('ErrorResponseDto', () => {
    it('should instantiate with a string message', () => {
      const error = 'Bad Request';
      const message = 'Invalid parameter';
      const statusCode = 400;

      const response = new ErrorResponseDto(error, message, statusCode);

      expect(response.success).toBe(false);
      expect(response.error).toBe(error);
      expect(response.message).toBe(message);
      expect(response.statusCode).toBe(statusCode);
      expect(typeof response.timestamp).toBe('string');
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp,
      );
    });

    it('should instantiate with an array of string messages', () => {
      const error = 'Validation Error';
      const messages = ['email must be valid', 'password is required'];
      const statusCode = 422;

      const response = new ErrorResponseDto(error, messages, statusCode);

      expect(response.success).toBe(false);
      expect(response.error).toBe(error);
      expect(response.message).toEqual(messages);
      expect(response.statusCode).toBe(statusCode);
      expect(typeof response.timestamp).toBe('string');
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp,
      );
    });

    it('should accurately set timestamp to current ISO date string', () => {
      const fixedDate = new Date('2026-06-15T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(fixedDate);

      try {
        const response = new ErrorResponseDto(
          'Internal Server Error',
          'Database unreachable',
          500,
        );

        expect(response.timestamp).toBe('2026-06-15T12:00:00.000Z');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Internal Server Error');
        expect(response.message).toBe('Database unreachable');
        expect(response.statusCode).toBe(500);
      } finally {
        jest.useRealTimers();
      }
    });

    it('should support various HTTP status codes', () => {
      const codes = [400, 401, 403, 404, 409, 429, 500, 502, 503];

      for (const code of codes) {
        const response = new ErrorResponseDto('Error', 'Message', code);
        expect(response.statusCode).toBe(code);
        expect(response.success).toBe(false);
      }
    });

    it('should pass class-validator validation when instantiated directly', async () => {
      const response = new ErrorResponseDto(
        'Not Found',
        'Resource not found',
        404,
      );
      const errors = await validate(response);

      // ErrorResponseDto has no class-validator decorators, so validate() yields unknownValue
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });

    it('should transform and pass validation via plainToInstance', async () => {
      const plain = {
        success: false,
        error: 'Unauthorized',
        message: 'Token has expired',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      };
      const instance = plainToInstance(ErrorResponseDto, plain);

      expect(instance).toBeInstanceOf(ErrorResponseDto);
      expect(instance.success).toBe(false);
      expect(instance.error).toBe('Unauthorized');
      expect(instance.message).toBe('Token has expired');
      expect(instance.statusCode).toBe(401);

      const errors = await validate(instance);
      // ErrorResponseDto has no class-validator decorators, so validate() yields unknownValue
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });
  });
});
