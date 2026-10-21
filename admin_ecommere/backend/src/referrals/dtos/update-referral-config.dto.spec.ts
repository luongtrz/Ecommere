import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CouponType } from '@prisma/client';
import { UpdateReferralConfigDto } from './update-referral-config.dto';

describe('UpdateReferralConfigDto', () => {
  describe('Instantiation and Defaults', () => {
    it('should be defined on direct instantiation with all properties undefined', () => {
      const dto = new UpdateReferralConfigDto();

      expect(dto).toBeDefined();
      expect(dto.active).toBeUndefined();
      expect(dto.referrerCouponType).toBeUndefined();
      expect(dto.referrerCouponValue).toBeUndefined();
      expect(dto.referrerMaxDiscount).toBeUndefined();
      expect(dto.refereeCouponType).toBeUndefined();
      expect(dto.refereeCouponValue).toBeUndefined();
      expect(dto.refereeMaxDiscount).toBeUndefined();
      expect(dto.minOrderForCoupon).toBeUndefined();
      expect(dto.couponValidDays).toBeUndefined();
      expect(dto.maxReferralsPerUser).toBeUndefined();
    });

    it('should pass validation when instantiated without properties (all optional)', async () => {
      const dto = new UpdateReferralConfigDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation when transforming empty plain object', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {});
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Valid inputs', () => {
    it('should pass validation with complete valid payload using PERCENT coupon types', async () => {
      const plain = {
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 10,
        referrerMaxDiscount: 50000,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 5,
        refereeMaxDiscount: 20000,
        minOrderForCoupon: 100000,
        couponValidDays: 30,
        maxReferralsPerUser: 5,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.active).toBe(true);
      expect(dto.referrerCouponType).toBe(CouponType.PERCENT);
      expect(dto.referrerCouponValue).toBe(10);
      expect(dto.referrerMaxDiscount).toBe(50000);
      expect(dto.refereeCouponType).toBe(CouponType.PERCENT);
      expect(dto.refereeCouponValue).toBe(5);
      expect(dto.refereeMaxDiscount).toBe(20000);
      expect(dto.minOrderForCoupon).toBe(100000);
      expect(dto.couponValidDays).toBe(30);
      expect(dto.maxReferralsPerUser).toBe(5);
    });

    it('should pass validation with complete valid payload using FIXED coupon types', async () => {
      const plain = {
        active: false,
        referrerCouponType: CouponType.FIXED,
        referrerCouponValue: 50000,
        referrerMaxDiscount: 50000,
        refereeCouponType: CouponType.FIXED,
        refereeCouponValue: 20000,
        refereeMaxDiscount: 20000,
        minOrderForCoupon: 200000,
        couponValidDays: 14,
        maxReferralsPerUser: 10,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.active).toBe(false);
      expect(dto.referrerCouponType).toBe(CouponType.FIXED);
      expect(dto.referrerCouponValue).toBe(50000);
      expect(dto.refereeCouponType).toBe(CouponType.FIXED);
      expect(dto.refereeCouponValue).toBe(20000);
    });

    it('should pass validation with FREESHIP coupon types', async () => {
      const plain = {
        referrerCouponType: CouponType.FREESHIP,
        referrerCouponValue: 0,
        refereeCouponType: CouponType.FREESHIP,
        refereeCouponValue: 0,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.referrerCouponType).toBe(CouponType.FREESHIP);
      expect(dto.refereeCouponType).toBe(CouponType.FREESHIP);
    });

    it('should accept minimum boundary values (0 for min(0) fields, 1 for min(1) fields)', async () => {
      const plain = {
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 0,
        referrerMaxDiscount: 0,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 0,
        refereeMaxDiscount: 0,
        minOrderForCoupon: 0,
        couponValidDays: 1,
        maxReferralsPerUser: 1,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.referrerCouponValue).toBe(0);
      expect(dto.referrerMaxDiscount).toBe(0);
      expect(dto.refereeCouponValue).toBe(0);
      expect(dto.refereeMaxDiscount).toBe(0);
      expect(dto.minOrderForCoupon).toBe(0);
      expect(dto.couponValidDays).toBe(1);
      expect(dto.maxReferralsPerUser).toBe(1);
    });

    it('should accept maximum boundary value 100 for percent coupons', async () => {
      const plain = {
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 100,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 100,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.referrerCouponValue).toBe(100);
      expect(dto.refereeCouponValue).toBe(100);
    });

    it('should transform numeric string inputs into numbers via @Type', async () => {
      const plainWithStrings = {
        referrerCouponValue: '15',
        referrerMaxDiscount: '60000',
        refereeCouponValue: '10',
        refereeMaxDiscount: '25000',
        minOrderForCoupon: '150000',
        couponValidDays: '45',
        maxReferralsPerUser: '20',
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plainWithStrings);

      expect(dto.referrerCouponValue).toBe(15);
      expect(typeof dto.referrerCouponValue).toBe('number');
      expect(dto.referrerMaxDiscount).toBe(60000);
      expect(typeof dto.referrerMaxDiscount).toBe('number');
      expect(dto.refereeCouponValue).toBe(10);
      expect(typeof dto.refereeCouponValue).toBe('number');
      expect(dto.refereeMaxDiscount).toBe(25000);
      expect(typeof dto.refereeMaxDiscount).toBe('number');
      expect(dto.minOrderForCoupon).toBe(150000);
      expect(typeof dto.minOrderForCoupon).toBe('number');
      expect(dto.couponValidDays).toBe(45);
      expect(typeof dto.couponValidDays).toBe('number');
      expect(dto.maxReferralsPerUser).toBe(20);
      expect(typeof dto.maxReferralsPerUser).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when only partial fields are provided', async () => {
      const plain = {
        active: true,
        couponValidDays: 60,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('active property validation', () => {
    it('should accept boolean true and false', async () => {
      const dtoTrue = plainToInstance(UpdateReferralConfigDto, {
        active: true,
      });
      const errorsTrue = await validate(dtoTrue);
      expect(errorsTrue).toHaveLength(0);

      const dtoFalse = plainToInstance(UpdateReferralConfigDto, {
        active: false,
      });
      const errorsFalse = await validate(dtoFalse);
      expect(errorsFalse).toHaveLength(0);
    });

    it('should fail validation when active is a non-boolean string', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        active: 'not-a-boolean' as any,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'active');
      expect(error).toBeDefined();
      expect(error?.constraints?.isBoolean).toBeDefined();
    });

    it('should fail validation when active is a number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        active: 1 as any,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'active');
      expect(error).toBeDefined();
      expect(error?.constraints?.isBoolean).toBeDefined();
    });
  });

  describe('referrerCouponType property validation', () => {
    it('should accept valid CouponType enum values', async () => {
      for (const type of [
        CouponType.PERCENT,
        CouponType.FIXED,
        CouponType.FREESHIP,
      ]) {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: type,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation when referrerCouponType is not a valid enum value', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        referrerCouponType: 'INVALID_TYPE' as any,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'referrerCouponType');
      expect(error).toBeDefined();
      expect(error?.constraints?.isEnum).toBeDefined();
    });

    it('should fail validation when referrerCouponType is a number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        referrerCouponType: 999 as any,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'referrerCouponType');
      expect(error).toBeDefined();
      expect(error?.constraints?.isEnum).toBeDefined();
    });
  });

  describe('refereeCouponType property validation', () => {
    it('should accept valid CouponType enum values', async () => {
      for (const type of [
        CouponType.PERCENT,
        CouponType.FIXED,
        CouponType.FREESHIP,
      ]) {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: type,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation when refereeCouponType is not a valid enum value', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        refereeCouponType: 'INVALID_TYPE' as any,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'refereeCouponType');
      expect(error).toBeDefined();
      expect(error?.constraints?.isEnum).toBeDefined();
    });

    it('should fail validation when refereeCouponType is a number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        refereeCouponType: 123 as any,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'refereeCouponType');
      expect(error).toBeDefined();
      expect(error?.constraints?.isEnum).toBeDefined();
    });
  });

  describe('referrerCouponValue validation and conditional rules (@ValidateIf)', () => {
    describe('when referrerCouponType is PERCENT (branch true)', () => {
      it('should pass validation for valid percentage values (0 to 100)', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 25,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should fail validation when referrerCouponValue exceeds 100', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 101,
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'referrerCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.max).toBeDefined();
      });

      it('should fail validation when referrerCouponValue is negative', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: -1,
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'referrerCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.min).toBeDefined();
      });

      it('should fail validation when referrerCouponValue is not an integer', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 12.5,
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'referrerCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.isInt).toBeDefined();
      });

      it('should fail validation when referrerCouponValue is non-numeric string', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 'invalid-number',
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'referrerCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.isInt).toBeDefined();
      });
    });

    describe('when referrerCouponType is not PERCENT (branch false)', () => {
      it('should not enforce @Max(100) when referrerCouponType is FIXED', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.FIXED,
          referrerCouponValue: 50000,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should not enforce @Max(100) when referrerCouponType is FREESHIP', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponType: CouponType.FREESHIP,
          referrerCouponValue: 200,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should not enforce @Max(100) when referrerCouponType is undefined', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          referrerCouponValue: 500,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('refereeCouponValue validation and conditional rules (@ValidateIf)', () => {
    describe('when refereeCouponType is PERCENT (branch true)', () => {
      it('should pass validation for valid percentage values (0 to 100)', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 15,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should fail validation when refereeCouponValue exceeds 100', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 105,
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'refereeCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.max).toBeDefined();
      });

      it('should fail validation when refereeCouponValue is negative', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: -5,
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'refereeCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.min).toBeDefined();
      });

      it('should fail validation when refereeCouponValue is not an integer', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 8.75,
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'refereeCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.isInt).toBeDefined();
      });

      it('should fail validation when refereeCouponValue is non-numeric string', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 'not-a-number',
        });
        const errors = await validate(dto);

        const error = errors.find((e) => e.property === 'refereeCouponValue');
        expect(error).toBeDefined();
        expect(error?.constraints?.isInt).toBeDefined();
      });
    });

    describe('when refereeCouponType is not PERCENT (branch false)', () => {
      it('should not enforce @Max(100) when refereeCouponType is FIXED', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.FIXED,
          refereeCouponValue: 30000,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should not enforce @Max(100) when refereeCouponType is FREESHIP', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponType: CouponType.FREESHIP,
          refereeCouponValue: 150,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should not enforce @Max(100) when refereeCouponType is undefined', async () => {
        const dto = plainToInstance(UpdateReferralConfigDto, {
          refereeCouponValue: 250,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('referrerMaxDiscount property validation', () => {
    it('should accept valid non-negative integers', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        referrerMaxDiscount: 75000,
      });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when referrerMaxDiscount is negative', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        referrerMaxDiscount: -1,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'referrerMaxDiscount');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when referrerMaxDiscount is a decimal number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        referrerMaxDiscount: 500.5,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'referrerMaxDiscount');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when referrerMaxDiscount is a non-numeric string', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        referrerMaxDiscount: 'abc',
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'referrerMaxDiscount');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });
  });

  describe('refereeMaxDiscount property validation', () => {
    it('should accept valid non-negative integers', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        refereeMaxDiscount: 35000,
      });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when refereeMaxDiscount is negative', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        refereeMaxDiscount: -10,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'refereeMaxDiscount');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when refereeMaxDiscount is a decimal number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        refereeMaxDiscount: 100.25,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'refereeMaxDiscount');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when refereeMaxDiscount is a non-numeric string', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        refereeMaxDiscount: 'xyz',
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'refereeMaxDiscount');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });
  });

  describe('minOrderForCoupon property validation', () => {
    it('should accept valid non-negative integers', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        minOrderForCoupon: 250000,
      });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when minOrderForCoupon is negative', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        minOrderForCoupon: -50000,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'minOrderForCoupon');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when minOrderForCoupon is a decimal number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        minOrderForCoupon: 150000.75,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'minOrderForCoupon');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when minOrderForCoupon is a non-numeric string', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        minOrderForCoupon: 'free',
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'minOrderForCoupon');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });
  });

  describe('couponValidDays property validation (@Min(1))', () => {
    it('should accept valid positive integers >= 1', async () => {
      const dto1 = plainToInstance(UpdateReferralConfigDto, {
        couponValidDays: 1,
      });
      const errors1 = await validate(dto1);
      expect(errors1).toHaveLength(0);

      const dto30 = plainToInstance(UpdateReferralConfigDto, {
        couponValidDays: 30,
      });
      const errors30 = await validate(dto30);
      expect(errors30).toHaveLength(0);
    });

    it('should fail validation when couponValidDays is 0 (below min 1)', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        couponValidDays: 0,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'couponValidDays');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when couponValidDays is negative', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        couponValidDays: -7,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'couponValidDays');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when couponValidDays is a decimal number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        couponValidDays: 14.5,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'couponValidDays');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when couponValidDays is a non-numeric string', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        couponValidDays: 'thirty',
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'couponValidDays');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });
  });

  describe('maxReferralsPerUser property validation (@Min(1))', () => {
    it('should accept valid positive integers >= 1', async () => {
      const dto1 = plainToInstance(UpdateReferralConfigDto, {
        maxReferralsPerUser: 1,
      });
      const errors1 = await validate(dto1);
      expect(errors1).toHaveLength(0);

      const dto10 = plainToInstance(UpdateReferralConfigDto, {
        maxReferralsPerUser: 10,
      });
      const errors10 = await validate(dto10);
      expect(errors10).toHaveLength(0);
    });

    it('should fail validation when maxReferralsPerUser is 0 (below min 1)', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        maxReferralsPerUser: 0,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'maxReferralsPerUser');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when maxReferralsPerUser is negative', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        maxReferralsPerUser: -3,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'maxReferralsPerUser');
      expect(error).toBeDefined();
      expect(error?.constraints?.min).toBeDefined();
    });

    it('should fail validation when maxReferralsPerUser is a decimal number', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        maxReferralsPerUser: 5.5,
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'maxReferralsPerUser');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when maxReferralsPerUser is a non-numeric string', async () => {
      const dto = plainToInstance(UpdateReferralConfigDto, {
        maxReferralsPerUser: 'unlimited',
      });
      const errors = await validate(dto);

      const error = errors.find((e) => e.property === 'maxReferralsPerUser');
      expect(error).toBeDefined();
      expect(error?.constraints?.isInt).toBeDefined();
    });
  });

  describe('Multiple validation failures', () => {
    it('should capture errors across multiple invalid fields simultaneously', async () => {
      const plain = {
        active: 'true' as any,
        referrerCouponType: 'NOT_A_COUPON_TYPE' as any,
        referrerCouponValue: -10,
        referrerMaxDiscount: -500,
        refereeCouponType: 'ANOTHER_INVALID_TYPE' as any,
        refereeCouponValue: 200,
        refereeMaxDiscount: -200,
        minOrderForCoupon: -1000,
        couponValidDays: 0,
        maxReferralsPerUser: -1,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      const failedProps = errors.map((e) => e.property);
      expect(failedProps).toContain('active');
      expect(failedProps).toContain('referrerCouponType');
      expect(failedProps).toContain('referrerMaxDiscount');
      expect(failedProps).toContain('refereeCouponType');
      expect(failedProps).toContain('refereeMaxDiscount');
      expect(failedProps).toContain('minOrderForCoupon');
      expect(failedProps).toContain('couponValidDays');
      expect(failedProps).toContain('maxReferralsPerUser');
    });

    it('should capture PERCENT coupon value violations for both referrer and referee simultaneously', async () => {
      const plain = {
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 150,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: -20,
      };

      const dto = plainToInstance(UpdateReferralConfigDto, plain);
      const errors = await validate(dto);

      const failedProps = errors.map((e) => e.property);
      expect(failedProps).toContain('referrerCouponValue');
      expect(failedProps).toContain('refereeCouponValue');

      const referrerValError = errors.find(
        (e) => e.property === 'referrerCouponValue',
      );
      expect(referrerValError?.constraints?.max).toBeDefined();

      const refereeValError = errors.find(
        (e) => e.property === 'refereeCouponValue',
      );
      expect(refereeValError?.constraints?.min).toBeDefined();
    });
  });
});
