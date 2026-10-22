import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CouponType } from '@prisma/client';
import { UpdateCouponDto } from './update-coupon.dto';

describe('UpdateCouponDto', () => {
  it('should instantiate the DTO directly with all properties', () => {
    const dto = new UpdateCouponDto();
    const now = new Date();
    const later = new Date(Date.now() + 86400000);

    dto.active = true;
    dto.type = CouponType.FIXED;
    dto.value = 50000;
    dto.minOrder = 150000;
    dto.maxDiscount = 50000;
    dto.validFrom = now;
    dto.validUntil = later;
    dto.maxUses = 200;
    dto.maxUsesPerUser = 3;

    expect(dto).toBeInstanceOf(UpdateCouponDto);
    expect(dto.active).toBe(true);
    expect(dto.type).toBe(CouponType.FIXED);
    expect(dto.value).toBe(50000);
    expect(dto.minOrder).toBe(150000);
    expect(dto.maxDiscount).toBe(50000);
    expect(dto.validFrom).toBe(now);
    expect(dto.validUntil).toBe(later);
    expect(dto.maxUses).toBe(200);
    expect(dto.maxUsesPerUser).toBe(3);
  });

  describe('validation - success scenarios', () => {
    it('should pass validation when all fields are omitted (empty object)', async () => {
      const dto = plainToInstance(UpdateCouponDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.active).toBeUndefined();
    });

    it.each([true, false])(
      'should pass validation with active set to %s',
      async (active) => {
        const dto = plainToInstance(UpdateCouponDto, { active });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.active).toBe(active);
      },
    );

    it('should pass validation when optional fields are null or undefined', async () => {
      const dto = plainToInstance(UpdateCouponDto, {
        active: null,
        type: undefined,
        value: undefined,
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

    it('should pass validation with valid partial updates', async () => {
      const dto = plainToInstance(UpdateCouponDto, {
        active: false,
        value: 30000,
        maxUses: 50,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.active).toBe(false);
      expect(dto.value).toBe(30000);
      expect(dto.maxUses).toBe(50);
    });

    it('should pass validation with all fields valid', async () => {
      const dto = plainToInstance(UpdateCouponDto, {
        active: true,
        type: CouponType.FREESHIP,
        value: 0,
        minOrder: 50000,
        maxDiscount: 25000,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
        maxUses: 10,
        maxUsesPerUser: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.active).toBe(true);
      expect(dto.type).toBe(CouponType.FREESHIP);
      expect(dto.value).toBe(0);
      expect(dto.minOrder).toBe(50000);
      expect(dto.maxDiscount).toBe(25000);
      expect(dto.validFrom).toBeInstanceOf(Date);
      expect(dto.validUntil).toBeInstanceOf(Date);
      expect(dto.maxUses).toBe(10);
      expect(dto.maxUsesPerUser).toBe(1);
    });

    it('should not validate code as it is omitted via OmitType', async () => {
      const dto = plainToInstance(UpdateCouponDto, {
        code: 'ANY INVALID CODE @#!',
        active: true,
      });

      const errors = await validate(dto);
      const codeError = errors.find((e) => e.property === 'code');
      expect(codeError).toBeUndefined();
      expect(errors).toHaveLength(0);
    });
  });

  describe('validation - failure scenarios', () => {
    describe('active property', () => {
      it.each([
        ['string "true"', 'true'],
        ['number 1', 1],
        ['number 0', 0],
        ['object', { enabled: true }],
        ['array', [true]],
      ])(
        'should fail when active is not a boolean: %s',
        async (_desc, invalidActive) => {
          const dto = plainToInstance(UpdateCouponDto, {
            active: invalidActive,
          });

          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'active');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isBoolean');
        },
      );
    });

    describe('inherited properties', () => {
      it('should fail when type is not a valid CouponType', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          type: 'INVALID_COUPON_TYPE' as any,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'type');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isEnum');
      });

      it('should fail when value is negative', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          value: -10,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'value');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when value is not an integer', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          value: 15.5,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'value');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });

      it('should fail when minOrder is negative', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          minOrder: -1,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'minOrder');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when minOrder is not an integer', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          minOrder: 100.5,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'minOrder');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });

      it('should fail when maxDiscount is negative', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          maxDiscount: -1,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxDiscount');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxDiscount is not an integer', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          maxDiscount: 200.75,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxDiscount');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });

      it('should fail when validFrom is not a valid date', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          validFrom: 'not-a-date' as any,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'validFrom');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isDate');
      });

      it('should fail when validUntil is not a valid date', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          validUntil: 'not-a-date' as any,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'validUntil');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isDate');
      });

      it('should fail when maxUses is 0 (below min 1)', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          maxUses: 0,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUses');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxUses is not an integer', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          maxUses: 3.14,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUses');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });

      it('should fail when maxUsesPerUser is 0 (below min 1)', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          maxUsesPerUser: 0,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUsesPerUser');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('min');
      });

      it('should fail when maxUsesPerUser is not an integer', async () => {
        const dto = plainToInstance(UpdateCouponDto, {
          maxUsesPerUser: 1.25,
        });

        const errors = await validate(dto);
        const err = errors.find((e) => e.property === 'maxUsesPerUser');
        expect(err).toBeDefined();
        expect(err?.constraints).toHaveProperty('isInt');
      });
    });
  });
});
