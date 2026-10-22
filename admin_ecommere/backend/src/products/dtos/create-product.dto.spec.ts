import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto, CreateVariantDto } from './create-product.dto';

describe('CreateProductDto and CreateVariantDto in create-product.dto', () => {
  describe('CreateVariantDto', () => {
    it('should instantiate the variant DTO directly and assign properties', () => {
      const dto = new CreateVariantDto();
      dto.scent = 'Lavender';
      dto.volumeMl = 250;
      dto.price = 250000;
      dto.salePrice = 200000;
      dto.stock = 50;
      dto.barcode = '8851234567890';

      expect(dto).toBeInstanceOf(CreateVariantDto);
      expect(dto.scent).toBe('Lavender');
      expect(dto.volumeMl).toBe(250);
      expect(dto.price).toBe(250000);
      expect(dto.salePrice).toBe(200000);
      expect(dto.stock).toBe(50);
      expect(dto.barcode).toBe('8851234567890');
    });

    describe('validation success paths', () => {
      it('should pass validation with all fields populated', async () => {
        const payload = {
          scent: 'Lavender',
          volumeMl: 250,
          price: 250000,
          salePrice: 200000,
          stock: 50,
          barcode: '8851234567890',
        };

        const dto = plainToInstance(CreateVariantDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.scent).toBe('Lavender');
        expect(dto.volumeMl).toBe(250);
        expect(dto.price).toBe(250000);
        expect(dto.salePrice).toBe(200000);
        expect(dto.stock).toBe(50);
        expect(dto.barcode).toBe('8851234567890');
      });

      it('should pass validation without optional fields (salePrice and barcode)', async () => {
        const payload = {
          scent: 'Lemongrass',
          volumeMl: 100,
          price: 150000,
          stock: 20,
        };

        const dto = plainToInstance(CreateVariantDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.salePrice).toBeUndefined();
        expect(dto.barcode).toBeUndefined();
      });

      it('should pass validation with boundary values (volumeMl=1, price=0, salePrice=0, stock=0)', async () => {
        const payload = {
          scent: 'Peppermint',
          volumeMl: 1,
          price: 0,
          salePrice: 0,
          stock: 0,
        };

        const dto = plainToInstance(CreateVariantDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.volumeMl).toBe(1);
        expect(dto.price).toBe(0);
        expect(dto.salePrice).toBe(0);
        expect(dto.stock).toBe(0);
      });

      it('should transform numeric string inputs into numbers via @Type', async () => {
        const payload = {
          scent: 'Jasmine',
          volumeMl: '500',
          price: '300000',
          salePrice: '250000',
          stock: '100',
        };

        const dto = plainToInstance(CreateVariantDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(typeof dto.volumeMl).toBe('number');
        expect(dto.volumeMl).toBe(500);
        expect(typeof dto.price).toBe('number');
        expect(dto.price).toBe(300000);
        expect(typeof dto.salePrice).toBe('number');
        expect(dto.salePrice).toBe(250000);
        expect(typeof dto.stock).toBe('number');
        expect(dto.stock).toBe(100);
      });
    });

    describe('validation failure paths', () => {
      it('should fail validation when scent is missing', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          volumeMl: 250,
          price: 250000,
          stock: 50,
        });

        const errors = await validate(dto);
        const scentError = errors.find((e) => e.property === 'scent');

        expect(scentError).toBeDefined();
        expect(scentError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when scent is not a string', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 12345,
          volumeMl: 250,
          price: 250000,
          stock: 50,
        });

        const errors = await validate(dto);
        const scentError = errors.find((e) => e.property === 'scent');

        expect(scentError).toBeDefined();
        expect(scentError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when volumeMl is missing', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          price: 250000,
          stock: 50,
        });

        const errors = await validate(dto);
        const volumeError = errors.find((e) => e.property === 'volumeMl');

        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when volumeMl is less than 1 (0 or negative)', async () => {
        const dtoZero = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 0,
          price: 250000,
          stock: 50,
        });
        const errorsZero = await validate(dtoZero);
        const volumeErrorZero = errorsZero.find(
          (e) => e.property === 'volumeMl',
        );

        expect(volumeErrorZero).toBeDefined();
        expect(volumeErrorZero?.constraints).toHaveProperty('min');

        const dtoNeg = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: -10,
          price: 250000,
          stock: 50,
        });
        const errorsNeg = await validate(dtoNeg);
        const volumeErrorNeg = errorsNeg.find((e) => e.property === 'volumeMl');

        expect(volumeErrorNeg).toBeDefined();
        expect(volumeErrorNeg?.constraints).toHaveProperty('min');
      });

      it('should fail validation when volumeMl is a decimal/float', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250.5,
          price: 250000,
          stock: 50,
        });

        const errors = await validate(dto);
        const volumeError = errors.find((e) => e.property === 'volumeMl');

        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when volumeMl cannot be transformed to a valid integer', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 'invalid-number',
          price: 250000,
          stock: 50,
        });

        const errors = await validate(dto);
        const volumeError = errors.find((e) => e.property === 'volumeMl');

        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when price is missing', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          stock: 50,
        });

        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'price');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when price is negative', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: -1,
          stock: 50,
        });

        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'price');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when price is a float', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 99.99,
          stock: 50,
        });

        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'price');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when salePrice is negative', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 250000,
          salePrice: -1,
          stock: 50,
        });

        const errors = await validate(dto);
        const salePriceError = errors.find((e) => e.property === 'salePrice');

        expect(salePriceError).toBeDefined();
        expect(salePriceError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when salePrice is a float', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 250000,
          salePrice: 199.99,
          stock: 50,
        });

        const errors = await validate(dto);
        const salePriceError = errors.find((e) => e.property === 'salePrice');

        expect(salePriceError).toBeDefined();
        expect(salePriceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when stock is missing', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 250000,
        });

        const errors = await validate(dto);
        const stockError = errors.find((e) => e.property === 'stock');

        expect(stockError).toBeDefined();
        expect(stockError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when stock is negative', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 250000,
          stock: -5,
        });

        const errors = await validate(dto);
        const stockError = errors.find((e) => e.property === 'stock');

        expect(stockError).toBeDefined();
        expect(stockError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when stock is a float', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 250000,
          stock: 12.34,
        });

        const errors = await validate(dto);
        const stockError = errors.find((e) => e.property === 'stock');

        expect(stockError).toBeDefined();
        expect(stockError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when barcode is not a string', async () => {
        const dto = plainToInstance(CreateVariantDto, {
          scent: 'Rose',
          volumeMl: 250,
          price: 250000,
          stock: 50,
          barcode: 1234567890,
        });

        const errors = await validate(dto);
        const barcodeError = errors.find((e) => e.property === 'barcode');

        expect(barcodeError).toBeDefined();
        expect(barcodeError?.constraints).toHaveProperty('isString');
      });
    });
  });

  describe('CreateProductDto', () => {
    const validVariant = {
      scent: 'Lavender',
      volumeMl: 250,
      price: 250000,
      salePrice: 200000,
      stock: 50,
      barcode: '8851234567890',
    };

    it('should instantiate CreateProductDto directly and assign properties', () => {
      const dto = new CreateProductDto();
      dto.name = 'Xịt Phòng Lavender Premium';
      dto.description = 'Xịt phòng cao cấp';
      dto.brand = 'Thai Aroma';
      dto.images = ['https://example.com/image.jpg'];
      dto.categoryId = 'category-123';
      dto.basePrice = 120000;
      dto.active = true;

      const variant = new CreateVariantDto();
      variant.scent = 'Lavender';
      variant.volumeMl = 250;
      variant.price = 250000;
      variant.stock = 50;
      dto.variants = [variant];

      expect(dto).toBeInstanceOf(CreateProductDto);
      expect(dto.name).toBe('Xịt Phòng Lavender Premium');
      expect(dto.description).toBe('Xịt phòng cao cấp');
      expect(dto.brand).toBe('Thai Aroma');
      expect(dto.images).toEqual(['https://example.com/image.jpg']);
      expect(dto.categoryId).toBe('category-123');
      expect(dto.basePrice).toBe(120000);
      expect(dto.active).toBe(true);
      expect(dto.variants).toHaveLength(1);
      expect(dto.variants[0]).toBeInstanceOf(CreateVariantDto);
    });

    describe('validation success paths', () => {
      it('should pass validation with all fields populated', async () => {
        const payload = {
          name: 'Xịt Phòng Lavender Premium',
          description: 'Xịt phòng hương Lavender cao cấp từ Thái Lan...',
          brand: 'Thai Aroma',
          images: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          categoryId: 'cat-uuid-001',
          basePrice: 120000,
          active: true,
          variants: [validVariant],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.name).toBe('Xịt Phòng Lavender Premium');
        expect(dto.description).toBe(
          'Xịt phòng hương Lavender cao cấp từ Thái Lan...',
        );
        expect(dto.brand).toBe('Thai Aroma');
        expect(dto.images).toHaveLength(2);
        expect(dto.categoryId).toBe('cat-uuid-001');
        expect(dto.basePrice).toBe(120000);
        expect(dto.active).toBe(true);
        expect(dto.variants).toHaveLength(1);
        expect(dto.variants[0]).toBeInstanceOf(CreateVariantDto);
      });

      it('should pass validation without optional fields (brand and active omitted)', async () => {
        const payload = {
          name: 'Xịt Phòng Lemongrass',
          description: 'Hương sả tự nhiên',
          images: ['https://example.com/sả.jpg'],
          categoryId: 'cat-uuid-002',
          basePrice: 100000,
          variants: [
            {
              scent: 'Lemongrass',
              volumeMl: 100,
              price: 100000,
              stock: 10,
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.brand).toBeUndefined();
        expect(dto.active).toBeUndefined();
      });

      it('should pass validation when active is explicitly set to false', async () => {
        const payload = {
          name: 'Xịt Phòng Inactive',
          description: 'Sản phẩm tạm dừng bán',
          images: ['https://example.com/inactive.jpg'],
          categoryId: 'cat-uuid-003',
          basePrice: 50000,
          active: false,
          variants: [
            {
              scent: 'Rose',
              volumeMl: 100,
              price: 50000,
              stock: 0,
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.active).toBe(false);
      });

      it('should pass validation with boundary basePrice of 0', async () => {
        const payload = {
          name: 'Sản phẩm dùng thử',
          description: 'Hàng mẫu miễn phí',
          images: ['https://example.com/free.jpg'],
          categoryId: 'cat-uuid-004',
          basePrice: 0,
          variants: [
            {
              scent: 'Sample Scent',
              volumeMl: 10,
              price: 0,
              stock: 10,
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.basePrice).toBe(0);
      });

      it('should transform numeric string basePrice into number via @Type', async () => {
        const payload = {
          name: 'Xịt Phòng Jasmine',
          description: 'Hương hoa nhài',
          images: ['https://example.com/jasmine.jpg'],
          categoryId: 'cat-uuid-005',
          basePrice: '150000',
          variants: [
            {
              scent: 'Jasmine',
              volumeMl: '200',
              price: '150000',
              stock: '25',
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(typeof dto.basePrice).toBe('number');
        expect(dto.basePrice).toBe(150000);
        expect(typeof dto.variants[0].volumeMl).toBe('number');
        expect(dto.variants[0].volumeMl).toBe(200);
      });

      it('should pass validation with multiple valid variants', async () => {
        const payload = {
          name: 'Xịt Phòng Đa Hương',
          description: 'Nhiều dung tích và mùi hương',
          images: ['https://example.com/multi.jpg'],
          categoryId: 'cat-uuid-006',
          basePrice: 90000,
          variants: [
            {
              scent: 'Lavender',
              volumeMl: 100,
              price: 90000,
              stock: 30,
            },
            {
              scent: 'Citrus',
              volumeMl: 300,
              price: 220000,
              stock: 15,
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.variants).toHaveLength(2);
      });

      it('should accept empty array of images since @IsArray and @IsString each validate elements', async () => {
        const payload = {
          name: 'Xịt Phòng No Images',
          description: 'Chưa có ảnh',
          images: [],
          categoryId: 'cat-uuid-007',
          basePrice: 80000,
          variants: [
            {
              scent: 'Mint',
              volumeMl: 100,
              price: 80000,
              stock: 5,
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.images).toEqual([]);
      });
    });

    describe('validation failure paths', () => {
      const getValidBase = () => ({
        name: 'Xịt Phòng Test',
        description: 'Mô tả test',
        brand: 'Test Brand',
        images: ['https://example.com/test.jpg'],
        categoryId: 'cat-test',
        basePrice: 100000,
        active: true,
        variants: [
          {
            scent: 'Test Scent',
            volumeMl: 100,
            price: 100000,
            stock: 10,
          },
        ],
      });

      it('should fail validation when name is missing', async () => {
        const payload = getValidBase();
        delete (payload as any).name;

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const nameError = errors.find((e) => e.property === 'name');

        expect(nameError).toBeDefined();
        expect(nameError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when name is not a string', async () => {
        const payload = { ...getValidBase(), name: 12345 };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const nameError = errors.find((e) => e.property === 'name');

        expect(nameError).toBeDefined();
        expect(nameError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when description is missing', async () => {
        const payload = getValidBase();
        delete (payload as any).description;

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const descError = errors.find((e) => e.property === 'description');

        expect(descError).toBeDefined();
        expect(descError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when description is not a string', async () => {
        const payload = { ...getValidBase(), description: false };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const descError = errors.find((e) => e.property === 'description');

        expect(descError).toBeDefined();
        expect(descError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when brand is provided but not a string', async () => {
        const payload = { ...getValidBase(), brand: 999 };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const brandError = errors.find((e) => e.property === 'brand');

        expect(brandError).toBeDefined();
        expect(brandError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when images is missing', async () => {
        const payload = getValidBase();
        delete (payload as any).images;

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const imagesError = errors.find((e) => e.property === 'images');

        expect(imagesError).toBeDefined();
        expect(imagesError?.constraints).toHaveProperty('isArray');
      });

      it('should fail validation when images is not an array', async () => {
        const payload = {
          ...getValidBase(),
          images: 'https://single-image.jpg',
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const imagesError = errors.find((e) => e.property === 'images');

        expect(imagesError).toBeDefined();
        expect(imagesError?.constraints).toHaveProperty('isArray');
      });

      it('should fail validation when images array contains non-string elements', async () => {
        const payload = {
          ...getValidBase(),
          images: ['https://example.com/ok.jpg', 12345, null],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const imagesError = errors.find((e) => e.property === 'images');

        expect(imagesError).toBeDefined();
        expect(imagesError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when categoryId is missing', async () => {
        const payload = getValidBase();
        delete (payload as any).categoryId;

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const catError = errors.find((e) => e.property === 'categoryId');

        expect(catError).toBeDefined();
        expect(catError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when categoryId is not a string', async () => {
        const payload = { ...getValidBase(), categoryId: 1001 };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const catError = errors.find((e) => e.property === 'categoryId');

        expect(catError).toBeDefined();
        expect(catError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when basePrice is missing', async () => {
        const payload = getValidBase();
        delete (payload as any).basePrice;

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'basePrice');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when basePrice is negative', async () => {
        const payload = { ...getValidBase(), basePrice: -100 };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'basePrice');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when basePrice is a float', async () => {
        const payload = { ...getValidBase(), basePrice: 12000.5 };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'basePrice');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when basePrice cannot be transformed to an integer', async () => {
        const payload = { ...getValidBase(), basePrice: 'not-a-number' };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const priceError = errors.find((e) => e.property === 'basePrice');

        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when active is provided but not a boolean', async () => {
        const payload = { ...getValidBase(), active: 'true' };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const activeError = errors.find((e) => e.property === 'active');

        expect(activeError).toBeDefined();
        expect(activeError?.constraints).toHaveProperty('isBoolean');
      });

      it('should fail validation when variants is missing', async () => {
        const payload = getValidBase();
        delete (payload as any).variants;

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const varError = errors.find((e) => e.property === 'variants');

        expect(varError).toBeDefined();
        expect(varError?.constraints).toHaveProperty('isArray');
      });

      it('should fail validation when variants is not an array', async () => {
        const payload = { ...getValidBase(), variants: 'not-an-array' };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const varError = errors.find((e) => e.property === 'variants');

        expect(varError).toBeDefined();
        expect(varError?.constraints).toHaveProperty('isArray');
      });

      it('should fail validation when variants array is empty (< 1 item)', async () => {
        const payload = { ...getValidBase(), variants: [] };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const varError = errors.find((e) => e.property === 'variants');

        expect(varError).toBeDefined();
        expect(varError?.constraints).toHaveProperty('arrayMinSize');
      });

      it('should fail validation when a nested variant item is invalid', async () => {
        const payload = {
          ...getValidBase(),
          variants: [
            {
              scent: 123, // invalid: should be string
              volumeMl: 0, // invalid: should be >= 1
              price: -10, // invalid: should be >= 0
              stock: -5, // invalid: should be >= 0
            },
          ],
        };

        const dto = plainToInstance(CreateProductDto, payload);
        const errors = await validate(dto);
        const varError = errors.find((e) => e.property === 'variants');

        expect(varError).toBeDefined();
        expect(varError?.children?.length).toBeGreaterThan(0);

        const childErrors = varError?.children?.[0]?.children ?? [];
        const scentErr = childErrors.find((c) => c.property === 'scent');
        const volErr = childErrors.find((c) => c.property === 'volumeMl');
        const priceErr = childErrors.find((c) => c.property === 'price');
        const stockErr = childErrors.find((c) => c.property === 'stock');

        expect(scentErr?.constraints).toHaveProperty('isString');
        expect(volErr?.constraints).toHaveProperty('min');
        expect(priceErr?.constraints).toHaveProperty('min');
        expect(stockErr?.constraints).toHaveProperty('min');
      });
    });
  });
});
