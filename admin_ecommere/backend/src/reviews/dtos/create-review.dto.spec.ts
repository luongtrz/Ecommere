import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReviewDto } from './create-review.dto';

describe('CreateReviewDto', () => {
  const createValidDtoData = () => ({
    productId: 'product-uuid-1',
    rating: 5,
    content: 'Great product! Smells amazing and lasts long.',
  });

  const toDto = (plain: Record<string, any>): CreateReviewDto => {
    return plainToInstance(CreateReviewDto, plain);
  };

  it('should be defined and instantiate correctly', () => {
    const dto = new CreateReviewDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(CreateReviewDto);
  });

  describe('valid cases', () => {
    it('should pass validation with complete and valid data', async () => {
      const dto = toDto(createValidDtoData());
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.productId).toBe('product-uuid-1');
      expect(dto.rating).toBe(5);
      expect(dto.content).toBe('Great product! Smells amazing and lasts long.');
    });

    it('should pass validation with direct property assignment on new instance', async () => {
      const dto = new CreateReviewDto();
      dto.productId = 'prod-99';
      dto.rating = 4;
      dto.content = 'Very nice fragrance';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it.each([1, 2, 3, 4, 5])(
      'should accept valid rating boundary and intermediate value: %i',
      async (rating: number) => {
        const dto = toDto({
          ...createValidDtoData(),
          rating,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.rating).toBe(rating);
      },
    );

    it('should transform numeric string rating to number via @Type', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: '4',
      });

      expect(dto.rating).toBe(4);
      expect(typeof dto.rating).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty string for content as valid string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept long text content', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: 'Long review text. '.repeat(50),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('productId validation failures', () => {
    it('should fail when productId is missing / undefined', async () => {
      const dto = toDto({
        rating: 5,
        content: 'Some review',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints).toHaveProperty('isString');
    });

    it('should fail when productId is null', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        productId: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints).toHaveProperty('isString');
    });

    it('should fail when productId is a number', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        productId: 12345,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints).toHaveProperty('isString');
    });

    it('should fail when productId is a boolean', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        productId: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints).toHaveProperty('isString');
    });

    it('should fail when productId is an object', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        productId: { id: 'uuid' },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints).toHaveProperty('isString');
    });

    it('should fail when productId is an array', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        productId: ['product-1'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const productError = errors.find((e) => e.property === 'productId');
      expect(productError).toBeDefined();
      expect(productError?.constraints).toHaveProperty('isString');
    });
  });

  describe('rating validation failures', () => {
    it('should fail when rating is missing / undefined', async () => {
      const dto = toDto({
        productId: 'product-1',
        content: 'Some review',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });

    it('should fail when rating is null', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
    });

    it('should fail when rating is less than minimum 1 (rating=0)', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.min).toBeDefined();
    });

    it('should fail when rating is negative (rating=-1)', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.min).toBeDefined();
    });

    it('should fail when rating is greater than maximum 5 (rating=6)', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: 6,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.max).toBeDefined();
    });

    it('should fail when rating is not an integer (rating=4.5)', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: 4.5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });

    it('should fail when rating is a non-numeric string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        rating: 'invalid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });

    it('should fail when rating is a boolean', async () => {
      const dto = new CreateReviewDto();
      dto.productId = 'product-uuid-1';
      dto.content = 'Great product! Smells amazing and lasts long.';
      (dto as any).rating = true;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('content validation failures', () => {
    it('should fail when content is missing / undefined', async () => {
      const dto = toDto({
        productId: 'product-1',
        rating: 5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail when content is null', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail when content is a number', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: 12345,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail when content is a boolean', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail when content is an object', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: { text: 'review' },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });

    it('should fail when content is an array', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        content: ['review item'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find((e) => e.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('isString');
    });
  });

  describe('multiple validation failures', () => {
    it('should fail validation on all fields when empty object is provided', async () => {
      const dto = toDto({});
      const errors = await validate(dto);

      expect(errors).toHaveLength(3);
      const properties = errors.map((e) => e.property);
      expect(properties).toContain('productId');
      expect(properties).toContain('rating');
      expect(properties).toContain('content');
    });

    it('should fail validation on all fields when invalid types are provided', async () => {
      const dto = toDto({
        productId: 999,
        rating: 10,
        content: true,
      });
      const errors = await validate(dto);

      expect(errors).toHaveLength(3);
      const productError = errors.find((e) => e.property === 'productId');
      const ratingError = errors.find((e) => e.property === 'rating');
      const contentError = errors.find((e) => e.property === 'content');

      expect(productError?.constraints?.isString).toBeDefined();
      expect(ratingError?.constraints?.max).toBeDefined();
      expect(contentError?.constraints?.isString).toBeDefined();
    });
  });
});
