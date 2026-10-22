import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDiscount,
  calculateTotal,
} from './formatters';

describe('formatCurrency', () => {
  it('formats positive amount as VND currency', () => {
    const amount = 100000;
    const formatted = formatCurrency(amount);
    expect(formatted).toBe(
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount),
    );
    expect(formatted).toMatch(/100\.000/);
    expect(formatted).toContain('₫');
  });

  it('formats zero correctly', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toBe(
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(0),
    );
    expect(formatted).toMatch(/0/);
    expect(formatted).toContain('₫');
  });

  it('formats large numbers correctly', () => {
    const amount = 15000000;
    const formatted = formatCurrency(amount);
    expect(formatted).toBe(
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount),
    );
    expect(formatted).toMatch(/15\.000\.000/);
  });

  it('formats negative amounts correctly', () => {
    const amount = -50000;
    const formatted = formatCurrency(amount);
    expect(formatted).toBe(
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount),
    );
    expect(formatted).toContain('₫');
  });

  it('formats amounts with decimals correctly', () => {
    const amount = 1234.56;
    const formatted = formatCurrency(amount);
    expect(formatted).toBe(
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount),
    );
  });
});

describe('formatNumber', () => {
  it('formats zero as string "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats numbers under 1000 without separators', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with dot separator in vi-VN locale', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('formats negative numbers correctly', () => {
    expect(formatNumber(-1234)).toBe('-1.234');
  });

  it('formats decimal numbers with comma separator in vi-VN locale', () => {
    expect(formatNumber(1234.56)).toBe(
      new Intl.NumberFormat('vi-VN').format(1234.56),
    );
  });
});

describe('formatDiscount', () => {
  it('formats exact whole number percentage discounts', () => {
    expect(formatDiscount(100, 80)).toBe('-20%');
    expect(formatDiscount(200, 150)).toBe('-25%');
    expect(formatDiscount(150000, 120000)).toBe('-20%');
  });

  it('rounds discounts up when fractional part >= 0.5', () => {
    // ((300 - 100) / 300) * 100 = 66.666...% -> rounds to 67%
    expect(formatDiscount(300, 100)).toBe('-67%');
  });

  it('rounds discounts down when fractional part < 0.5', () => {
    // ((300 - 200) / 300) * 100 = 33.333...% -> rounds to 33%
    expect(formatDiscount(300, 200)).toBe('-33%');
  });

  it('formats zero discount when price equals salePrice', () => {
    expect(formatDiscount(100, 100)).toBe('-0%');
  });

  it('formats 100% discount when salePrice is zero', () => {
    expect(formatDiscount(100, 0)).toBe('-100%');
  });

  it('formats negative discount if salePrice exceeds original price', () => {
    // ((100 - 120) / 100) * 100 = -20 -> `-${-20}%` = `--20%`
    expect(formatDiscount(100, 120)).toBe('--20%');
  });
});

describe('calculateTotal', () => {
  it('returns 0 for an empty items list', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('calculates total for a single item', () => {
    expect(calculateTotal([{ price: 25000, quantity: 2 }])).toBe(50000);
  });

  it('calculates sum of total price across multiple items', () => {
    const items = [
      { price: 100000, quantity: 2 },
      { price: 50000, quantity: 3 },
      { price: 15000, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(365000);
  });

  it('handles items with zero quantity', () => {
    const items = [
      { price: 50000, quantity: 0 },
      { price: 20000, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(20000);
  });

  it('handles items with zero price', () => {
    const items = [
      { price: 0, quantity: 5 },
      { price: 30000, quantity: 2 },
    ];
    expect(calculateTotal(items)).toBe(60000);
  });

  it('handles decimal prices and quantities', () => {
    const items = [
      { price: 10.5, quantity: 2 },
      { price: 5, quantity: 1.5 },
    ];
    expect(calculateTotal(items)).toBe(28.5);
  });
});
