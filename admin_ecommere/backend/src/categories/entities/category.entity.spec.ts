import { CategoryEntity } from './category.entity';

describe('CategoryEntity', () => {
  it('should be defined', () => {
    expect(CategoryEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of CategoryEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const categoryData: Partial<CategoryEntity> = {
        id: 'cat-123',
        name: 'Electronics',
        slug: 'electronics',
        parentId: 'parent-cat-456',
        createdAt,
        updatedAt,
        productCount: 42,
      };

      const entity = new CategoryEntity(categoryData);

      expect(entity).toBeInstanceOf(CategoryEntity);
      expect(entity.id).toBe('cat-123');
      expect(entity.name).toBe('Electronics');
      expect(entity.slug).toBe('electronics');
      expect(entity.parentId).toBe('parent-cat-456');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.productCount).toBe(42);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-01T00:00:00.000Z');
      const partialData: Partial<CategoryEntity> = {
        id: 'cat-root',
        name: 'Books',
        slug: 'books',
        createdAt,
        updatedAt,
      };

      const entity = new CategoryEntity(partialData);

      expect(entity).toBeInstanceOf(CategoryEntity);
      expect(entity.id).toBe('cat-root');
      expect(entity.name).toBe('Books');
      expect(entity.slug).toBe('books');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.parentId).toBeUndefined();
      expect(entity.productCount).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new CategoryEntity({});

      expect(entity).toBeInstanceOf(CategoryEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.name).toBeUndefined();
      expect(entity.slug).toBeUndefined();
      expect(entity.parentId).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.productCount).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<CategoryEntity> = {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
      };

      const entity = new CategoryEntity(partialData);

      expect(entity).toBeInstanceOf(CategoryEntity);
      expect(entity.name).toBe('Home & Kitchen');
      expect(entity.slug).toBe('home-kitchen');
      expect(entity.id).toBeUndefined();
      expect(entity.parentId).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.productCount).toBeUndefined();
    });

    it('should handle parentId and productCount with falsy and zero values correctly', () => {
      const entity = new CategoryEntity({
        id: 'cat-zero',
        name: 'Zero Products',
        slug: 'zero-products',
        parentId: undefined,
        productCount: 0,
      });

      expect(entity).toBeInstanceOf(CategoryEntity);
      expect(entity.id).toBe('cat-zero');
      expect(entity.name).toBe('Zero Products');
      expect(entity.slug).toBe('zero-products');
      expect(entity.parentId).toBeUndefined();
      expect(entity.productCount).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new CategoryEntity(
        null as unknown as Partial<CategoryEntity>,
      );
      expect(entityNull).toBeInstanceOf(CategoryEntity);

      const entityUndefined = new CategoryEntity(
        undefined as unknown as Partial<CategoryEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(CategoryEntity);
    });
  });
});
