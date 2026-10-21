import { ReviewEntity } from './review.entity';

describe('ReviewEntity', () => {
  it('should be defined', () => {
    expect(ReviewEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of ReviewEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const reviewData: Partial<ReviewEntity> = {
        id: 'review-123',
        productId: 'prod-456',
        userId: 'user-789',
        rating: 5,
        comment: 'Excellent product!',
        createdAt,
        updatedAt,
        user: {
          id: 'user-789',
          name: 'John Doe',
          email: 'john@example.com',
        },
        product: {
          id: 'prod-456',
          name: 'Sample Product',
          price: 100,
        },
      };

      const entity = new ReviewEntity(reviewData);

      expect(entity).toBeInstanceOf(ReviewEntity);
      expect(entity.id).toBe('review-123');
      expect(entity.productId).toBe('prod-456');
      expect(entity.userId).toBe('user-789');
      expect(entity.rating).toBe(5);
      expect(entity.comment).toBe('Excellent product!');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.user).toEqual({
        id: 'user-789',
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(entity.product).toEqual({
        id: 'prod-456',
        name: 'Sample Product',
        price: 100,
      });
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-01T00:00:00.000Z');
      const partialData: Partial<ReviewEntity> = {
        id: 'review-min',
        productId: 'prod-1',
        userId: 'user-1',
        rating: 4,
        comment: 'Good quality',
        createdAt,
        updatedAt,
      };

      const entity = new ReviewEntity(partialData);

      expect(entity).toBeInstanceOf(ReviewEntity);
      expect(entity.id).toBe('review-min');
      expect(entity.productId).toBe('prod-1');
      expect(entity.userId).toBe('user-1');
      expect(entity.rating).toBe(4);
      expect(entity.comment).toBe('Good quality');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.user).toBeUndefined();
      expect(entity.product).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new ReviewEntity({});

      expect(entity).toBeInstanceOf(ReviewEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.productId).toBeUndefined();
      expect(entity.userId).toBeUndefined();
      expect(entity.rating).toBeUndefined();
      expect(entity.comment).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.user).toBeUndefined();
      expect(entity.product).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<ReviewEntity> = {
        id: 'review-partial',
        rating: 3,
      };

      const entity = new ReviewEntity(partialData);

      expect(entity).toBeInstanceOf(ReviewEntity);
      expect(entity.id).toBe('review-partial');
      expect(entity.rating).toBe(3);
      expect(entity.productId).toBeUndefined();
      expect(entity.userId).toBeUndefined();
      expect(entity.comment).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.user).toBeUndefined();
      expect(entity.product).toBeUndefined();
    });

    it('should support rating boundary values (1 to 5)', () => {
      for (let rating = 1; rating <= 5; rating++) {
        const entity = new ReviewEntity({ rating });
        expect(entity).toBeInstanceOf(ReviewEntity);
        expect(entity.rating).toBe(rating);
      }
    });

    it('should handle zero rating value properly', () => {
      const entity = new ReviewEntity({ rating: 0 });

      expect(entity).toBeInstanceOf(ReviewEntity);
      expect(entity.rating).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new ReviewEntity(
        null as unknown as Partial<ReviewEntity>,
      );
      expect(entityNull).toBeInstanceOf(ReviewEntity);

      const entityUndefined = new ReviewEntity(
        undefined as unknown as Partial<ReviewEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(ReviewEntity);
    });
  });
});
