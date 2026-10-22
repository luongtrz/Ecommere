import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CouponType } from '@prisma/client';
import { CreateCouponDto } from './create-coupon.dto';

describe('CreateCouponDto', () => {
  it('should instantiate the DTO directly with all properties', () => {
    const dto = new CreateCouponDto();
    const now = new Date();
    const later = new Date(Date.now() + 86400000);

    dto.code = 'SUMMER2025';
    dto.type = CouponType.PERCENT;
    dto.value = 20;
    dto.minOrder = 100000;
    dto.maxDiscount = 50000;
    dto.validFrom = now;
    dto.validUntil = later;
    dto.maxUses = 100;
    dto.maxUsesPerUser = 2;

    expect(dto).toBeInstanceOf(CreateCouponDto);
    expect(dto.code).toBe('SUMMER2025');
    expect(dto.type).toBe(CouponType.PERCENT);
    expect(dto.value).toBe(20);
    expect(dto.minOrder).toBe(100000);
    expect(dto.maxDiscount).toBe(50000);
    expect(dto.validFrom).toBe(now);
    expect(dto.validUntil).toBe(later);
    expect(dto.maxUses).toBe(100);
    expect(dto.maxUsesPerUser).toBe(2);
  });

  describe('validation - success scenarios', () => {
    it('should pass validation with minimal required valid data', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'SUMMER2025',
        type: CouponType.PERCENT,
        value: 15,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.code).toBe('SUMMER2025');
      expect(dto.type).toBe(CouponType.PERCENT);
      expect(dto.value).toBe(15);
      expect(dto.minOrder).toBeUndefined();
      expect(dto.maxDiscount).toBeUndefined();
      expect(dto.validFrom).toBeUndefined();
      expect(dto.validUntil).toBeUndefined();
      expect(dto.maxUses).toBeUndefined();
      expect(dto.maxUsesPerUser).toBeUndefined();
    });

    it('should pass validation with all valid fields populated', async () => {
      const validFromStr = '2026-06-01T00:00:00.000Z';
      const validUntilStr = '2026-06-30T23:59:59.000Z';

      const dto = plainToInstance(CreateCouponDto, {
        code: 'SALE_2026-V1',
        type: CouponType.FIXED,
        value: 50000,
        minOrder: 200000,
        maxDiscount: 50000,
        validFrom: validFromStr,
        validUntil: validUntilStr,
        maxUses: 500,
        maxUsesPerUser: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.code).toBe('SALE_2026-V1');
      expect(dto.type).toBe(CouponType.FIXED);
      expect(dto.value).toBe(50000);
      expect(dto.minOrder).toBe(200000);
      expect(dto.maxDiscount).toBe(50000);
      expect(dto.validFrom).toBeInstanceOf(Date);
      expect(dto.validUntil).toBeInstanceOf(Date);
      expect(dto.maxUses).toBe(500);
      expect(dto.maxUsesPerUser).toBe(1);
    });

    it.each([CouponType.PERCENT, CouponType.FIXED, CouponType.FREESHIP])(
      'should accept valid CouponType enum: %s',
      async (type) => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'PROMO123',
          type,
          value: 0,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.type).toBe(type);
      },
    );

    it('should trim string code via @Transform and pass validation', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: '   TRIMMED_CODE-99   ',
        type: CouponType.PERCENT,
        value: 10,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.code).toBe('TRIMMED_CODE-99');
    });

    it('should coerce string numbers to numeric type via @Type(() => Number)', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'COERCE123',
        type: CouponType.FIXED,
        value: '100',
        minOrder: '500',
        maxDiscount: '200',
        maxUses: '10',
        maxUsesPerUser: '2',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.value).toBe(100);
      expect(dto.minOrder).toBe(500);
      expect(dto.maxDiscount).toBe(200);
      expect(dto.maxUses).toBe(10);
      expect(dto.maxUsesPerUser).toBe(2);
    });

    it('should allow boundary values (0 for value, minOrder, maxDiscount; 1 for maxUses, maxUsesPerUser)', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'ZERO-BOUND',
        type: CouponType.FREESHIP,
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        maxUses: 1,
        maxUsesPerUser: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.value).toBe(0);
      expect(dto.minOrder).toBe(0);
      expect(dto.maxDiscount).toBe(0);
      expect(dto.maxUses).toBe(1);
      expect(dto.maxUsesPerUser).toBe(1);
    });

    it('should accept Date instances directly for validFrom and validUntil', async () => {
      const from = new Date('2026-01-01');
      const until = new Date('2026-12-31');

      const dto = plainToInstance(CreateCouponDto, {
        code: 'DATE_TEST',
        type: CouponType.PERCENT,
        value: 5,
        validFrom: from,
        validUntil: until,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.validFrom).toEqual(from);
      expect(dto.validUntil).toEqual(until);
    });

    it('should pass validation when optional fields are null or undefined', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'OPTIONAL-NULL',
        type: CouponType.PERCENT,
        value: 10,
        minOrder: null,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validation - failure scenarios', () => {
    describe('code property', () => {
      it('should fail when code is missing / undefined', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          type: CouponType.PERCENT,
          value: 10,
        });

        const errors = await validate(dto);
        const codeError = errors.find((e) => e.property === 'code');
        expect(codeError).toBeDefined();
        expect(codeError?.constraints).toHaveProperty('isString');
        expect(codeError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when code is an empty string', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: '',
          type: CouponType.PERCENT,
          value: 10,
        });

        const errors = await validate(dto);
        const codeError = errors.find((e) => e.property === 'code');
        expect(codeError).toBeDefined();
        expect(codeError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when code is only whitespace (trimmed to empty string)', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: '     ',
          type: CouponType.PERCENT,
          value: 10,
        });

        expect(dto.code).toBe('');
        const errors = await validate(dto);
        const codeError = errors.find((e) => e.property === 'code');
        expect(codeError).toBeDefined();
        expect(codeError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('should leave non-string value untouched in @Transform (false branch) and fail @IsString', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 98765,
          type: CouponType.PERCENT,
          value: 10,
        });

        expect(dto.code).toBe(98765);
        const errors = await validate(dto);
        const codeError = errors.find((e) => e.property === 'code');
        expect(codeError).toBeDefined();
        expect(codeError?.constraints).toHaveProperty('isString');
      });

      it('should leave non-string object untouched in @Transform (false branch) and fail @IsString', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: { nested: 'obj' },
          type: CouponType.PERCENT,
          value: 10,
        });

        expect(dto.code).toEqual({ nested: 'obj' });
        const errors = await validate(dto);
        const codeError = errors.find((e) => e.property === 'code');
        expect(codeError).toBeDefined();
        expect(codeError?.constraints).toHaveProperty('isString');
      });

      it.each([
        ['CODE WITH SPACE', 'spaces'],
        ['COUPON@2025', 'at sign'],
        ['PROMO!100', 'exclamation mark'],
        ['DISCOUNT#1', 'hash sign'],
        ['OFFER.2025', 'dot'],
        ['SALE$50', 'dollar sign'],
      ])(
        'should fail when code contains invalid characters: %s (%s)',
        async (invalidCode) => {
          const dto = plainToInstance(CreateCouponDto, {
            code: invalidCode,
            type: CouponType.PERCENT,
            value: 10,
          });

          const errors = await validate(dto);
          const codeError = errors.find((e) => e.property === 'code');
          expect(codeError).toBeDefined();
          expect(codeError?.constraints?.matches).toBe(
            'code may contain only letters, digits, "-" and "_"',
          );
        },
      );
    });

    describe('type property', () => {
      it('should fail when type is missing / undefined', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          value: 10,
        });

        const errors = await validate(dto);
        const typeError = errors.find((e) => e.property === 'type');
        expect(typeError).toBeDefined();
        expect(typeError?.constraints).toHaveProperty('isEnum');
      });

      it('should fail when type is not a valid CouponType', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: 'INVALID_TYPE' as any,
          value: 10,
        });

        const errors = await validate(dto);
        const typeError = errors.find((e) => e.property === 'type');
        expect(typeError).toBeDefined();
        expect(typeError?.constraints).toHaveProperty('isEnum');
      });
    });

    describe('value property', () => {
      it('should fail when value is missing / undefined', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
        });

        const errors = await validate(dto);
        const valError = errors.find((e) => e.property === 'value');
        expect(valError).toBeDefined();
        expect(valError?.constraints).toHaveProperty('isInt');
      });

      it('should fail when value is negative', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: -1,
        });

        const errors = await validate(dto);
        const valError = errors.find((e) => e.property === 'value');
        expect(valError).toBeDefined();
        expect(valError?.constraints).toHaveProperty('min');
      });

      it('should fail when value is a floating point number', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 12.34,
        });

        const errors = await validate(dto);
        const valError = errors.find((e) => e.property === 'value');
        expect(valError).toBeDefined();
        expect(valError?.constraints).toHaveProperty('isInt');
      });

      it('should fail when value is not a number (e.g. non-numeric string)', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 'not-a-number' as any,
        });

        const errors = await validate(dto);
        const valError = errors.find((e) => e.property === 'value');
        expect(valError).toBeDefined();
        expect(valError?.constraints).toHaveProperty('isInt');
      });
    });

    describe('minOrder property', () => {
      it('should fail when minOrder is negative', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          minOrder: -50,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'minOrder');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when minOrder is not an integer', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          minOrder: 99.99,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'minOrder');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });
    });

    describe('maxDiscount property', () => {
      it('should fail when maxDiscount is negative', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxDiscount: -1,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxDiscount');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxDiscount is not an integer', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxDiscount: 45.5,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxDiscount');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });
    });

    describe('validFrom property', () => {
      it('should fail when validFrom is not a valid date', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          validFrom: 'not-a-valid-date' as any,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'validFrom');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isDate');
      });
    });

    describe('validUntil property', () => {
      it('should fail when validUntil is not a valid date', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          validUntil: 'not-a-valid-date' as any,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'validUntil');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isDate');
      });
    });

    describe('maxUses property', () => {
      it('should fail when maxUses is 0 (below min 1)', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxUses: 0,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUses');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxUses is negative', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxUses: -5,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUses');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxUses is not an integer', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxUses: 1.5,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUses');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });
    });

    describe('maxUsesPerUser property', () => {
      it('should fail when maxUsesPerUser is 0 (below min 1)', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxUsesPerUser: 0,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUsesPerUser');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxUsesPerUser is negative', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxUsesPerUser: -2,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUsesPerUser');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxUsesPerUser is not an integer', async () => {
        const dto = plainToInstance(CreateCouponDto, {
          code: 'SUMMER2025',
          type: CouponType.PERCENT,
          value: 10,
          maxUsesPerUser: 2.7,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUsesPerUser');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });
    });
  });
});
