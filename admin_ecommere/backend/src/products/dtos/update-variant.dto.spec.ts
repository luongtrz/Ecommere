import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateVariantDto } from './update-variant.dto';

describe('UpdateVariantDto', () => {
  const getErrorForProperty = (
    errors: ValidationError[],
    property: string,
  ): ValidationError | undefined => {
    return errors.find((err) => err.property === property);
  };

  const transformAndValidate = async (
    plain: Record<string, unknown>,
  ): Promise<ValidationError[]> => {
    const dto = plainToInstance(UpdateVariantDto, plain);
    return validate(dto);
  };

  it('should instantiate an UpdateVariantDto instance', () => {
    const dto = new UpdateVariantDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(UpdateVariantDto);
  });

  describe('valid payloads', () => {
    it('should validate successfully when empty object is passed because all fields are optional', async () => {
      const errors = await transformAndValidate({});
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when all fields are valid', async () => {
      const validPayload = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        salePrice: 200000,
        barcode: '8931234567890',
      };

      const errors = await transformAndValidate(validPayload);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when setting valid properties directly on an instance', async () => {
      const dto = new UpdateVariantDto();
      dto.scent = 'Hoa Sen';
      dto.volumeMl = 100;
      dto.price = 150000;
      dto.salePrice = 120000;
      dto.barcode = '89399998888';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with minimal partial fields (only scent)', async () => {
      const errors = await transformAndValidate({ scent: 'Jasmine' });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with volumeMl at lower bound (1)', async () => {
      const errors = await transformAndValidate({ volumeMl: 1 });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with price at lower bound (0)', async () => {
      const errors = await transformAndValidate({ price: 0 });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with salePrice at lower bound (0)', async () => {
      const errors = await transformAndValidate({ salePrice: 0 });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with barcode only', async () => {
      const errors = await transformAndValidate({
        barcode: 'BARCODE-999',
      });
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when stock is omitted (since stock is omitted from DTO)', async () => {
      const errors = await transformAndValidate({
        scent: 'Vanilla',
        volumeMl: 50,
        price: 90000,
      });
      expect(errors).toHaveLength(0);
    });

    it('should ignore stock property even if passed since it is not part of UpdateVariantDto', async () => {
      const errors = await transformAndValidate({
        stock: -100,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid payloads', () => {
    describe('scent validation', () => {
      it('should fail when scent is not a string (number)', async () => {
        const errors = await transformAndValidate({ scent: 12345 });
        const scentError = getErrorForProperty(errors, 'scent');
        expect(scentError).toBeDefined();
        expect(scentError?.constraints).toHaveProperty('isString');
      });

      it('should fail when scent is not a string (boolean)', async () => {
        const errors = await transformAndValidate({ scent: true });
        const scentError = getErrorForProperty(errors, 'scent');
        expect(scentError).toBeDefined();
        expect(scentError?.constraints).toHaveProperty('isString');
      });
    });

    describe('volumeMl validation', () => {
      it('should fail when volumeMl is less than 1 (0)', async () => {
        const errors = await transformAndValidate({ volumeMl: 0 });
        const volumeError = getErrorForProperty(errors, 'volumeMl');
        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('min');
      });

      it('should fail when volumeMl is negative (-10)', async () => {
        const errors = await transformAndValidate({ volumeMl: -10 });
        const volumeError = getErrorForProperty(errors, 'volumeMl');
        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('min');
      });

      it('should fail when volumeMl is a non-integer float', async () => {
        const errors = await transformAndValidate({ volumeMl: 250.5 });
        const volumeError = getErrorForProperty(errors, 'volumeMl');
        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('isInt');
      });

      it('should fail when volumeMl is not a valid number', async () => {
        const errors = await transformAndValidate({
          volumeMl: 'not-a-number',
        });
        const volumeError = getErrorForProperty(errors, 'volumeMl');
        expect(volumeError).toBeDefined();
        expect(volumeError?.constraints).toHaveProperty('isInt');
      });
    });

    describe('price validation', () => {
      it('should fail when price is less than 0 (-1)', async () => {
        const errors = await transformAndValidate({ price: -1 });
        const priceError = getErrorForProperty(errors, 'price');
        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('min');
      });

      it('should fail when price is a non-integer float', async () => {
        const errors = await transformAndValidate({ price: 199000.75 });
        const priceError = getErrorForProperty(errors, 'price');
        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail when price is not a valid number', async () => {
        const errors = await transformAndValidate({ price: 'abc' });
        const priceError = getErrorForProperty(errors, 'price');
        expect(priceError).toBeDefined();
        expect(priceError?.constraints).toHaveProperty('isInt');
      });
    });

    describe('salePrice validation', () => {
      it('should fail when salePrice is less than 0 (-1)', async () => {
        const errors = await transformAndValidate({ salePrice: -1 });
        const salePriceError = getErrorForProperty(errors, 'salePrice');
        expect(salePriceError).toBeDefined();
        expect(salePriceError?.constraints).toHaveProperty('min');
      });

      it('should fail when salePrice is a non-integer float', async () => {
        const errors = await transformAndValidate({ salePrice: 150000.5 });
        const salePriceError = getErrorForProperty(errors, 'salePrice');
        expect(salePriceError).toBeDefined();
        expect(salePriceError?.constraints).toHaveProperty('isInt');
      });

      it('should fail when salePrice is not a valid number', async () => {
        const errors = await transformAndValidate({ salePrice: 'xyz' });
        const salePriceError = getErrorForProperty(errors, 'salePrice');
        expect(salePriceError).toBeDefined();
        expect(salePriceError?.constraints).toHaveProperty('isInt');
      });
    });

    describe('barcode validation', () => {
      it('should fail when barcode is not a string (number)', async () => {
        const errors = await transformAndValidate({ barcode: 8931234567890 });
        const barcodeError = getErrorForProperty(errors, 'barcode');
        expect(barcodeError).toBeDefined();
        expect(barcodeError?.constraints).toHaveProperty('isString');
      });

      it('should fail when barcode is not a string (boolean)', async () => {
        const errors = await transformAndValidate({ barcode: true });
        const barcodeError = getErrorForProperty(errors, 'barcode');
        expect(barcodeError).toBeDefined();
        expect(barcodeError?.constraints).toHaveProperty('isString');
      });
    });

    describe('direct instance property mutation validation', () => {
      it('should fail validation when invalid values are set directly on an instance', async () => {
        const dto = new UpdateVariantDto();
        (dto as any).scent = 999;
        (dto as any).volumeMl = 0;
        (dto as any).price = -100;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThanOrEqual(3);
        expect(
          getErrorForProperty(errors, 'scent')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'volumeMl')?.constraints,
        ).toHaveProperty('min');
        expect(
          getErrorForProperty(errors, 'price')?.constraints,
        ).toHaveProperty('min');
      });
    });
  });
});
