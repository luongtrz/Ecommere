import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateReviewDto } from './update-review.dto';

describe('UpdateReviewDto', () => {
  describe('instantiation', () => {
    it('should instantiate the DTO directly', () => {
      const dto = new UpdateReviewDto();
      dto.rating = 5;
      dto.content = 'Updated review content';

      expect(dto).toBeInstanceOf(UpdateReviewDto);
      expect(dto.rating).toBe(5);
      expect(dto.content).toBe('Updated review content');
    });
  });

  describe('validation - success cases', () => {
    it('should pass validation when all fields are omitted (empty object)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when fields are undefined', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: undefined,
        content: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid rating and content', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 5,
        content: 'Great product! Smells amazing and lasts long.',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.rating).toBe(5);
      expect(dto.content).toBe('Great product! Smells amazing and lasts long.');
    });

    it('should pass validation with valid rating only', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 3,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.rating).toBe(3);
      expect(dto.content).toBeUndefined();
    });

    it('should pass validation with valid content only', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        content: 'Pleasant and subtle scent.',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.rating).toBeUndefined();
      expect(dto.content).toBe('Pleasant and subtle scent.');
    });

    it('should transform numeric string rating into number via @Type and pass validation', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: '4',
        content: 'Very good quality',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.rating).toBe(4);
      expect(typeof dto.rating).toBe('number');
    });

    it('should accept minimum boundary rating (rating = 1)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.rating).toBe(1);
    });

    it('should accept maximum boundary rating (rating = 5)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.rating).toBe(5);
    });

    it('should omit productId from validation rules', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        productId: 12345,
        rating: 4,
        content: 'Still valid because productId is omitted',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeUndefined();
    });
  });

  describe('validation - failure cases on rating', () => {
    it('should fail validation when rating is less than 1 (rating = 0)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('min');
    });

    it('should fail validation when rating is negative (rating = -1)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('min');
    });

    it('should fail validation when rating exceeds maximum (rating = 6)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 6,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('max');
    });

    it('should fail validation when rating is not an integer (decimal rating = 3.5)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 3.5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when rating is a non-numeric string', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 'invalid-rating',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when rating is a boolean', async () => {
      const dto = new UpdateReviewDto();
      (dto as any).rating = true;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('isInt');
    });
  });

  describe('validation - failure cases on content', () => {
    it('should fail validation when content is not a string (number)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        content: 12345,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when content is not a string (boolean)', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        content: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when content is an object', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        content: { text: 'invalid content object' },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when content is an array', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        content: ['not', 'a', 'string'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });
  });

  describe('validation - multiple field failures', () => {
    it('should fail validation on both rating and content when both are invalid', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 10,
        content: 9999,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('rating');
      expect(errorProperties).toContain('content');

      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError?.constraints).toHaveProperty('max');

      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError?.constraints).toHaveProperty('isString');
    });
  });
});
