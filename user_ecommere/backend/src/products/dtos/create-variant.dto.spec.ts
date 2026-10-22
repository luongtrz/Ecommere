import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateVariantDto } from './create-variant.dto';

describe('CreateVariantDto', () => {
  it('should instantiate directly and allow setting properties', () => {
    const dto = new CreateVariantDto();
    dto.scent = 'Lavender';
    dto.volumeMl = 250;
    dto.price = 250000;
    dto.salePrice = 200000;
    dto.stock = 50;
    dto.barcode = 'BAR-123456';

    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(CreateVariantDto);
    expect(dto.scent).toBe('Lavender');
    expect(dto.volumeMl).toBe(250);
    expect(dto.price).toBe(250000);
    expect(dto.salePrice).toBe(200000);
    expect(dto.stock).toBe(50);
    expect(dto.barcode).toBe('BAR-123456');
  });

  describe('type transformation via @Type(() => Number)', () => {
    it('should transform numeric string values into numbers for all numeric fields', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Chamomile',
        volumeMl: '250',
        price: '250000',
        salePrice: '199000',
        stock: '100',
        barcode: 'BAR-789',
      });

      expect(typeof dto.volumeMl).toBe('number');
      expect(dto.volumeMl).toBe(250);

      expect(typeof dto.price).toBe('number');
      expect(dto.price).toBe(250000);

      expect(typeof dto.salePrice).toBe('number');
      expect(dto.salePrice).toBe(199000);

      expect(typeof dto.stock).toBe('number');
      expect(dto.stock).toBe(100);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should correctly handle numeric values already supplied as numbers', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Jasmine',
        volumeMl: 100,
        price: 150000,
        salePrice: 120000,
        stock: 30,
        barcode: 'BAR-555',
      });

      expect(dto.volumeMl).toBe(100);
      expect(dto.price).toBe(150000);
      expect(dto.salePrice).toBe(120000);
      expect(dto.stock).toBe(30);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validation success cases', () => {
    it('should pass validation when all fields (required and optional) are valid', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Rose',
        volumeMl: 500,
        price: 350000,
        salePrice: 300000,
        stock: 45,
        barcode: '893000111222',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.scent).toBe('Rose');
      expect(dto.barcode).toBe('893000111222');
    });

    it('should pass validation when optional fields (salePrice, barcode) are omitted', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Lemongrass',
        volumeMl: 150,
        price: 120000,
        stock: 15,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.salePrice).toBeUndefined();
      expect(dto.barcode).toBeUndefined();
    });

    it('should pass validation at boundary minimum values (volumeMl=1, price=0, salePrice=0, stock=0)', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Peppermint',
        volumeMl: 1,
        price: 0,
        salePrice: 0,
        stock: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validation failure cases', () => {
    it('should fail when required fields (scent, volumeMl, price, stock) are missing', async () => {
      const dto = plainToInstance(CreateVariantDto, {});
      const errors = await validate(dto);

      const properties = errors.map((err) => err.property);
      expect(properties).toContain('scent');
      expect(properties).toContain('volumeMl');
      expect(properties).toContain('price');
      expect(properties).toContain('stock');
    });

    it('should fail when scent is not a string', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 12345,
        volumeMl: 100,
        price: 100000,
        stock: 10,
      });

      const errors = await validate(dto);
      const scentError = errors.find((err) => err.property === 'scent');
      expect(scentError).toBeDefined();
      expect(scentError?.constraints).toHaveProperty('isString');
    });

    it('should fail when volumeMl is less than 1', async () => {
      const dtoZero = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 0,
        price: 100000,
        stock: 10,
      });
      const errorsZero = await validate(dtoZero);
      const zeroError = errorsZero.find((err) => err.property === 'volumeMl');
      expect(zeroError?.constraints).toHaveProperty('min');

      const dtoNegative = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: -5,
        price: 100000,
        stock: 10,
      });
      const errorsNegative = await validate(dtoNegative);
      const negError = errorsNegative.find(
        (err) => err.property === 'volumeMl',
      );
      expect(negError?.constraints).toHaveProperty('min');
    });

    it('should fail when volumeMl is not an integer', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250.5,
        price: 100000,
        stock: 10,
      });

      const errors = await validate(dto);
      const volumeError = errors.find((err) => err.property === 'volumeMl');
      expect(volumeError?.constraints).toHaveProperty('isInt');
    });

    it('should fail when price is negative or not an integer', async () => {
      const dtoNegative = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: -1,
        stock: 10,
      });
      const errorsNegative = await validate(dtoNegative);
      const negError = errorsNegative.find((err) => err.property === 'price');
      expect(negError?.constraints).toHaveProperty('min');

      const dtoFloat = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: 99.99,
        stock: 10,
      });
      const errorsFloat = await validate(dtoFloat);
      const floatError = errorsFloat.find((err) => err.property === 'price');
      expect(floatError?.constraints).toHaveProperty('isInt');
    });

    it('should fail when salePrice is negative or not an integer', async () => {
      const dtoNegative = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: 100000,
        salePrice: -1,
        stock: 10,
      });
      const errorsNegative = await validate(dtoNegative);
      const negError = errorsNegative.find(
        (err) => err.property === 'salePrice',
      );
      expect(negError?.constraints).toHaveProperty('min');

      const dtoFloat = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: 100000,
        salePrice: 49.5,
        stock: 10,
      });
      const errorsFloat = await validate(dtoFloat);
      const floatError = errorsFloat.find(
        (err) => err.property === 'salePrice',
      );
      expect(floatError?.constraints).toHaveProperty('isInt');
    });

    it('should fail when stock is negative or not an integer', async () => {
      const dtoNegative = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: 100000,
        stock: -10,
      });
      const errorsNegative = await validate(dtoNegative);
      const negError = errorsNegative.find((err) => err.property === 'stock');
      expect(negError?.constraints).toHaveProperty('min');

      const dtoFloat = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: 100000,
        stock: 5.75,
      });
      const errorsFloat = await validate(dtoFloat);
      const floatError = errorsFloat.find((err) => err.property === 'stock');
      expect(floatError?.constraints).toHaveProperty('isInt');
    });

    it('should fail when barcode is provided but is not a string', async () => {
      const dto = plainToInstance(CreateVariantDto, {
        scent: 'Scent',
        volumeMl: 250,
        price: 100000,
        stock: 10,
        barcode: 987654321,
      });

      const errors = await validate(dto);
      const barcodeError = errors.find((err) => err.property === 'barcode');
      expect(barcodeError?.constraints).toHaveProperty('isString');
    });
  });
});
