import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CouponType } from '@prisma/client';
import { CreateCouponDto } from './create-coupon.dto';

describe('CreateCouponDto', () => {
  it('instantiates the DTO class with properties', () => {
    const dto = new CreateCouponDto();
    dto.code = 'SUMMER2026';
    dto.type = CouponType.PERCENT;
    dto.value = 15;
    dto.minOrder = 50000;
    dto.maxDiscount = 20000;
    dto.validFrom = new Date('2026-06-01T00:00:00.000Z');
    dto.validUntil = new Date('2026-08-31T23:59:59.999Z');
    dto.maxUses = 200;
    dto.maxUsesPerUser = 2;

    expect(dto).toBeInstanceOf(CreateCouponDto);
    expect(dto.code).toBe('SUMMER2026');
    expect(dto.type).toBe(CouponType.PERCENT);
    expect(dto.value).toBe(15);
    expect(dto.minOrder).toBe(50000);
    expect(dto.maxDiscount).toBe(20000);
    expect(dto.validFrom).toBeInstanceOf(Date);
    expect(dto.validUntil).toBeInstanceOf(Date);
    expect(dto.maxUses).toBe(200);
    expect(dto.maxUsesPerUser).toBe(2);
  });

  describe('transformation via @Type decorators', () => {
    it('executes type transformation callbacks for all numeric and date fields', () => {
      const plain = {
        code: 'SUMMER2025',
        type: CouponType.PERCENT,
        value: '20',
        minOrder: '100000',
        maxDiscount: '50000',
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.999Z',
        maxUses: '100',
        maxUsesPerUser: '2',
      };

      const dto = plainToInstance(CreateCouponDto, plain);

      expect(dto).toBeInstanceOf(CreateCouponDto);
      expect(dto.code).toBe('SUMMER2025');
      expect(dto.type).toBe(CouponType.PERCENT);

      // Value transformed to number
      expect(dto.value).toBe(20);
      expect(typeof dto.value).toBe('number');

      // MinOrder transformed to number
      expect(dto.minOrder).toBe(100000);
      expect(typeof dto.minOrder).toBe('number');

      // MaxDiscount transformed to number
      expect(dto.maxDiscount).toBe(50000);
      expect(typeof dto.maxDiscount).toBe('number');

      // ValidFrom transformed to Date
      expect(dto.validFrom).toBeInstanceOf(Date);
      expect(dto.validFrom?.toISOString()).toBe('2026-01-01T00:00:00.000Z');

      // ValidUntil transformed to Date
      expect(dto.validUntil).toBeInstanceOf(Date);
      expect(dto.validUntil?.toISOString()).toBe('2026-12-31T23:59:59.999Z');

      // MaxUses transformed to number
      expect(dto.maxUses).toBe(100);
      expect(typeof dto.maxUses).toBe('number');

      // MaxUsesPerUser transformed to number
      expect(dto.maxUsesPerUser).toBe(2);
      expect(typeof dto.maxUsesPerUser).toBe('number');
    });

    it('transforms optional fields when provided individually', () => {
      const dtoWithValue = plainToInstance(CreateCouponDto, {
        code: 'TEST',
        type: CouponType.FIXED,
        value: '30000',
      });
      expect(dtoWithValue.value).toBe(30000);
      expect(typeof dtoWithValue.value).toBe('number');

      const dtoWithMin = plainToInstance(CreateCouponDto, {
        minOrder: '250000',
      });
      expect(dtoWithMin.minOrder).toBe(250000);
      expect(typeof dtoWithMin.minOrder).toBe('number');

      const dtoWithMaxDisc = plainToInstance(CreateCouponDto, {
        maxDiscount: '75000',
      });
      expect(dtoWithMaxDisc.maxDiscount).toBe(75000);
      expect(typeof dtoWithMaxDisc.maxDiscount).toBe('number');

      const dtoWithDates = plainToInstance(CreateCouponDto, {
        validFrom: '2026-03-01T10:00:00.000Z',
        validUntil: '2026-04-01T10:00:00.000Z',
      });
      expect(dtoWithDates.validFrom).toBeInstanceOf(Date);
      expect(dtoWithDates.validUntil).toBeInstanceOf(Date);

      const dtoWithUses = plainToInstance(CreateCouponDto, {
        maxUses: '50',
        maxUsesPerUser: '5',
      });
      expect(dtoWithUses.maxUses).toBe(50);
      expect(typeof dtoWithUses.maxUses).toBe('number');
      expect(dtoWithUses.maxUsesPerUser).toBe(5);
      expect(typeof dtoWithUses.maxUsesPerUser).toBe('number');
    });
  });

  describe('validation', () => {
    it('passes validation when all fields are valid', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'PROMO100',
        type: CouponType.FIXED,
        value: 100000,
        minOrder: 500000,
        maxDiscount: 100000,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T23:59:59.999Z'),
        maxUses: 50,
        maxUsesPerUser: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes validation with only mandatory fields', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'SIMPLE10',
        type: CouponType.PERCENT,
        value: 10,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails validation when mandatory fields are missing or invalid', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 12345,
        type: 'INVALID_ENUM',
        value: -10,
      });

      const errors = await validate(dto);
      const errorProperties = errors.map((e) => e.property);

      expect(errorProperties).toContain('code');
      expect(errorProperties).toContain('type');
      expect(errorProperties).toContain('value');
    });

    it('fails validation when numeric values violate Min or IsInt constraints', async () => {
      const dto = plainToInstance(CreateCouponDto, {
        code: 'INVALID_NUMS',
        type: CouponType.PERCENT,
        value: 10.5,
        minOrder: -1,
        maxDiscount: -500,
        maxUses: 0,
        maxUsesPerUser: 0,
      });

      const errors = await validate(dto);
      const errorProperties = errors.map((e) => e.property);

      expect(errorProperties).toContain('value');
      expect(errorProperties).toContain('minOrder');
      expect(errorProperties).toContain('maxDiscount');
      expect(errorProperties).toContain('maxUses');
      expect(errorProperties).toContain('maxUsesPerUser');
    });

    it('fails validation when dates are invalid', async () => {
      const dto = new CreateCouponDto();
      dto.code = 'DATE_ERR';
      dto.type = CouponType.PERCENT;
      dto.value = 10;
      (dto as any).validFrom = 'not-a-valid-date';
      (dto as any).validUntil = 'not-a-valid-date';

      const errors = await validate(dto);
      const errorProperties = errors.map((e) => e.property);

      expect(errorProperties).toContain('validFrom');
      expect(errorProperties).toContain('validUntil');
    });
  });
});
