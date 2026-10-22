import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import * as classValidator from 'class-validator';
import { ValidationPipe } from './validation.pipe';

class SampleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(1)
  count: number;
}

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    jest.clearAllMocks();
    pipe = new ValidationPipe();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('metatype bypass checks', () => {
    it('should return value directly when metatype is undefined', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: undefined,
      };
      const value = { some: 'data' };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metatype is null', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: null as any,
      };
      const value = 'raw-string';

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metadata lacks metatype property', async () => {
      const metadata = { type: 'query' } as ArgumentMetadata;
      const value = 12345;

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metatype is String', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
      };
      const value = 'hello world';

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metatype is Boolean', async () => {
      const metadata: ArgumentMetadata = {
        type: 'query',
        metatype: Boolean,
      };
      const value = true;

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metatype is Number', async () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        metatype: Number,
      };
      const value = 42;

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metatype is Array', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Array,
      };
      const value = ['apple', 'banana'];

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should return value directly when metatype is Object', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
      };
      const value = { key: 'value' };

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });
  });

  describe('DTO validation', () => {
    it('should return the original value when DTO validation passes', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SampleDto,
      };
      const validValue = {
        title: 'Valid Product Title',
        count: 10,
      };

      const result = await pipe.transform(validValue, metadata);

      expect(result).toBe(validValue);
    });

    it('should throw BadRequestException with formatted error messages when validation fails', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SampleDto,
      };
      const invalidValue = {
        title: '',
        count: 0,
      };

      await expect(pipe.transform(invalidValue, metadata)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await pipe.transform(invalidValue, metadata);
        fail('Expected transform to throw BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('title should not be empty'),
            expect.stringContaining('count must not be less than 1'),
          ]),
        );
      }
    });

    it('should join multiple constraint error messages with comma', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SampleDto,
      };

      jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([
        {
          property: 'title',
          constraints: {
            isString: 'title must be a string',
            isNotEmpty: 'title should not be empty',
          },
        } as any,
      ]);

      try {
        await pipe.transform({ title: 123, count: 5 }, metadata);
        fail('Expected transform to throw BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.message).toEqual([
          'title must be a string, title should not be empty',
        ]);
      }
    });

    it('should handle validation error when error.constraints is undefined (fallback to empty object)', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SampleDto,
      };

      jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([
        {
          property: 'nestedField',
          constraints: undefined,
        } as any,
      ]);

      try {
        await pipe.transform({ title: 'Valid', count: 5 }, metadata);
        fail('Expected transform to throw BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.message).toEqual(['']);
      }
    });
  });
});
