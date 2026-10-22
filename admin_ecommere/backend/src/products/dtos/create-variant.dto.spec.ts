import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVariantDto } from './create-variant.dto';

describe('CreateVariantDto', () => {
  it('should instantiate directly and allow setting all properties', () => {
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

    it('should pass validation without optional fields (salePrice and barcode omitted)', async () => {
      const payload = {
        scent: 'Lemongrass',
        volumeMl: 100,
        price: 150000,
        stock: 20,
      };

      const dto = plainToInstance(CreateVariantDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.scent).toBe('Lemongrass');
      expect(dto.volumeMl).toBe(100);
      expect(dto.price).toBe(150000);
      expect(dto.stock).toBe(20);
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
        scent: 'Eucalyptus',
        volumeMl: '300',
        price: '180000',
        salePrice: '160000',
        stock: '75',
      };

      const dto = plainToInstance(CreateVariantDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(typeof dto.volumeMl).toBe('number');
      expect(dto.volumeMl).toBe(300);
      expect(typeof dto.price).toBe('number');
      expect(dto.price).toBe(180000);
      expect(typeof dto.salePrice).toBe('number');
      expect(dto.salePrice).toBe(160000);
      expect(typeof dto.stock).toBe('number');
      expect(dto.stock).toBe(75);
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

    it('should fail validation when scent is not a string (number or boolean)', async () => {
      const dtoNum = plainToInstance(CreateVariantDto, {
        scent: 12345,
        volumeMl: 250,
        price: 250000,
        stock: 50,
      });
      const errorsNum = await validate(dtoNum);
      const scentErrorNum = errorsNum.find((e) => e.property === 'scent');

      expect(scentErrorNum).toBeDefined();
      expect(scentErrorNum?.constraints).toHaveProperty('isString');

      const dtoBool = plainToInstance(CreateVariantDto, {
        scent: true,
        volumeMl: 250,
        price: 250000,
        stock: 50,
      });
      const errorsBool = await validate(dtoBool);
      const scentErrorBool = errorsBool.find((e) => e.property === 'scent');

      expect(scentErrorBool).toBeDefined();
      expect(scentErrorBool?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when volumeMl is missing', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
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
        scent: 'Lavender',
        volumeMl: 0,
        price: 250000,
        stock: 50,
      });
      const errorsZero = await validate(dtoZero);
      const volumeErrorZero = errorsZero.find((e) => e.property === 'volumeMl');

      expect(volumeErrorZero).toBeDefined();
      expect(volumeErrorZero?.constraints).toHaveProperty('min');

      const dtoNeg = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: -5,
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
        scent: 'Lavender',
        volumeMl: 250.75,
        price: 250000,
        stock: 50,
      });

      const errors = await validate(dto);
      const volumeError = errors.find((e) => e.property === 'volumeMl');

      expect(volumeError).toBeDefined();
      expect(volumeError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when volumeMl is non-numeric string', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 'not-a-number',
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
        scent: 'Lavender',
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
        scent: 'Lavender',
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
        scent: 'Lavender',
        volumeMl: 250,
        price: 150.5,
        stock: 50,
      });

      const errors = await validate(dto);
      const priceError = errors.find((e) => e.property === 'price');

      expect(priceError).toBeDefined();
      expect(priceError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when price is non-numeric string', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 'not-a-number',
        stock: 50,
      });

      const errors = await validate(dto);
      const priceError = errors.find((e) => e.property === 'price');

      expect(priceError).toBeDefined();
      expect(priceError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when salePrice is negative', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        salePrice: -5,
        stock: 50,
      });

      const errors = await validate(dto);
      const salePriceError = errors.find((e) => e.property === 'salePrice');

      expect(salePriceError).toBeDefined();
      expect(salePriceError?.constraints).toHaveProperty('min');
    });

    it('should fail validation when salePrice is a float', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
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

    it('should fail validation when salePrice is non-numeric string', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        salePrice: 'invalid-sale',
        stock: 50,
      });

      const errors = await validate(dto);
      const salePriceError = errors.find((e) => e.property === 'salePrice');

      expect(salePriceError).toBeDefined();
      expect(salePriceError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when stock is missing', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
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
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        stock: -1,
      });

      const errors = await validate(dto);
      const stockError = errors.find((e) => e.property === 'stock');

      expect(stockError).toBeDefined();
      expect(stockError?.constraints).toHaveProperty('min');
    });

    it('should fail validation when stock is a float', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        stock: 10.5,
      });

      const errors = await validate(dto);
      const stockError = errors.find((e) => e.property === 'stock');

      expect(stockError).toBeDefined();
      expect(stockError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when stock is non-numeric string', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        stock: 'invalid-stock',
      });

      const errors = await validate(dto);
      const stockError = errors.find((e) => e.property === 'stock');

      expect(stockError).toBeDefined();
      expect(stockError?.constraints).toHaveProperty('isInt');
    });

    it('should fail validation when barcode is not a string (number or object)', async () => {
      const dtoNum = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        stock: 50,
        barcode: 999888777,
      });
      const errorsNum = await validate(dtoNum);
      const barcodeErrorNum = errorsNum.find((e) => e.property === 'barcode');

      expect(barcodeErrorNum).toBeDefined();
      expect(barcodeErrorNum?.constraints).toHaveProperty('isString');

      const dtoObj = plainToInstance(CreateVariantDto, {
        scent: 'Lavender',
        volumeMl: 250,
        price: 250000,
        stock: 50,
        barcode: { code: '123' },
      });
      const errorsObj = await validate(dtoObj);
      const barcodeErrorObj = errorsObj.find((e) => e.property === 'barcode');

      expect(barcodeErrorObj).toBeDefined();
      expect(barcodeErrorObj?.constraints).toHaveProperty('isString');
    });
  });
});
