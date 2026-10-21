import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AdminReviewFilterDto } from './admin-review-filter.dto';
import { ReviewFilterDto } from './review-filter.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('AdminReviewFilterDto', () => {
  it('should be defined and instantiate correctly with defaults', () => {
    const dto = new AdminReviewFilterDto();

    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(AdminReviewFilterDto);
    expect(dto).toBeInstanceOf(ReviewFilterDto);
    expect(dto).toBeInstanceOf(PaginationDto);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.rating).toBeUndefined();
    expect(dto.productId).toBeUndefined();
  });

  it('should pass validation with default values on direct instantiation', async () => {
    const dto = new AdminReviewFilterDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  describe('valid cases', () => {
    it('should assign default values and pass validation when transforming empty object', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {});

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.rating).toBeUndefined();
      expect(dto.productId).toBeUndefined();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when all fields are undefined', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        page: undefined,
        limit: undefined,
        rating: undefined,
        productId: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all valid values provided', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        page: 2,
        limit: 50,
        rating: 4,
        productId: 'product-uuid-1234',
      });

      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(50);
      expect(dto.rating).toBe(4);
      expect(dto.productId).toBe('product-uuid-1234');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with boundary values: page=1, limit=1, rating=1', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        page: 1,
        limit: 1,
        rating: 1,
      });

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(1);
      expect(dto.rating).toBe(1);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with boundary values: limit=100, rating=5', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        limit: 100,
        rating: 5,
      });

      expect(dto.limit).toBe(100);
      expect(dto.rating).toBe(5);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it.each([1, 2, 3, 4, 5])(
      'should accept valid rating value: %i',
      async (rating: number) => {
        const dto = plainToInstance(AdminReviewFilterDto, { rating });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      },
    );

    it('should pass validation with productId at max allowed length of 64 chars', async () => {
      const longProductId = 'a'.repeat(64);
      const dto = plainToInstance(AdminReviewFilterDto, {
        productId: longProductId,
      });

      expect(dto.productId).toBe(longProductId);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty string for productId', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        productId: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should transform numeric string inputs to numbers via @Type', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        page: '3',
        limit: '15',
        rating: '4',
      });

      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(15);
      expect(dto.rating).toBe(4);
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');
      expect(typeof dto.rating).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with direct property assignment', async () => {
      const dto = new AdminReviewFilterDto();
      dto.page = 5;
      dto.limit = 30;
      dto.rating = 3;
      dto.productId = 'prod-123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validation failures on page', () => {
    it('should fail validation when page is less than 1 (page=0)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { page: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when page is negative', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { page: -1 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when page is not an integer', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { page: 2.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when page is a non-numeric string', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { page: 'invalid' });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('validation failures on limit', () => {
    it('should fail validation when limit is less than 1 (limit=0)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { limit: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when limit is negative', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { limit: -10 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when limit exceeds maximum of 100 (limit=101)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { limit: 101 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.max).toBeDefined();
    });

    it('should fail validation when limit is not an integer', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { limit: 20.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when limit is a non-numeric string', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { limit: 'abc' });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('validation failures on rating', () => {
    it('should fail validation when rating is less than 1 (rating=0)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { rating: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when rating is negative', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { rating: -2 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when rating exceeds maximum of 5 (rating=6)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { rating: 6 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.max).toBeDefined();
    });

    it('should fail validation when rating is not an integer', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, { rating: 3.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when rating is a non-numeric string', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        rating: 'not-a-number',
      });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('validation failures on productId', () => {
    it('should fail validation when productId exceeds maximum length of 64 characters', async () => {
      const tooLongId = 'a'.repeat(65);
      const dto = plainToInstance(AdminReviewFilterDto, {
        productId: tooLongId,
      });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints?.maxLength).toBeDefined();
    });

    it('should fail validation when productId is not a string (number)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        productId: 12345,
      });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints?.isString).toBeDefined();
    });

    it('should fail validation when productId is not a string (boolean)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        productId: true,
      });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints?.isString).toBeDefined();
    });

    it('should fail validation when productId is not a string (object)', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        productId: { id: 'some-id' },
      });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints?.isString).toBeDefined();
    });
  });

  describe('multiple validation failures', () => {
    it('should report errors for all invalid properties simultaneously', async () => {
      const dto = plainToInstance(AdminReviewFilterDto, {
        page: 0,
        limit: 150,
        rating: 10,
        productId: 'x'.repeat(65),
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(4);
      const properties = errors.map((e) => e.property);
      expect(properties).toContain('page');
      expect(properties).toContain('limit');
      expect(properties).toContain('rating');
      expect(properties).toContain('productId');
    });
  });
});
