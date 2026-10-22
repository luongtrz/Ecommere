import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import {
  CalculateShippingFeeDto,
  ShippingMethod,
} from './calculate-shipping-fee.dto';

describe('CalculateShippingFeeDto', () => {
  it('instantiates with default values', () => {
    const dto = new CalculateShippingFeeDto();

    expect(dto).toBeInstanceOf(CalculateShippingFeeDto);
    expect(dto.method).toBe(ShippingMethod.STANDARD);
    expect(dto.province).toBeUndefined();
    expect(dto.weight).toBeUndefined();
  });

  describe('validation with class-validator', () => {
    it('passes validation with default values', async () => {
      const dto = new CalculateShippingFeeDto();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes validation when valid values are provided', async () => {
      const dto = plainToInstance(CalculateShippingFeeDto, {
        province: 'Chiang Mai',
        method: ShippingMethod.EXPRESS,
        weight: 2.5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.province).toBe('Chiang Mai');
      expect(dto.method).toBe(ShippingMethod.EXPRESS);
      expect(dto.weight).toBe(2.5);
    });

    it('passes validation with standard method', async () => {
      const dto = plainToInstance(CalculateShippingFeeDto, {
        method: ShippingMethod.STANDARD,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.method).toBe(ShippingMethod.STANDARD);
    });

    it('passes validation when province is exactly 100 characters', async () => {
      const dto = plainToInstance(CalculateShippingFeeDto, {
        province: 'a'.repeat(100),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails validation when province exceeds 100 characters', async () => {
      const dto = plainToInstance(CalculateShippingFeeDto, {
        province: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const provinceError = errors.find((e) => e.property === 'province');
      expect(provinceError).toBeDefined();
      expect(provinceError?.constraints).toHaveProperty('maxLength');
    });

    it('fails validation when province is not a string', async () => {
      const dto = new CalculateShippingFeeDto();
      (dto as any).province = 12345;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const provinceError = errors.find((e) => e.property === 'province');
      expect(provinceError).toBeDefined();
      expect(provinceError?.constraints).toHaveProperty('isString');
    });

    it('fails validation when method is not a valid ShippingMethod enum value', async () => {
      const dto = plainToInstance(CalculateShippingFeeDto, {
        method: 'INVALID_METHOD',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const methodError = errors.find((e) => e.property === 'method');
      expect(methodError).toBeDefined();
      expect(methodError?.constraints).toHaveProperty('isEnum');
    });

    it('fails validation when weight is not a number', async () => {
      const dto = plainToInstance(CalculateShippingFeeDto, {
        weight: 'not-a-number',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const weightError = errors.find((e) => e.property === 'weight');
      expect(weightError).toBeDefined();
      expect(weightError?.constraints).toHaveProperty('isNumber');
    });

    it('transforms string weight to numeric primitive via class-transformer', () => {
      const plain = { weight: '3.75' };
      const dto = plainToInstance(CalculateShippingFeeDto, plain);

      expect(dto).toBeInstanceOf(CalculateShippingFeeDto);
      expect(dto.weight).toBe(3.75);
      expect(typeof dto.weight).toBe('number');
    });
  });

  describe('NestJS ValidationPipe integration', () => {
    let pipe: ValidationPipe;

    beforeEach(() => {
      pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      });
    });

    it('transforms empty query into CalculateShippingFeeDto with default method', async () => {
      const transformed = await pipe.transform(
        {},
        { type: 'query', metatype: CalculateShippingFeeDto },
      );

      expect(transformed).toBeInstanceOf(CalculateShippingFeeDto);
      expect(transformed.method).toBe(ShippingMethod.STANDARD);
      expect(transformed.province).toBeUndefined();
      expect(transformed.weight).toBeUndefined();
    });

    it('transforms query with method=EXPRESS and numeric weight', async () => {
      const transformed = await pipe.transform(
        { province: 'Phuket', method: 'EXPRESS', weight: '2' },
        { type: 'query', metatype: CalculateShippingFeeDto },
      );

      expect(transformed).toBeInstanceOf(CalculateShippingFeeDto);
      expect(transformed.province).toBe('Phuket');
      expect(transformed.method).toBe(ShippingMethod.EXPRESS);
      expect(transformed.weight).toBe(2);
    });

    it('rejects invalid shipping method with BadRequestException (400)', async () => {
      await expect(
        pipe.transform(
          { method: 'OVERNIGHT' },
          { type: 'query', metatype: CalculateShippingFeeDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects province exceeding 100 characters with BadRequestException (400)', async () => {
      await expect(
        pipe.transform(
          { province: 'B'.repeat(101) },
          { type: 'query', metatype: CalculateShippingFeeDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-whitelisted query parameters with BadRequestException (400)', async () => {
      await expect(
        pipe.transform(
          { unknownParam: 'value' },
          { type: 'query', metatype: CalculateShippingFeeDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
