import { MoneyUtil } from './money.util';

describe('MoneyUtil', () => {
  it('should be defined and constructible as a class instance', () => {
    const instance = new MoneyUtil();
    expect(instance).toBeDefined();
    expect(instance).toBeInstanceOf(MoneyUtil);
  });

  describe('format', () => {
    it('should format positive integer amounts as VND currency string', () => {
      const amount = 120000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
      expect(result).toContain('₫');
    });

    it('should format zero amount correctly', () => {
      const amount = 0;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
    });

    it('should format negative amount correctly', () => {
      const amount = -50000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
    });

    it('should format large amount correctly', () => {
      const amount = 25000000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
    });
  });

  describe('calculateDiscountPercent', () => {
    it('should return 0 when original price is 0', () => {
      expect(MoneyUtil.calculateDiscountPercent(0, 50)).toBe(0);
    });

    it('should return 0 when original price is negative', () => {
      expect(MoneyUtil.calculateDiscountPercent(-100, 50)).toBe(0);
    });

    it('should calculate rounded discount percentage for valid prices', () => {
      // 20% discount: (100 - 80) / 100 * 100 = 20
      expect(MoneyUtil.calculateDiscountPercent(100, 80)).toBe(20);
      // 25% discount: (200 - 150) / 200 * 100 = 25
      expect(MoneyUtil.calculateDiscountPercent(200, 150)).toBe(25);
      // 50% discount: (1000 - 500) / 1000 * 100 = 50
      expect(MoneyUtil.calculateDiscountPercent(1000, 500)).toBe(50);
    });

    it('should round to nearest whole percentage', () => {
      // (300 - 200) / 300 * 100 = 33.333... -> 33
      expect(MoneyUtil.calculateDiscountPercent(300, 200)).toBe(33);
      // (300 - 100) / 300 * 100 = 66.666... -> 67
      expect(MoneyUtil.calculateDiscountPercent(300, 100)).toBe(67);
    });

    it('should return 0 when original price equals sale price', () => {
      expect(MoneyUtil.calculateDiscountPercent(100, 100)).toBe(0);
    });

    it('should calculate negative percentage when sale price exceeds original price', () => {
      // (100 - 120) / 100 * 100 = -20
      expect(MoneyUtil.calculateDiscountPercent(100, 120)).toBe(-20);
    });
  });

  describe('applyPercent', () => {
    it('should return the original amount when percent is 0', () => {
      expect(MoneyUtil.applyPercent(100000, 0)).toBe(100000);
    });

    it('should apply discount percent accurately', () => {
      // 10% off 100,000 = 90,000
      expect(MoneyUtil.applyPercent(100000, 10)).toBe(90000);
      // 25% off 200,000 = 150,000
      expect(MoneyUtil.applyPercent(200000, 25)).toBe(150000);
    });

    it('should return 0 when discount percent is 100', () => {
      expect(MoneyUtil.applyPercent(100000, 100)).toBe(0);
    });

    it('should round the discounted amount to nearest integer', () => {
      // 100 * (1 - 33.33 / 100) = 66.67 -> 67
      expect(MoneyUtil.applyPercent(100, 33.33)).toBe(67);
      // 99 * (1 - 10 / 100) = 89.1 -> 89
      expect(MoneyUtil.applyPercent(99, 10)).toBe(89);
    });

    it('should handle zero amount', () => {
      expect(MoneyUtil.applyPercent(0, 50)).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should use default taxPercent of 0 when taxPercent is omitted', () => {
      expect(MoneyUtil.calculateTotal(100000)).toBe(100000);
    });

    it('should use default taxPercent of 0 when undefined is explicitly passed', () => {
      expect(MoneyUtil.calculateTotal(100000, undefined)).toBe(100000);
    });

    it('should calculate total with 0% tax', () => {
      expect(MoneyUtil.calculateTotal(100000, 0)).toBe(100000);
    });

    it('should calculate total with positive tax percentage', () => {
      // 10% VAT: 100,000 * 1.10 = 110,000
      expect(MoneyUtil.calculateTotal(100000, 10)).toBe(110000);
      // 8% VAT: 125,000 * 1.08 = 135,000
      expect(MoneyUtil.calculateTotal(125000, 8)).toBe(135000);
    });

    it('should round total with tax to nearest integer', () => {
      // 99 * (1 + 15 / 100) = 113.85 -> 114
      expect(MoneyUtil.calculateTotal(99, 15)).toBe(114);
      // 101 * (1 + 7 / 100) = 108.07 -> 108
      expect(MoneyUtil.calculateTotal(101, 7)).toBe(108);
    });

    it('should handle 0 subtotal', () => {
      expect(MoneyUtil.calculateTotal(0, 10)).toBe(0);
    });
  });

  describe('calculateDiscount', () => {
    describe('couponType === PERCENT', () => {
      it('should calculate percent discount without maxDiscount cap when maxDiscount is omitted', () => {
        // 10% of 200,000 = 20,000
        expect(MoneyUtil.calculateDiscount(200000, 'PERCENT', 10)).toBe(20000);
      });

      it('should calculate percent discount without maxDiscount cap when maxDiscount is undefined', () => {
        // 15% of 200,000 = 30,000
        expect(
          MoneyUtil.calculateDiscount(200000, 'PERCENT', 15, undefined),
        ).toBe(30000);
      });

      it('should calculate percent discount without maxDiscount cap when maxDiscount is null', () => {
        // 20% of 200,000 = 40,000
        expect(MoneyUtil.calculateDiscount(200000, 'PERCENT', 20, null)).toBe(
          40000,
        );
      });

      it('should cap discount to maxDiscount when calculated discount exceeds maxDiscount', () => {
        // 20% of 200,000 = 40,000 > maxDiscount 30,000 -> 30,000
        expect(MoneyUtil.calculateDiscount(200000, 'PERCENT', 20, 30000)).toBe(
          30000,
        );
      });

      it('should return calculated discount when discount is exactly equal to maxDiscount', () => {
        // 20% of 200,000 = 40,000 === maxDiscount 40,000 -> 40,000
        expect(MoneyUtil.calculateDiscount(200000, 'PERCENT', 20, 40000)).toBe(
          40000,
        );
      });

      it('should return calculated discount when discount is strictly less than maxDiscount', () => {
        // 10% of 200,000 = 20,000 < maxDiscount 50,000 -> 20,000
        expect(MoneyUtil.calculateDiscount(200000, 'PERCENT', 10, 50000)).toBe(
          20000,
        );
      });

      it('should round calculated percentage discount to nearest integer', () => {
        // 15% of 199 = 29.85 -> 30
        expect(MoneyUtil.calculateDiscount(199, 'PERCENT', 15)).toBe(30);
      });
    });

    describe('couponType === FIXED', () => {
      it('should return couponValue when couponValue is less than orderTotal', () => {
        // Order: 100,000, coupon: 30,000 -> 30,000
        expect(MoneyUtil.calculateDiscount(100000, 'FIXED', 30000)).toBe(30000);
      });

      it('should return couponValue when couponValue equals orderTotal', () => {
        // Order: 50,000, coupon: 50,000 -> 50,000
        expect(MoneyUtil.calculateDiscount(50000, 'FIXED', 50000)).toBe(50000);
      });

      it('should cap discount to orderTotal when couponValue exceeds orderTotal', () => {
        // Order: 40,000, coupon: 60,000 -> 40,000
        expect(MoneyUtil.calculateDiscount(40000, 'FIXED', 60000)).toBe(40000);
      });
    });

    describe('couponType === FREESHIP', () => {
      it('should return 0 because shipping discounts are applied to shipping fee, not merchandise subtotal', () => {
        expect(MoneyUtil.calculateDiscount(100000, 'FREESHIP', 30000)).toBe(0);
        expect(
          MoneyUtil.calculateDiscount(50000, 'FREESHIP', 50000, 10000),
        ).toBe(0);
      });
    });

    describe('unsupported or fallback coupon types', () => {
      it('should return 0 when couponType is invalid or unknown', () => {
        expect(
          MoneyUtil.calculateDiscount(100000, 'INVALID' as any, 20000),
        ).toBe(0);
        expect(MoneyUtil.calculateDiscount(100000, '' as any, 20000)).toBe(0);
      });
    });
  });
});
