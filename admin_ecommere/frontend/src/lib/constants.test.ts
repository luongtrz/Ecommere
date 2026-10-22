import { describe, expect, it } from 'vitest';
import {
  PRODUCT_SCENTS,
  PRODUCT_VOLUMES,
  STORE_URL,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  PRODUCT_SORT_OPTIONS,
  PAGINATION,
  QUERY_KEYS,
} from './constants';

describe('constants', () => {
  describe('PRODUCT_SCENTS', () => {
    it('contains all 9 expected scent names', () => {
      expect(PRODUCT_SCENTS).toEqual([
        'Hoa Nhài',
        'Hoa Hồng',
        'Hoa Lavender',
        'Cam Chanh',
        'Dừa',
        'Bạc Hà',
        'Trà Xanh',
        'Hương Biển',
        'Hương Gỗ',
      ]);
      expect(PRODUCT_SCENTS).toHaveLength(9);
    });

    it('contains unique non-empty strings', () => {
      const scentSet = new Set(PRODUCT_SCENTS);
      expect(scentSet.size).toBe(PRODUCT_SCENTS.length);
      PRODUCT_SCENTS.forEach((scent) => {
        expect(typeof scent).toBe('string');
        expect(scent.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('PRODUCT_VOLUMES', () => {
    it('contains all 6 expected volume amounts in ml', () => {
      expect(PRODUCT_VOLUMES).toEqual([50, 100, 150, 200, 300, 500]);
      expect(PRODUCT_VOLUMES).toHaveLength(6);
    });

    it('contains strictly positive integers sorted in ascending order', () => {
      PRODUCT_VOLUMES.forEach((volume) => {
        expect(typeof volume).toBe('number');
        expect(volume).toBeGreaterThan(0);
        expect(Number.isInteger(volume)).toBe(true);
      });

      for (let i = 1; i < PRODUCT_VOLUMES.length; i++) {
        expect(PRODUCT_VOLUMES[i]).toBeGreaterThan(PRODUCT_VOLUMES[i - 1]);
      }
    });
  });

  describe('STORE_URL', () => {
    it('is a non-empty string that does not end with a trailing slash', () => {
      expect(typeof STORE_URL).toBe('string');
      expect(STORE_URL.length).toBeGreaterThan(0);
      expect(STORE_URL.endsWith('/')).toBe(false);
    });

    it('matches valid URL format starting with http or https', () => {
      expect(STORE_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('PAYMENT_METHODS', () => {
    it('defines all 4 accepted payment options with exact Vietnamese names', () => {
      expect(PAYMENT_METHODS).toEqual([
        { id: 'COD', name: 'Thanh toán khi nhận hàng (COD)' },
        { id: 'BANK_TRANSFER', name: 'Chuyển khoản ngân hàng' },
        { id: 'MOMO', name: 'Ví MoMo' },
        { id: 'ZALOPAY', name: 'ZaloPay' },
      ]);
      expect(PAYMENT_METHODS).toHaveLength(4);
    });

    it('contains unique IDs and valid display names', () => {
      const ids = PAYMENT_METHODS.map((method) => method.id);
      const idSet = new Set(ids);
      expect(idSet.size).toBe(PAYMENT_METHODS.length);

      PAYMENT_METHODS.forEach((method) => {
        expect(typeof method.id).toBe('string');
        expect(typeof method.name).toBe('string');
        expect(method.name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('SHIPPING_METHODS', () => {
    it('defines Standard and Express shipping methods with exact fees and turnaround times', () => {
      expect(SHIPPING_METHODS).toEqual([
        {
          id: 'STANDARD',
          name: 'Giao hàng tiêu chuẩn',
          price: 30000,
          days: '3-5 ngày',
        },
        {
          id: 'EXPRESS',
          name: 'Giao hàng nhanh',
          price: 50000,
          days: '1-2 ngày',
        },
      ]);
      expect(SHIPPING_METHODS).toHaveLength(2);
    });

    it('assigns positive prices and ensures Express is faster and higher priced than Standard', () => {
      const standard = SHIPPING_METHODS.find((m) => m.id === 'STANDARD');
      const express = SHIPPING_METHODS.find((m) => m.id === 'EXPRESS');

      expect(standard).toBeDefined();
      expect(express).toBeDefined();
      expect(standard!.price).toBe(30000);
      expect(express!.price).toBe(50000);
      expect(express!.price).toBeGreaterThan(standard!.price);
    });
  });

  describe('PRODUCT_SORT_OPTIONS', () => {
    it('defines all 5 sorting options with exact Vietnamese labels', () => {
      expect(PRODUCT_SORT_OPTIONS).toEqual([
        { value: 'newest', label: 'Mới nhất' },
        { value: 'price_asc', label: 'Giá: Thấp đến cao' },
        { value: 'price_desc', label: 'Giá: Cao đến thấp' },
        { value: 'best_selling', label: 'Bán chạy nhất' },
        { value: 'rating', label: 'Đánh giá cao nhất' },
      ]);
      expect(PRODUCT_SORT_OPTIONS).toHaveLength(5);
    });

    it('has unique values and non-empty labels', () => {
      const values = PRODUCT_SORT_OPTIONS.map((opt) => opt.value);
      const valueSet = new Set(values);
      expect(valueSet.size).toBe(PRODUCT_SORT_OPTIONS.length);

      PRODUCT_SORT_OPTIONS.forEach((opt) => {
        expect(typeof opt.value).toBe('string');
        expect(typeof opt.label).toBe('string');
        expect(opt.label.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('PAGINATION', () => {
    it('defines default page number and item limits', () => {
      expect(PAGINATION).toEqual({
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 12,
        ADMIN_LIMIT: 20,
      });
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(12);
      expect(PAGINATION.ADMIN_LIMIT).toBe(20);
    });

    it('uses positive integers for pagination values', () => {
      Object.values(PAGINATION).forEach((val) => {
        expect(typeof val).toBe('number');
        expect(val).toBeGreaterThan(0);
        expect(Number.isInteger(val)).toBe(true);
      });
    });
  });

  describe('QUERY_KEYS', () => {
    it('defines all query keys for React Query cache management', () => {
      expect(QUERY_KEYS).toEqual({
        PRODUCTS: 'products',
        PRODUCT_DETAIL: 'product-detail',
        CATEGORIES: 'categories',
        CART: 'cart',
        ORDERS: 'orders',
        ORDER_DETAIL: 'order-detail',
        REVIEWS: 'reviews',
        USER: 'user',
        ADMIN_PRODUCTS: 'admin-products',
        ADMIN_ORDERS: 'admin-orders',
        ADMIN_COUPONS: 'admin-coupons',
        ADMIN_STATS: 'admin-stats',
      });
    });

    it('ensures all query keys are unique non-empty strings', () => {
      const keys = Object.keys(QUERY_KEYS);
      const values = Object.values(QUERY_KEYS);
      expect(keys).toHaveLength(12);
      expect(new Set(values).size).toBe(12);

      values.forEach((val) => {
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
