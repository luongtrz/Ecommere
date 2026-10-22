import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDiscount,
  calculateTotal,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers as VND currency', () => {
      const amount = 250000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
      expect(formatCurrency(amount)).toBe(expected);
    });

    it('formats 0 as VND currency', () => {
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(0);
      expect(formatCurrency(0)).toBe(expected);
    });

    it('formats negative numbers as VND currency', () => {
      const amount = -30000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
      expect(formatCurrency(amount)).toBe(expected);
    });

    it('formats large numbers as VND currency', () => {
      const amount = 1000000000;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
      expect(formatCurrency(amount)).toBe(expected);
    });

    it('formats floating point numbers as VND currency', () => {
      const amount = 12345.67;
      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
      expect(formatCurrency(amount)).toBe(expected);
    });
  });

  describe('formatNumber', () => {
    it('formats positive integers with Vietnamese locale grouping', () => {
      const num = 1234567;
      const expected = new Intl.NumberFormat('vi-VN').format(num);
      expect(formatNumber(num)).toBe(expected);
    });

    it('formats 0 correctly', () => {
      const expected = new Intl.NumberFormat('vi-VN').format(0);
      expect(formatNumber(0)).toBe(expected);
    });

    it('formats negative numbers correctly', () => {
      const num = -9876543;
      const expected = new Intl.NumberFormat('vi-VN').format(num);
      expect(formatNumber(num)).toBe(expected);
    });

    it('formats floating point numbers correctly', () => {
      const num = 1234.56;
      const expected = new Intl.NumberFormat('vi-VN').format(num);
      expect(formatNumber(num)).toBe(expected);
    });

    it('formats small numbers correctly', () => {
      expect(formatNumber(42)).toBe(new Intl.NumberFormat('vi-VN').format(42));
    });
  });

  describe('formatDiscount', () => {
    it('calculates and formats standard discount percentage', () => {
      expect(formatDiscount(100000, 80000)).toBe('-20%');
      expect(formatDiscount(200, 100)).toBe('-50%');
    });

    it('rounds discount down when fractional part is less than 0.5', () => {
      // (300 - 200) / 300 * 100 = 33.333... -> 33
      expect(formatDiscount(300, 200)).toBe('-33%');
    });

    it('rounds discount up when fractional part is 0.5 or greater', () => {
      // (300 - 100) / 300 * 100 = 66.666... -> 67
      expect(formatDiscount(300, 100)).toBe('-67%');
      // (80 - 70) / 80 * 100 = 12.5 -> 13
      expect(formatDiscount(80, 70)).toBe('-13%');
    });

    it('returns -0% when sale price equals original price', () => {
      expect(formatDiscount(100, 100)).toBe('-0%');
    });

    it('returns -100% when sale price is 0', () => {
      expect(formatDiscount(50000, 0)).toBe('-100%');
    });

    it('handles cases where sale price is greater than original price', () => {
      // (100 - 120) / 100 * 100 = -20 -> -(-20)% = --20%
      expect(formatDiscount(100, 120)).toBe('--20%');
    });
  });

  describe('calculateTotal', () => {
    it('returns 0 for an empty array of items', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('calculates total for a single item', () => {
      const items = [{ price: 50000, quantity: 2 }];
      expect(calculateTotal(items)).toBe(100000);
    });

    it('calculates total for multiple items', () => {
      const items = [
        { price: 10000, quantity: 3 },
        { price: 25000, quantity: 2 },
        { price: 5000, quantity: 1 },
      ];
      expect(calculateTotal(items)).toBe(85000);
    });

    it('handles items with zero quantity or zero price', () => {
      const items = [
        { price: 0, quantity: 5 },
        { price: 20000, quantity: 0 },
      ];
      expect(calculateTotal(items)).toBe(0);
    });

    it('handles floating point prices and quantities', () => {
      const items = [
        { price: 10.5, quantity: 2 },
        { price: 4.25, quantity: 4 },
      ];
      expect(calculateTotal(items)).toBe(38);
    });
  });
});
