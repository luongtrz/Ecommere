import { CouponType } from '@prisma/client';
import { CouponEntity, CouponValidationEntity } from './coupon.entity';

describe('CouponEntity', () => {
  it('should be defined', () => {
    expect(CouponEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of CouponEntity with all properties assigned', () => {
      const validFrom = new Date('2026-01-01T00:00:00.000Z');
      const validUntil = new Date('2026-12-31T23:59:59.000Z');
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');

      const couponData: Partial<CouponEntity> = {
        code: 'SUMMER2026',
        type: CouponType.PERCENT,
        value: 15,
        minOrder: 100,
        maxDiscount: 50,
        validFrom,
        validUntil,
        maxUses: 500,
        maxUsesPerUser: 2,
        usedCount: 10,
        createdAt,
        updatedAt,
      };

      const entity = new CouponEntity(couponData);

      expect(entity).toBeInstanceOf(CouponEntity);
      expect(entity.code).toBe('SUMMER2026');
      expect(entity.type).toBe(CouponType.PERCENT);
      expect(entity.value).toBe(15);
      expect(entity.minOrder).toBe(100);
      expect(entity.maxDiscount).toBe(50);
      expect(entity.validFrom).toEqual(validFrom);
      expect(entity.validUntil).toEqual(validUntil);
      expect(entity.maxUses).toBe(500);
      expect(entity.maxUsesPerUser).toBe(2);
      expect(entity.usedCount).toBe(10);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
    });

    it('should support FIXED and FREESHIP coupon types', () => {
      const fixedCoupon = new CouponEntity({
        code: 'FIXED50',
        type: CouponType.FIXED,
        value: 50,
      });
      expect(fixedCoupon.type).toBe(CouponType.FIXED);

      const freeshipCoupon = new CouponEntity({
        code: 'FREESHIP2026',
        type: CouponType.FREESHIP,
        value: 0,
      });
      expect(freeshipCoupon.type).toBe(CouponType.FREESHIP);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-01T00:00:00.000Z');
      const partialData: Partial<CouponEntity> = {
        code: 'BASIC10',
        type: CouponType.PERCENT,
        value: 10,
        usedCount: 0,
        createdAt,
        updatedAt,
      };

      const entity = new CouponEntity(partialData);

      expect(entity).toBeInstanceOf(CouponEntity);
      expect(entity.code).toBe('BASIC10');
      expect(entity.type).toBe(CouponType.PERCENT);
      expect(entity.value).toBe(10);
      expect(entity.usedCount).toBe(0);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.minOrder).toBeUndefined();
      expect(entity.maxDiscount).toBeUndefined();
      expect(entity.validFrom).toBeUndefined();
      expect(entity.validUntil).toBeUndefined();
      expect(entity.maxUses).toBeUndefined();
      expect(entity.maxUsesPerUser).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new CouponEntity({});

      expect(entity).toBeInstanceOf(CouponEntity);
      expect(entity.code).toBeUndefined();
      expect(entity.type).toBeUndefined();
      expect(entity.value).toBeUndefined();
      expect(entity.minOrder).toBeUndefined();
      expect(entity.maxDiscount).toBeUndefined();
      expect(entity.validFrom).toBeUndefined();
      expect(entity.validUntil).toBeUndefined();
      expect(entity.maxUses).toBeUndefined();
      expect(entity.maxUsesPerUser).toBeUndefined();
      expect(entity.usedCount).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<CouponEntity> = {
        code: 'PARTIAL',
        value: 20,
      };

      const entity = new CouponEntity(partialData);

      expect(entity).toBeInstanceOf(CouponEntity);
      expect(entity.code).toBe('PARTIAL');
      expect(entity.value).toBe(20);
      expect(entity.type).toBeUndefined();
      expect(entity.minOrder).toBeUndefined();
      expect(entity.maxDiscount).toBeUndefined();
      expect(entity.usedCount).toBeUndefined();
    });

    it('should handle zero and numeric boundary values correctly', () => {
      const entity = new CouponEntity({
        code: 'ZERO',
        type: CouponType.FIXED,
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        maxUses: 0,
        maxUsesPerUser: 0,
        usedCount: 0,
      });

      expect(entity).toBeInstanceOf(CouponEntity);
      expect(entity.value).toBe(0);
      expect(entity.minOrder).toBe(0);
      expect(entity.maxDiscount).toBe(0);
      expect(entity.maxUses).toBe(0);
      expect(entity.maxUsesPerUser).toBe(0);
      expect(entity.usedCount).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new CouponEntity(
        null as unknown as Partial<CouponEntity>,
      );
      expect(entityNull).toBeInstanceOf(CouponEntity);

      const entityUndefined = new CouponEntity(
        undefined as unknown as Partial<CouponEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(CouponEntity);
    });
  });
});

describe('CouponValidationEntity', () => {
  it('should be defined', () => {
    expect(CouponValidationEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of CouponValidationEntity with all properties assigned', () => {
      const coupon = new CouponEntity({
        code: 'DISCOUNT20',
        type: CouponType.PERCENT,
        value: 20,
        usedCount: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const validationData: Partial<CouponValidationEntity> = {
        valid: true,
        message: 'Coupon applied successfully',
        coupon,
        discountAmount: 40,
      };

      const entity = new CouponValidationEntity(validationData);

      expect(entity).toBeInstanceOf(CouponValidationEntity);
      expect(entity.valid).toBe(true);
      expect(entity.message).toBe('Coupon applied successfully');
      expect(entity.coupon).toBe(coupon);
      expect(entity.coupon).toBeInstanceOf(CouponEntity);
      expect(entity.discountAmount).toBe(40);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const entity = new CouponValidationEntity({
        valid: true,
      });

      expect(entity).toBeInstanceOf(CouponValidationEntity);
      expect(entity.valid).toBe(true);
      expect(entity.message).toBeUndefined();
      expect(entity.coupon).toBeUndefined();
      expect(entity.discountAmount).toBeUndefined();
    });

    it('should handle invalid validation result with error message and without coupon', () => {
      const entity = new CouponValidationEntity({
        valid: false,
        message: 'Coupon has expired',
      });

      expect(entity).toBeInstanceOf(CouponValidationEntity);
      expect(entity.valid).toBe(false);
      expect(entity.message).toBe('Coupon has expired');
      expect(entity.coupon).toBeUndefined();
      expect(entity.discountAmount).toBeUndefined();
    });

    it('should handle zero discountAmount correctly', () => {
      const entity = new CouponValidationEntity({
        valid: true,
        discountAmount: 0,
      });

      expect(entity).toBeInstanceOf(CouponValidationEntity);
      expect(entity.valid).toBe(true);
      expect(entity.discountAmount).toBe(0);
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new CouponValidationEntity({});

      expect(entity).toBeInstanceOf(CouponValidationEntity);
      expect(entity.valid).toBeUndefined();
      expect(entity.message).toBeUndefined();
      expect(entity.coupon).toBeUndefined();
      expect(entity.discountAmount).toBeUndefined();
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new CouponValidationEntity(
        null as unknown as Partial<CouponValidationEntity>,
      );
      expect(entityNull).toBeInstanceOf(CouponValidationEntity);

      const entityUndefined = new CouponValidationEntity(
        undefined as unknown as Partial<CouponValidationEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(CouponValidationEntity);
    });
  });
});
