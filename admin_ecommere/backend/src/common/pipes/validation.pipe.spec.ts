import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import * as classValidator from 'class-validator';
import * as classTransformer from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ValidationPipe } from './validation.pipe';

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;
  let plainToInstanceSpy: jest.SpyInstance;
  let validateSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.restoreAllMocks();
    plainToInstanceSpy = jest.spyOn(classTransformer, 'plainToInstance');
    validateSpy = jest.spyOn(classValidator, 'validate');

    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationPipe],
    }).compile();

    pipe = module.get<ValidationPipe>(ValidationPipe);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should be defined when resolved from TestingModule', () => {
      expect(pipe).toBeDefined();
    });

    it('should be instantiable directly with new ValidationPipe()', () => {
      const directPipe = new ValidationPipe();
      expect(directPipe).toBeDefined();
      expect(directPipe).toBeInstanceOf(ValidationPipe);
    });
  });

  describe('toValidate (private method)', () => {
    it('should return false for String constructor', () => {
      expect((pipe as any).toValidate(String)).toBe(false);
    });

    it('should return false for Boolean constructor', () => {
      expect((pipe as any).toValidate(Boolean)).toBe(false);
    });

    it('should return false for Number constructor', () => {
      expect((pipe as any).toValidate(Number)).toBe(false);
    });

    it('should return false for Array constructor', () => {
      expect((pipe as any).toValidate(Array)).toBe(false);
    });

    it('should return false for Object constructor', () => {
      expect((pipe as any).toValidate(Object)).toBe(false);
    });

    it('should return true for custom class constructor', () => {
      class CustomDto {}
      expect((pipe as any).toValidate(CustomDto)).toBe(true);
    });
  });

  describe('transform - bypassing validation', () => {
    it('should return value unchanged when metatype is undefined', async () => {
      const value = { name: 'sample' };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('should return value unchanged when metatype is null', async () => {
      const value = 12345;
      const metadata: ArgumentMetadata = {
        type: 'query',
        metatype: null as any,
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('should return value unchanged when metatype is String', async () => {
      const value = 'test-string';
      const metadata: ArgumentMetadata = { type: 'param', metatype: String };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('should return value unchanged when metatype is Boolean', async () => {
      const value = true;
      const metadata: ArgumentMetadata = { type: 'query', metatype: Boolean };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('should return value unchanged when metatype is Number', async () => {
      const value = 42;
      const metadata: ArgumentMetadata = { type: 'param', metatype: Number };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('should return value unchanged when metatype is Array', async () => {
      const value = ['item1', 'item2'];
      const metadata: ArgumentMetadata = { type: 'body', metatype: Array };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('should return value unchanged when metatype is Object', async () => {
      const value = { prop: 'val' };
      const metadata: ArgumentMetadata = { type: 'body', metatype: Object };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
      expect(plainToInstanceSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
    });
  });

  describe('transform - validation execution with mocks', () => {
    class MockTargetDto {
      field?: string;
    }

    it('should transform value with plainToInstance and return value when validation succeeds', async () => {
      const input = { field: 'test value' };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: MockTargetDto,
      };
      const transformedInstance = new MockTargetDto();
      transformedInstance.field = 'test value';

      plainToInstanceSpy.mockReturnValue(transformedInstance);
      validateSpy.mockResolvedValue([]);

      const result = await pipe.transform(input, metadata);

      expect(plainToInstanceSpy).toHaveBeenCalledTimes(1);
      expect(plainToInstanceSpy).toHaveBeenCalledWith(MockTargetDto, input);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(validateSpy).toHaveBeenCalledWith(transformedInstance);
      expect(result).toBe(input);
    });

    it('should throw BadRequestException with formatted message for single error and single constraint', async () => {
      const input = { field: '' };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: MockTargetDto,
      };
      const transformedInstance = new MockTargetDto();
      const mockErrors: classValidator.ValidationError[] = [
        {
          property: 'field',
          constraints: {
            isNotEmpty: 'field should not be empty',
          },
        } as classValidator.ValidationError,
      ];

      plainToInstanceSpy.mockReturnValue(transformedInstance);
      validateSpy.mockResolvedValue(mockErrors);

      await expect(pipe.transform(input, metadata)).rejects.toThrow(
        BadRequestException,
      );
      await expect(pipe.transform(input, metadata)).rejects.toThrow(
        'Bad Request Exception',
      );

      let thrownError: any;
      try {
        await pipe.transform(input, metadata);
      } catch (err) {
        thrownError = err;
      }

      expect(plainToInstanceSpy).toHaveBeenCalledWith(MockTargetDto, input);
      expect(validateSpy).toHaveBeenCalledWith(transformedInstance);
      expect(thrownError).toBeInstanceOf(BadRequestException);
      expect(thrownError.message).toBe('Bad Request Exception');
      expect(thrownError.getResponse()).toEqual({
        statusCode: 400,
        message: ['field should not be empty'],
        error: 'Bad Request',
      });
    });

    it('should join multiple constraints with commas for a single error', async () => {
      const input = { field: 'ab' };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: MockTargetDto,
      };
      const transformedInstance = new MockTargetDto();
      const mockErrors: classValidator.ValidationError[] = [
        {
          property: 'field',
          constraints: {
            isString: 'field must be a string',
            minLength: 'field must be longer than or equal to 5 characters',
          },
        } as classValidator.ValidationError,
      ];

      plainToInstanceSpy.mockReturnValue(transformedInstance);
      validateSpy.mockResolvedValue(mockErrors);

      let thrownError: any;
      try {
        await pipe.transform(input, metadata);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(BadRequestException);
      expect(thrownError.getResponse()).toEqual({
        statusCode: 400,
        message: [
          'field must be a string, field must be longer than or equal to 5 characters',
        ],
        error: 'Bad Request',
      });
    });

    it('should return multiple formatted messages when there are multiple validation errors', async () => {
      const input = { username: '', email: 'invalid' };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: MockTargetDto,
      };
      const transformedInstance = new MockTargetDto();
      const mockErrors: classValidator.ValidationError[] = [
        {
          property: 'username',
          constraints: {
            isNotEmpty: 'username should not be empty',
            isAlphanumeric: 'username must contain only letters and numbers',
          },
        } as classValidator.ValidationError,
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as classValidator.ValidationError,
      ];

      plainToInstanceSpy.mockReturnValue(transformedInstance);
      validateSpy.mockResolvedValue(mockErrors);

      let thrownError: any;
      try {
        await pipe.transform(input, metadata);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(BadRequestException);
      expect(thrownError.getResponse()).toEqual({
        statusCode: 400,
        message: [
          'username should not be empty, username must contain only letters and numbers',
          'email must be an email',
        ],
        error: 'Bad Request',
      });
    });

    it('should handle validation errors when constraints is undefined', async () => {
      const input = { nested: {} };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: MockTargetDto,
      };
      const transformedInstance = new MockTargetDto();
      const mockErrors: classValidator.ValidationError[] = [
        {
          property: 'nested',
          constraints: undefined,
        } as any,
      ];

      plainToInstanceSpy.mockReturnValue(transformedInstance);
      validateSpy.mockResolvedValue(mockErrors);

      let thrownError: any;
      try {
        await pipe.transform(input, metadata);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(BadRequestException);
      expect(thrownError.getResponse()).toEqual({
        statusCode: 400,
        message: [''],
        error: 'Bad Request',
      });
    });

    it('should handle validation errors when constraints is an empty object', async () => {
      const input = { item: {} };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: MockTargetDto,
      };
      const transformedInstance = new MockTargetDto();
      const mockErrors: classValidator.ValidationError[] = [
        {
          property: 'item',
          constraints: {},
        } as any,
      ];

      plainToInstanceSpy.mockReturnValue(transformedInstance);
      validateSpy.mockResolvedValue(mockErrors);

      let thrownError: any;
      try {
        await pipe.transform(input, metadata);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(BadRequestException);
      expect(thrownError.getResponse()).toEqual({
        statusCode: 400,
        message: [''],
        error: 'Bad Request',
      });
    });
  });

  describe('transform - integration with actual class-validator decorators', () => {
    class CreateProductDto {
      @IsString()
      @IsNotEmpty()
      name: string;

      @IsNumber()
      @Min(0)
      price: number;
    }

    it('should pass validation and return input when data meets all decorator criteria', async () => {
      const validData = { name: 'Spray Paint', price: 150000 };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: CreateProductDto,
      };

      const result = await pipe.transform(validData, metadata);

      expect(result).toEqual(validData);
      expect(validateSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when data violates decorator criteria', async () => {
      const invalidData = { name: '', price: -100 };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: CreateProductDto,
      };

      await expect(pipe.transform(invalidData, metadata)).rejects.toThrow(
        BadRequestException,
      );

      let thrownError: any;
      try {
        await pipe.transform(invalidData, metadata);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(BadRequestException);
      const response: any = thrownError.getResponse();
      expect(response.statusCode).toBe(400);
      expect(Array.isArray(response.message)).toBe(true);
      expect(response.message.length).toBe(2);
    });
  });
});
