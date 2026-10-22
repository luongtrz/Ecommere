import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto, CreateVariantDto } from './create-product.dto';

describe('CreateProductDto and CreateVariantDto', () => {
  describe('CreateVariantDto', () => {
    describe('transformation via plainToInstance and @Type', () => {
      it('should transform numeric string inputs to numbers using @Type(() => Number)', () => {
        const plain = {
          scent: 'Lavender',
          volumeMl: '250',
          price: '250000',
          salePrice: '200000',
          stock: '50',
          barcode: 'BAR-123456',
        };

        const variant = plainToInstance(CreateVariantDto, plain);

        expect(variant).toBeInstanceOf(CreateVariantDto);
        expect(variant.scent).toBe('Lavender');
        expect(typeof variant.volumeMl).toBe('number');
        expect(variant.volumeMl).toBe(250);
        expect(typeof variant.price).toBe('number');
        expect(variant.price).toBe(250000);
        expect(typeof variant.salePrice).toBe('number');
        expect(variant.salePrice).toBe(200000);
        expect(typeof variant.stock).toBe('number');
        expect(variant.stock).toBe(50);
        expect(variant.barcode).toBe('BAR-123456');
      });

      it('should transform without optional salePrice and barcode', () => {
        const plain = {
          scent: 'Jasmine',
          volumeMl: 100,
          price: 150000,
          stock: 30,
        };

        const variant = plainToInstance(CreateVariantDto, plain);

        expect(variant).toBeInstanceOf(CreateVariantDto);
        expect(variant.salePrice).toBeUndefined();
        expect(variant.barcode).toBeUndefined();
      });
    });

    describe('validation via class-validator', () => {
      it('should pass validation with valid required and optional fields', async () => {
        const variant = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 250,
          price: 250000,
          salePrice: 200000,
          stock: 50,
          barcode: 'BAR-123',
        });

        const errors = await validate(variant);
        expect(errors).toHaveLength(0);
      });

      it('should pass validation without optional salePrice and barcode', async () => {
        const variant = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 250,
          price: 250000,
          stock: 50,
        });

        const errors = await validate(variant);
        expect(errors).toHaveLength(0);
      });

      it('should fail validation when scent is missing or not a string', async () => {
        const missingScent = plainToInstance(CreateVariantDto, {
          volumeMl: 250,
          price: 250000,
          stock: 50,
        });
        const errors1 = await validate(missingScent);
        expect(errors1.some((e) => e.property === 'scent')).toBe(true);

        const invalidScent = plainToInstance(CreateVariantDto, {
          scent: 12345 as any,
          volumeMl: 250,
          price: 250000,
          stock: 50,
        });
        const errors2 = await validate(invalidScent);
        expect(errors2.some((e) => e.property === 'scent')).toBe(true);
      });

      it('should fail validation when volumeMl is less than 1 or not an integer', async () => {
        const zeroVolume = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 0,
          price: 250000,
          stock: 50,
        });
        const errorsZero = await validate(zeroVolume);
        expect(errorsZero.some((e) => e.property === 'volumeMl')).toBe(true);

        const floatVolume = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 2.5,
          price: 250000,
          stock: 50,
        });
        const errorsFloat = await validate(floatVolume);
        expect(errorsFloat.some((e) => e.property === 'volumeMl')).toBe(true);
      });

      it('should fail validation when price is negative or not an integer', async () => {
        const negativePrice = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: -1,
          stock: 50,
        });
        const errorsNegative = await validate(negativePrice);
        expect(errorsNegative.some((e) => e.property === 'price')).toBe(true);

        const floatPrice = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: 15000.5,
          stock: 50,
        });
        const errorsFloat = await validate(floatPrice);
        expect(errorsFloat.some((e) => e.property === 'price')).toBe(true);
      });

      it('should fail validation when salePrice is negative or not an integer', async () => {
        const negativeSalePrice = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: 100000,
          salePrice: -50,
          stock: 50,
        });
        const errorsNegative = await validate(negativeSalePrice);
        expect(errorsNegative.some((e) => e.property === 'salePrice')).toBe(
          true,
        );

        const floatSalePrice = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: 100000,
          salePrice: 99.9,
          stock: 50,
        });
        const errorsFloat = await validate(floatSalePrice);
        expect(errorsFloat.some((e) => e.property === 'salePrice')).toBe(true);
      });

      it('should fail validation when stock is negative or not an integer', async () => {
        const negativeStock = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: 100000,
          stock: -10,
        });
        const errorsNegative = await validate(negativeStock);
        expect(errorsNegative.some((e) => e.property === 'stock')).toBe(true);

        const floatStock = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: 100000,
          stock: 5.5,
        });
        const errorsFloat = await validate(floatStock);
        expect(errorsFloat.some((e) => e.property === 'stock')).toBe(true);
      });

      it('should fail validation when barcode is not a string', async () => {
        const invalidBarcode = plainToInstance(CreateVariantDto, {
          scent: 'Lavender',
          volumeMl: 100,
          price: 100000,
          stock: 10,
          barcode: 123456 as any,
        });
        const errors = await validate(invalidBarcode);
        expect(errors.some((e) => e.property === 'barcode')).toBe(true);
      });
    });
  });

  describe('CreateProductDto', () => {
    describe('transformation via plainToInstance and @Type', () => {
      it('should transform basePrice to number and nested variants to CreateVariantDto instances', () => {
        const plain = {
          name: 'Xịt Phòng Lavender Premium',
          description: 'Xịt phòng hương Lavender cao cấp từ Thái Lan...',
          brand: 'Thai Aroma',
          images: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          categoryId: 'category-id-123',
          basePrice: '120000',
          active: true,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: '250',
              price: '250000',
              salePrice: '200000',
              stock: '50',
              barcode: 'BAR-001',
            },
            {
              scent: 'Lemongrass',
              volumeMl: '100',
              price: '150000',
              salePrice: '120000',
              stock: '30',
            },
          ],
        };

        const product = plainToInstance(CreateProductDto, plain);

        expect(product).toBeInstanceOf(CreateProductDto);
        expect(typeof product.basePrice).toBe('number');
        expect(product.basePrice).toBe(120000);

        expect(product.variants).toHaveLength(2);
        expect(product.variants[0]).toBeInstanceOf(CreateVariantDto);
        expect(product.variants[1]).toBeInstanceOf(CreateVariantDto);

        expect(product.variants[0].volumeMl).toBe(250);
        expect(typeof product.variants[0].volumeMl).toBe('number');
        expect(product.variants[0].price).toBe(250000);
        expect(typeof product.variants[0].price).toBe('number');
        expect(product.variants[0].salePrice).toBe(200000);
        expect(typeof product.variants[0].salePrice).toBe('number');
        expect(product.variants[0].stock).toBe(50);
        expect(typeof product.variants[0].stock).toBe('number');
      });

      it('should transform without optional brand and active fields', () => {
        const plain = {
          name: 'Simple Spray',
          description: 'A simple room spray',
          images: ['https://example.com/image.jpg'],
          categoryId: 'cat-1',
          basePrice: 50000,
          variants: [
            {
              scent: 'Mint',
              volumeMl: 50,
              price: 45000,
              stock: 20,
            },
          ],
        };

        const product = plainToInstance(CreateProductDto, plain);

        expect(product).toBeInstanceOf(CreateProductDto);
        expect(product.brand).toBeUndefined();
        expect(product.active).toBeUndefined();
      });
    });

    describe('validation via class-validator', () => {
      it('should pass validation with valid required and optional fields', async () => {
        const product = plainToInstance(CreateProductDto, {
          name: 'Xịt Phòng Lavender Premium',
          description: 'Xịt phòng hương Lavender cao cấp từ Thái Lan...',
          brand: 'Thai Aroma',
          images: ['https://example.com/image.jpg'],
          categoryId: 'category-id',
          basePrice: 120000,
          active: true,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 250,
              price: 250000,
              salePrice: 200000,
              stock: 50,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors).toHaveLength(0);
      });

      it('should pass validation without optional brand and active fields', async () => {
        const product = plainToInstance(CreateProductDto, {
          name: 'Xịt Phòng Lavender',
          description: 'Mô tả xịt phòng',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors).toHaveLength(0);
      });

      it('should fail validation when name is missing or not a string', async () => {
        const product = plainToInstance(CreateProductDto, {
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors.some((e) => e.property === 'name')).toBe(true);
      });

      it('should fail validation when description is missing or not a string', async () => {
        const product = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 12345 as any,
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors.some((e) => e.property === 'description')).toBe(true);
      });

      it('should fail validation when brand is provided but not a string', async () => {
        const product = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          brand: 12345 as any,
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors.some((e) => e.property === 'brand')).toBe(true);
      });

      it('should fail validation when images is not an array or contains non-strings', async () => {
        const productNotArray = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: 'https://example.com/not-array' as any,
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });
        const errors1 = await validate(productNotArray);
        expect(errors1.some((e) => e.property === 'images')).toBe(true);

        const productWithNumbers = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: [123, 456] as any,
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });
        const errors2 = await validate(productWithNumbers);
        expect(errors2.some((e) => e.property === 'images')).toBe(true);
      });

      it('should fail validation when categoryId is missing or not a string', async () => {
        const product = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors.some((e) => e.property === 'categoryId')).toBe(true);
      });

      it('should fail validation when basePrice is negative or not an integer', async () => {
        const negativeBasePrice = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: -5000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });
        const errorsNegative = await validate(negativeBasePrice);
        expect(errorsNegative.some((e) => e.property === 'basePrice')).toBe(
          true,
        );

        const floatBasePrice = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 1200.5,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });
        const errorsFloat = await validate(floatBasePrice);
        expect(errorsFloat.some((e) => e.property === 'basePrice')).toBe(true);
      });

      it('should fail validation when active is not a boolean', async () => {
        const product = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          active: 'yes' as any,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        });

        const errors = await validate(product);
        expect(errors.some((e) => e.property === 'active')).toBe(true);
      });

      it('should fail validation when variants is empty or not an array', async () => {
        const emptyVariants = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [],
        });
        const errorsEmpty = await validate(emptyVariants);
        expect(errorsEmpty.some((e) => e.property === 'variants')).toBe(true);

        const nonArrayVariants = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: 'not-an-array' as any,
        });
        const errorsNonArray = await validate(nonArrayVariants);
        expect(errorsNonArray.some((e) => e.property === 'variants')).toBe(
          true,
        );
      });

      it('should fail nested validation when a variant has invalid properties', async () => {
        const productWithInvalidVariant = plainToInstance(CreateProductDto, {
          name: 'Room Spray',
          description: 'Desc',
          images: ['https://example.com/img.jpg'],
          categoryId: 'cat-id',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 0, // fails @Min(1)
              price: -500, // fails @Min(0)
              stock: -1, // fails @Min(0)
            },
          ],
        });

        const errors = await validate(productWithInvalidVariant);
        expect(errors.some((e) => e.property === 'variants')).toBe(true);
      });
    });
  });
});
