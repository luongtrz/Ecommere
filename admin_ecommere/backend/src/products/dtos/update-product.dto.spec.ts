import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProductDto } from './update-product.dto';

describe('UpdateProductDto', () => {
  const getErrorForProperty = (
    errors: ValidationError[],
    property: string,
  ): ValidationError | undefined => {
    return errors.find((err) => err.property === property);
  };

  const transformAndValidate = async (
    plain: Record<string, unknown>,
  ): Promise<ValidationError[]> => {
    const dto = plainToInstance(UpdateProductDto, plain);
    return validate(dto);
  };

  it('should instantiate an UpdateProductDto instance', () => {
    const dto = new UpdateProductDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(UpdateProductDto);
  });

  describe('valid payloads', () => {
    it('should validate successfully when empty object is passed because all fields are optional', async () => {
      const errors = await transformAndValidate({});
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when all fields are valid', async () => {
      const validPayload = {
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
      };

      const errors = await transformAndValidate(validPayload);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when setting valid properties directly on an instance', async () => {
      const dto = new UpdateProductDto();
      dto.name = 'Xịt Phòng Tinh Dầu';
      dto.description = 'Chiết xuất từ thiên nhiên';
      dto.brand = 'Thai Herb';
      dto.images = ['https://example.com/herb.jpg'];
      dto.categoryId = 'cat-123';
      dto.basePrice = 150000;
      dto.active = false;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (only name)', async () => {
      const errors = await transformAndValidate({ name: 'Tên Mới' });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (only description)', async () => {
      const errors = await transformAndValidate({
        description: 'Mô tả cập nhật',
      });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (only brand)', async () => {
      const errors = await transformAndValidate({ brand: 'Brand Mới' });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (only images empty array)', async () => {
      const errors = await transformAndValidate({ images: [] });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (only categoryId)', async () => {
      const errors = await transformAndValidate({
        categoryId: 'cat-update-456',
      });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (basePrice = 0 at lower bound)', async () => {
      const errors = await transformAndValidate({ basePrice: 0 });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with active set to false', async () => {
      const errors = await transformAndValidate({ active: false });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when variants property is omitted or ignored (since variants is omitted from DTO)', async () => {
      const errors = await transformAndValidate({
        name: 'Sản phẩm không có variants',
        variants: [],
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid payloads', () => {
    describe('name validation', () => {
      it('should fail when name is not a string (number)', async () => {
        const errors = await transformAndValidate({ name: 12345 });
        const nameError = getErrorForProperty(errors, 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.constraints).toHaveProperty('isString');
      });

      it('should fail when name is not a string (boolean)', async () => {
        const errors = await transformAndValidate({ name: true });
        const nameError = getErrorForProperty(errors, 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.constraints).toHaveProperty('isString');
      });
    });

    describe('description validation', () => {
      it('should fail when description is not a string (number)', async () => {
        const errors = await transformAndValidate({ description: 98765 });
        const descError = getErrorForProperty(errors, 'description');
        expect(descError).toBeDefined();
        expect(descError?.constraints).toHaveProperty('isString');
      });

      it('should fail when description is not a string (array)', async () => {
        const errors = await transformAndValidate({ description: ['Invalid'] });
        const descError = getErrorForProperty(errors, 'description');
        expect(descError).toBeDefined();
        expect(descError?.constraints).toHaveProperty('isString');
      });
    });

    describe('brand validation', () => {
      it('should fail when brand is not a string (number)', async () => {
        const errors = await transformAndValidate({ brand: 123 });
        const brandError = getErrorForProperty(errors, 'brand');
        expect(brandError).toBeDefined();
        expect(brandError?.constraints).toHaveProperty('isString');
      });

      it('should fail when brand is not a string (boolean)', async () => {
        const errors = await transformAndValidate({ brand: false });
        const brandError = getErrorForProperty(errors, 'brand');
        expect(brandError).toBeDefined();
        expect(brandError?.constraints).toHaveProperty('isString');
      });
    });

    describe('images validation', () => {
      it('should fail when images is not an array (string)', async () => {
        const errors = await transformAndValidate({
          images: 'https://example.com/not-array.jpg',
        });
        const imagesError = getErrorForProperty(errors, 'images');
        expect(imagesError).toBeDefined();
        expect(imagesError?.constraints).toHaveProperty('isArray');
      });

      it('should fail when images is not an array (number)', async () => {
        const errors = await transformAndValidate({ images: 123 });
        const imagesError = getErrorForProperty(errors, 'images');
        expect(imagesError).toBeDefined();
        expect(imagesError?.constraints).toHaveProperty('isArray');
      });

      it('should fail when images array contains non-string elements', async () => {
        const errors = await transformAndValidate({
          images: ['https://example.com/valid.jpg', 12345],
        });
        const imagesError = getErrorForProperty(errors, 'images');
        expect(imagesError).toBeDefined();
        expect(imagesError?.constraints).toHaveProperty('isString');
      });
    });

    describe('categoryId validation', () => {
      it('should fail when categoryId is not a string (number)', async () => {
        const errors = await transformAndValidate({ categoryId: 9999 });
        const catError = getErrorForProperty(errors, 'categoryId');
        expect(catError).toBeDefined();
        expect(catError?.constraints).toHaveProperty('isString');
      });

      it('should fail when categoryId is not a string (boolean)', async () => {
        const errors = await transformAndValidate({ categoryId: true });
        const catError = getErrorForProperty(errors, 'categoryId');
        expect(catError).toBeDefined();
        expect(catError?.constraints).toHaveProperty('isString');
      });
    });

    describe('basePrice validation', () => {
      it('should fail when basePrice is negative (violates @Min(0))', async () => {
        const errors = await transformAndValidate({ basePrice: -1 });
        const priceError = getErrorForProperty(errors, 'basePrice');
        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('min');
      });

      it('should fail when basePrice is a non-integer float (violates @IsInt())', async () => {
        const errors = await transformAndValidate({ basePrice: 12000.5 });
        const priceError = getErrorForProperty(errors, 'basePrice');
        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail when basePrice is not a valid number (violates @IsInt())', async () => {
        const errors = await transformAndValidate({
          basePrice: 'invalid-price',
        });
        const priceError = getErrorForProperty(errors, 'basePrice');
        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });
    });

    describe('active validation', () => {
      it('should fail when active is a string instead of boolean', async () => {
        const errors = await transformAndValidate({ active: 'true' });
        const activeError = getErrorForProperty(errors, 'active');
        expect(activeError).toBeDefined();
        expect(activeError?.constraints).toHaveProperty('isBoolean');
      });

      it('should fail when active is a number instead of boolean', async () => {
        const errors = await transformAndValidate({ active: 1 });
        const activeError = getErrorForProperty(errors, 'active');
        expect(activeError).toBeDefined();
        expect(activeError?.constraints).toHaveProperty('isBoolean');
      });
    });

    describe('direct instance property mutation validation', () => {
      it('should fail validation when invalid values are set directly on an instance', async () => {
        const dto = new UpdateProductDto();
        (dto as any).name = 456;
        (dto as any).basePrice = -50;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThanOrEqual(2);
        expect(getErrorForProperty(errors, 'name')?.constraints).toHaveProperty(
          'isString',
        );
        expect(
          getErrorForProperty(errors, 'basePrice')?.constraints,
        ).toHaveProperty('min');
      });
    });
  });
});
