import { Test, TestingModule } from '@nestjs/testing';
import { MoneyUtil } from './money.util';

describe('MoneyUtil', () => {
  let util: MoneyUtil;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MoneyUtil],
    }).compile();

    util = module.get<MoneyUtil>(MoneyUtil);
  });

  it('should be defined and instantiable', () => {
    expect(util).toBeDefined();
    expect(util).toBeInstanceOf(MoneyUtil);
    expect(new MoneyUtil()).toBeInstanceOf(MoneyUtil);
  });

  describe('format', () => {
    it('should format positive integer amounts as VND currency string matching Intl format', () => {
      const amount = 120000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
      expect(result).toContain('120');
      expect(result).toMatch(/₫|đ|VND/);
    });

    it('should format 0 as VND currency string matching Intl format', () => {
      const amount = 0;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
      expect(result).toContain('0');
      expect(result).toMatch(/₫|đ|VND/);
    });

    it('should format negative amounts correctly', () => {
      const amount = -50000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
      expect(result).toContain('50');
      expect(result).toMatch(/-/);
    });

    it('should format large amounts correctly', () => {
      const amount = 1000000000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

      const result = MoneyUtil.format(amount);

      expect(result).toBe(expected);
      expect(result).toContain('1');
    });
  });

  describe('calculateDiscountPercent', () => {
    it('should return 0 when original price is 0', () => {
      expect(MoneyUtil.calculateDiscountPercent(0, 100)).toBe(0);
    });

    it('should return 0 when original price is negative', () => {
      expect(MoneyUtil.calculateDiscountPercent(-50000, 20000)).toBe(0);
    });

    it('should calculate discount percent correctly when original > sale', () => {
      // (100 - 80) / 100 * 100 = 20%
      expect(MoneyUtil.calculateDiscountPercent(100, 80)).toBe(20);
      // (200 - 100) / 200 * 100 = 50%
      expect(MoneyUtil.calculateDiscountPercent(200, 100)).toBe(50);
    });

    it('should return 0 when original equals sale (no discount)', () => {
      expect(MoneyUtil.calculateDiscountPercent(100, 100)).toBe(0);
    });

    it('should return 100 when sale price is 0 (100% discount)', () => {
      expect(MoneyUtil.calculateDiscountPercent(100, 0)).toBe(100);
    });

    it('should round discount percent to nearest integer', () => {
      // (300 - 200) / 300 * 100 = 33.333... -> 33%
      expect(MoneyUtil.calculateDiscountPercent(300, 200)).toBe(33);
      // (300 - 100) / 300 * 100 = 66.666... -> 67%
      expect(MoneyUtil.calculateDiscountPercent(300, 100)).toBe(67);
    });

    it('should return negative percentage when sale price is higher than original', () => {
      // (100 - 150) / 100 * 100 = -50%
      expect(MoneyUtil.calculateDiscountPercent(100, 150)).toBe(-50);
    });
  });

  describe('applyPercent', () => {
    it('should apply discount percentage to amount correctly', () => {
      // 1000 * (1 - 0.1) = 900
      expect(MoneyUtil.applyPercent(1000, 10)).toBe(900);
      // 500 * (1 - 0.5) = 250
      expect(MoneyUtil.applyPercent(500, 50)).toBe(250);
    });

    it('should return original amount when percent is 0', () => {
      expect(MoneyUtil.applyPercent(1000, 0)).toBe(1000);
    });

    it('should return 0 when percent is 100', () => {
      expect(MoneyUtil.applyPercent(1000, 100)).toBe(0);
    });

    it('should round the discounted amount to nearest integer', () => {
      // 999 * (1 - 0.15) = 849.15 -> 849
      expect(MoneyUtil.applyPercent(999, 15)).toBe(849);
      // 999 * (1 - 0.125) = 874.125 -> 874
      expect(MoneyUtil.applyPercent(999, 12.5)).toBe(874);
    });

    it('should handle zero amount', () => {
      expect(MoneyUtil.applyPercent(0, 20)).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with default taxPercent (0)', () => {
      expect(MoneyUtil.calculateTotal(1000)).toBe(1000);
    });

    it('should calculate total with explicit taxPercent = 0', () => {
      expect(MoneyUtil.calculateTotal(1000, 0)).toBe(1000);
    });

    it('should calculate total with positive tax percentage', () => {
      // 1000 * (1 + 0.1) = 1100
      expect(MoneyUtil.calculateTotal(1000, 10)).toBe(1100);
      // 50000 * (1 + 0.08) = 54000
      expect(MoneyUtil.calculateTotal(50000, 8)).toBe(54000);
    });

    it('should round total with tax to nearest integer', () => {
      // 999 * 1.08 = 1078.92 -> 1079
      expect(MoneyUtil.calculateTotal(999, 8)).toBe(1079);
    });

    it('should handle zero subtotal', () => {
      expect(MoneyUtil.calculateTotal(0, 10)).toBe(0);
    });
  });

  describe('calculateDiscount', () => {
    describe('couponType === "PERCENT"', () => {
      it('should calculate percentage discount without maxDiscount (undefined)', () => {
        // (1000 * 10) / 100 = 100
        expect(MoneyUtil.calculateDiscount(1000, 'PERCENT', 10)).toBe(100);
      });

      it('should calculate percentage discount when maxDiscount is null', () => {
        expect(MoneyUtil.calculateDiscount(1000, 'PERCENT', 10, null)).toBe(
          100,
        );
      });

      it('should calculate percentage discount when maxDiscount is explicitly undefined', () => {
        expect(
          MoneyUtil.calculateDiscount(1000, 'PERCENT', 10, undefined),
        ).toBe(100);
      });

      it('should return capped discount when calculated discount exceeds maxDiscount', () => {
        // (1000 * 20) / 100 = 200, which is > maxDiscount (150)
        expect(MoneyUtil.calculateDiscount(1000, 'PERCENT', 20, 150)).toBe(150);
      });

      it('should return uncapped discount when calculated discount is less than maxDiscount', () => {
        // (1000 * 10) / 100 = 100, which is <= maxDiscount (150)
        expect(MoneyUtil.calculateDiscount(1000, 'PERCENT', 10, 150)).toBe(100);
      });

      it('should return calculated discount when discount exactly equals maxDiscount', () => {
        // (1000 * 10) / 100 = 100, which equals maxDiscount (100)
        expect(MoneyUtil.calculateDiscount(1000, 'PERCENT', 10, 100)).toBe(100);
      });

      it('should round percentage discount to nearest integer', () => {
        // (999 * 15) / 100 = 149.85 -> 150
        expect(MoneyUtil.calculateDiscount(999, 'PERCENT', 15)).toBe(150);
      });

      it('should return 0 when couponValue is 0', () => {
        expect(MoneyUtil.calculateDiscount(1000, 'PERCENT', 0)).toBe(0);
      });
    });

    describe('couponType === "FIXED"', () => {
      it('should return couponValue when couponValue is less than orderTotal', () => {
        expect(MoneyUtil.calculateDiscount(1000, 'FIXED', 300)).toBe(300);
      });

      it('should return orderTotal when couponValue exceeds orderTotal', () => {
        expect(MoneyUtil.calculateDiscount(200, 'FIXED', 500)).toBe(200);
      });

      it('should return orderTotal when couponValue equals orderTotal', () => {
        expect(MoneyUtil.calculateDiscount(500, 'FIXED', 500)).toBe(500);
      });

      it('should return 0 when orderTotal is 0', () => {
        expect(MoneyUtil.calculateDiscount(0, 'FIXED', 100)).toBe(0);
      });
    });

    describe('couponType === "FREESHIP"', () => {
      it('should return 0 regardless of orderTotal and couponValue', () => {
        expect(MoneyUtil.calculateDiscount(1000, 'FREESHIP', 30000)).toBe(0);
        expect(MoneyUtil.calculateDiscount(0, 'FREESHIP', 0)).toBe(0);
        expect(MoneyUtil.calculateDiscount(500, 'FREESHIP', 50000, 10000)).toBe(
          0,
        );
      });
    });

    describe('unsupported couponType (fallback)', () => {
      it('should return 0 for unexpected or invalid coupon types', () => {
        expect(MoneyUtil.calculateDiscount(1000, 'UNKNOWN' as any, 50)).toBe(0);
        expect(MoneyUtil.calculateDiscount(1000, '' as any, 50)).toBe(0);
      });
    });
  });
});
