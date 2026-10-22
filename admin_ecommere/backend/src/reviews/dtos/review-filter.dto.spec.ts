import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ReviewFilterDto } from './review-filter.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('ReviewFilterDto', () => {
  it('should be defined and instantiate correctly with defaults', () => {
    const dto = new ReviewFilterDto();

    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(ReviewFilterDto);
    expect(dto).toBeInstanceOf(PaginationDto);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.rating).toBeUndefined();
  });

  it('should pass validation with default values on direct instantiation', async () => {
    const dto = new ReviewFilterDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  describe('valid cases', () => {
    it('should assign default values and pass validation when transforming empty object', async () => {
      const dto = plainToInstance(ReviewFilterDto, {});

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.rating).toBeUndefined();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when all fields are undefined', async () => {
      const dto = plainToInstance(ReviewFilterDto, {
        page: undefined,
        limit: undefined,
        rating: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all valid values provided', async () => {
      const dto = plainToInstance(ReviewFilterDto, {
        page: 3,
        limit: 15,
        rating: 4,
      });

      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(15);
      expect(dto.rating).toBe(4);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with boundary values: page=1, limit=1, rating=1', async () => {
      const dto = plainToInstance(ReviewFilterDto, {
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
      const dto = plainToInstance(ReviewFilterDto, {
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
        const dto = plainToInstance(ReviewFilterDto, { rating });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      },
    );

    it('should transform numeric string inputs to numbers via @Type', async () => {
      const dto = plainToInstance(ReviewFilterDto, {
        page: '2',
        limit: '30',
        rating: '5',
      });

      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(30);
      expect(dto.rating).toBe(5);
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');
      expect(typeof dto.rating).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with direct property assignment', async () => {
      const dto = new ReviewFilterDto();
      dto.page = 4;
      dto.limit = 25;
      dto.rating = 2;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validation failures on rating', () => {
    it('should fail validation when rating is less than 1 (rating=0)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { rating: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when rating is negative (rating=-1)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { rating: -1 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when rating exceeds maximum of 5 (rating=6)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { rating: 6 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.max).toBeDefined();
    });

    it('should fail validation when rating is not an integer (rating=3.5)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { rating: 3.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when rating is a non-numeric string', async () => {
      const dto = plainToInstance(ReviewFilterDto, { rating: 'not-a-number' });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when rating is a boolean', async () => {
      const dto = new ReviewFilterDto();
      (dto as any).rating = true;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('validation failures inherited from PaginationDto', () => {
    it('should fail validation when page is less than 1 (page=0)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { page: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when page is negative', async () => {
      const dto = plainToInstance(ReviewFilterDto, { page: -5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when page is not an integer', async () => {
      const dto = plainToInstance(ReviewFilterDto, { page: 1.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when limit is less than 1 (limit=0)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { limit: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when limit exceeds maximum of 100 (limit=101)', async () => {
      const dto = plainToInstance(ReviewFilterDto, { limit: 101 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.max).toBeDefined();
    });

    it('should fail validation when limit is not an integer', async () => {
      const dto = plainToInstance(ReviewFilterDto, { limit: 20.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('multiple validation failures', () => {
    it('should report errors for page, limit, and rating when all are invalid', async () => {
      const dto = plainToInstance(ReviewFilterDto, {
        page: 0,
        limit: 150,
        rating: 10,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(3);
      const properties = errors.map((e) => e.property);
      expect(properties).toContain('page');
      expect(properties).toContain('limit');
      expect(properties).toContain('rating');
    });
  });
});
