import { ProductEntity, ProductVariantEntity } from './product.entity';

describe('ProductVariantEntity', () => {
  it('should be defined', () => {
    expect(ProductVariantEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of ProductVariantEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const variantData: Partial<ProductVariantEntity> = {
        id: 'var-123',
        productId: 'prod-123',
        sku: 'SKU-PERFUME-100',
        scent: 'Citrus',
        volumeMl: 100,
        price: 150000,
        salePrice: 120000,
        stock: 50,
        barcode: '1234567890123',
        createdAt,
        updatedAt,
      };

      const entity = new ProductVariantEntity(variantData);

      expect(entity).toBeInstanceOf(ProductVariantEntity);
      expect(entity.id).toBe('var-123');
      expect(entity.productId).toBe('prod-123');
      expect(entity.sku).toBe('SKU-PERFUME-100');
      expect(entity.scent).toBe('Citrus');
      expect(entity.volumeMl).toBe(100);
      expect(entity.price).toBe(150000);
      expect(entity.salePrice).toBe(120000);
      expect(entity.stock).toBe(50);
      expect(entity.barcode).toBe('1234567890123');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const variantData: Partial<ProductVariantEntity> = {
        id: 'var-required-only',
        productId: 'prod-123',
        sku: 'SKU-BASIC-50',
        scent: 'Floral',
        volumeMl: 50,
        price: 80000,
        stock: 10,
        createdAt,
        updatedAt,
      };

      const entity = new ProductVariantEntity(variantData);

      expect(entity).toBeInstanceOf(ProductVariantEntity);
      expect(entity.id).toBe('var-required-only');
      expect(entity.productId).toBe('prod-123');
      expect(entity.sku).toBe('SKU-BASIC-50');
      expect(entity.scent).toBe('Floral');
      expect(entity.volumeMl).toBe(50);
      expect(entity.price).toBe(80000);
      expect(entity.stock).toBe(10);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.salePrice).toBeUndefined();
      expect(entity.barcode).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new ProductVariantEntity({});

      expect(entity).toBeInstanceOf(ProductVariantEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.productId).toBeUndefined();
      expect(entity.sku).toBeUndefined();
      expect(entity.scent).toBeUndefined();
      expect(entity.volumeMl).toBeUndefined();
      expect(entity.price).toBeUndefined();
      expect(entity.salePrice).toBeUndefined();
      expect(entity.stock).toBeUndefined();
      expect(entity.barcode).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<ProductVariantEntity> = {
        sku: 'SKU-PARTIAL',
        price: 99000,
      };

      const entity = new ProductVariantEntity(partialData);

      expect(entity).toBeInstanceOf(ProductVariantEntity);
      expect(entity.sku).toBe('SKU-PARTIAL');
      expect(entity.price).toBe(99000);
      expect(entity.id).toBeUndefined();
      expect(entity.productId).toBeUndefined();
      expect(entity.scent).toBeUndefined();
      expect(entity.volumeMl).toBeUndefined();
      expect(entity.salePrice).toBeUndefined();
      expect(entity.stock).toBeUndefined();
      expect(entity.barcode).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should handle zero numeric values properly', () => {
      const entity = new ProductVariantEntity({
        volumeMl: 0,
        price: 0,
        salePrice: 0,
        stock: 0,
      });

      expect(entity).toBeInstanceOf(ProductVariantEntity);
      expect(entity.volumeMl).toBe(0);
      expect(entity.price).toBe(0);
      expect(entity.salePrice).toBe(0);
      expect(entity.stock).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new ProductVariantEntity(
        null as unknown as Partial<ProductVariantEntity>,
      );
      expect(entityNull).toBeInstanceOf(ProductVariantEntity);

      const entityUndefined = new ProductVariantEntity(
        undefined as unknown as Partial<ProductVariantEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(ProductVariantEntity);
    });
  });
});

describe('ProductEntity', () => {
  it('should be defined', () => {
    expect(ProductEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of ProductEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const variantCreatedAt = new Date('2026-01-01T00:00:00.000Z');
      const variantUpdatedAt = new Date('2026-01-02T00:00:00.000Z');

      const variant = new ProductVariantEntity({
        id: 'var-1',
        productId: 'prod-123',
        sku: 'SKU-001',
        scent: 'Woody',
        volumeMl: 50,
        price: 200000,
        salePrice: 180000,
        stock: 25,
        barcode: '8930000000001',
        createdAt: variantCreatedAt,
        updatedAt: variantUpdatedAt,
      });

      const categoryMock = {
        id: 'cat-123',
        name: 'Perfumes',
        slug: 'perfumes',
      };

      const productData: Partial<ProductEntity> = {
        id: 'prod-123',
        name: 'Eau de Parfum',
        slug: 'eau-de-parfum',
        description: 'Luxury fragrance with notes of cedar and sandalwood.',
        brand: 'AromaLux',
        images: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
        ],
        categoryId: 'cat-123',
        basePrice: 200000,
        active: true,
        createdAt,
        updatedAt,
        variants: [variant],
        category: categoryMock,
        averageRating: 4.8,
        reviewCount: 125,
      };

      const entity = new ProductEntity(productData);

      expect(entity).toBeInstanceOf(ProductEntity);
      expect(entity.id).toBe('prod-123');
      expect(entity.name).toBe('Eau de Parfum');
      expect(entity.slug).toBe('eau-de-parfum');
      expect(entity.description).toBe(
        'Luxury fragrance with notes of cedar and sandalwood.',
      );
      expect(entity.brand).toBe('AromaLux');
      expect(entity.images).toEqual([
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ]);
      expect(entity.categoryId).toBe('cat-123');
      expect(entity.basePrice).toBe(200000);
      expect(entity.active).toBe(true);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.variants).toHaveLength(1);
      expect(entity.variants?.[0]).toBe(variant);
      expect(entity.category).toEqual(categoryMock);
      expect(entity.averageRating).toBe(4.8);
      expect(entity.reviewCount).toBe(125);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');

      const productData: Partial<ProductEntity> = {
        id: 'prod-req-only',
        name: 'Simple Fragrance',
        slug: 'simple-fragrance',
        description: 'Simple description.',
        images: ['https://example.com/img.jpg'],
        categoryId: 'cat-basic',
        basePrice: 100000,
        active: false,
        createdAt,
        updatedAt,
      };

      const entity = new ProductEntity(productData);

      expect(entity).toBeInstanceOf(ProductEntity);
      expect(entity.id).toBe('prod-req-only');
      expect(entity.name).toBe('Simple Fragrance');
      expect(entity.slug).toBe('simple-fragrance');
      expect(entity.description).toBe('Simple description.');
      expect(entity.images).toEqual(['https://example.com/img.jpg']);
      expect(entity.categoryId).toBe('cat-basic');
      expect(entity.basePrice).toBe(100000);
      expect(entity.active).toBe(false);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.brand).toBeUndefined();
      expect(entity.variants).toBeUndefined();
      expect(entity.category).toBeUndefined();
      expect(entity.averageRating).toBeUndefined();
      expect(entity.reviewCount).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new ProductEntity({});

      expect(entity).toBeInstanceOf(ProductEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.name).toBeUndefined();
      expect(entity.slug).toBeUndefined();
      expect(entity.description).toBeUndefined();
      expect(entity.brand).toBeUndefined();
      expect(entity.images).toBeUndefined();
      expect(entity.categoryId).toBeUndefined();
      expect(entity.basePrice).toBeUndefined();
      expect(entity.active).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.variants).toBeUndefined();
      expect(entity.category).toBeUndefined();
      expect(entity.averageRating).toBeUndefined();
      expect(entity.reviewCount).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<ProductEntity> = {
        name: 'Partial Product',
        basePrice: 50000,
        active: true,
      };

      const entity = new ProductEntity(partialData);

      expect(entity).toBeInstanceOf(ProductEntity);
      expect(entity.name).toBe('Partial Product');
      expect(entity.basePrice).toBe(50000);
      expect(entity.active).toBe(true);
      expect(entity.id).toBeUndefined();
      expect(entity.slug).toBeUndefined();
      expect(entity.description).toBeUndefined();
      expect(entity.brand).toBeUndefined();
      expect(entity.images).toBeUndefined();
      expect(entity.categoryId).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.variants).toBeUndefined();
      expect(entity.category).toBeUndefined();
      expect(entity.averageRating).toBeUndefined();
      expect(entity.reviewCount).toBeUndefined();
    });

    it('should handle zero numerical values and boolean false properly', () => {
      const entity = new ProductEntity({
        basePrice: 0,
        active: false,
        averageRating: 0,
        reviewCount: 0,
      });

      expect(entity).toBeInstanceOf(ProductEntity);
      expect(entity.basePrice).toBe(0);
      expect(entity.active).toBe(false);
      expect(entity.averageRating).toBe(0);
      expect(entity.reviewCount).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new ProductEntity(
        null as unknown as Partial<ProductEntity>,
      );
      expect(entityNull).toBeInstanceOf(ProductEntity);

      const entityUndefined = new ProductEntity(
        undefined as unknown as Partial<ProductEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(ProductEntity);
    });
  });
});
