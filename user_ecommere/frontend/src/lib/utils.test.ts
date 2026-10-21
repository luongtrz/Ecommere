import { describe, expect, it, afterEach, vi } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  slugify,
  truncate,
  getImageUrl,
  formatCurrency,
} from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('joins class names and drops falsy values', () => {
      expect(cn('px-2', false, undefined, null, 0, '', 'py-1')).toBe(
        'px-2 py-1',
      );
    });

    it('keeps the last conflicting Tailwind class', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles conditional class objects and nested arrays', () => {
      expect(
        cn('font-bold', { 'text-green-500': true, 'text-red-500': false }, [
          'p-4',
          ['m-2'],
        ]),
      ).toBe('font-bold text-green-500 p-4 m-2');
    });

    it('returns empty string when no arguments or only falsy values are passed', () => {
      expect(cn()).toBe('');
      expect(cn(false, null, undefined, '')).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats a Date object to Vietnamese date format', () => {
      const date = new Date('2026-03-15T00:00:00.000Z');
      const expected = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);

      expect(formatDate(date)).toBe(expected);
      expect(formatDate(date)).toContain('2026');
      expect(formatDate(date)).toContain('tháng 3');
    });

    it('formats an ISO date string to Vietnamese date format', () => {
      const dateStr = '2026-11-20T12:00:00.000Z';
      const expected = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateStr));

      expect(formatDate(dateStr)).toBe(expected);
      expect(formatDate(dateStr)).toContain('2026');
      expect(formatDate(dateStr)).toContain('tháng 11');
    });

    it('formats start of year and end of year dates correctly', () => {
      expect(formatDate('2026-01-01')).toContain('2026');
      expect(formatDate('2026-12-31')).toContain('2026');
    });
  });

  describe('formatDateTime', () => {
    it('formats a Date object including time to Vietnamese format', () => {
      const date = new Date('2026-03-15T14:30:00');
      const expected = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);

      expect(formatDateTime(date)).toBe(expected);
      expect(formatDateTime(date)).toContain('14:30');
      expect(formatDateTime(date)).toContain('2026');
    });

    it('formats an ISO date string including time to Vietnamese format', () => {
      const dateStr = '2026-08-05T09:15:00';
      const expected = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));

      expect(formatDateTime(dateStr)).toBe(expected);
      expect(formatDateTime(dateStr)).toContain('09:15');
      expect(formatDateTime(dateStr)).toContain('2026');
    });
  });

  describe('slugify', () => {
    it('converts Vietnamese text with accents and tones to ASCII slug', () => {
      expect(slugify('Chai Xịt Thơm Phòng Cao Cấp')).toBe(
        'chai-xit-thom-phong-cao-cap',
      );
    });

    it('handles both lowercase "đ" and uppercase "Đ"', () => {
      expect(slugify('Đặc Điểm & Độc Đáo')).toBe('dac-diem-doc-dao');
      expect(slugify('đơn hàng đã đặt')).toBe('don-hang-da-dat');
    });

    it('removes special characters and symbols', () => {
      expect(slugify('Xịt Thái Lan #1 (Giá rẻ nhất!) @2026')).toBe(
        'xit-thai-lan-1-gia-re-nhat-2026',
      );
    });

    it('normalizes multiple spaces and dashes into single dash', () => {
      expect(slugify('   nhiều    khoảng    trắng   ')).toBe(
        'nhieu-khoang-trang',
      );
      expect(slugify('a---b--c-d')).toBe('a-b-c-d');
    });

    it('trims leading and trailing spaces and handles dashes', () => {
      expect(slugify('   san pham   ')).toBe('san-pham');
      expect(slugify('  -san pham-  ')).toBe('-san-pham-');
    });

    it('handles alphanumeric strings already formatted', () => {
      expect(slugify('thai-spray-200ml')).toBe('thai-spray-200ml');
    });
  });

  describe('truncate', () => {
    it('returns the original text when text length is strictly less than limit', () => {
      expect(truncate('Ngắn', 10)).toBe('Ngắn');
    });

    it('returns the original text when text length equals limit', () => {
      expect(truncate('Vừa vặn', 7)).toBe('Vừa vặn');
    });

    it('truncates and appends ellipsis when text length exceeds limit', () => {
      expect(truncate('Chai xịt thơm phòng Thái Lan chất lượng cao', 12)).toBe(
        'Chai xịt thơ...',
      );
    });

    it('handles empty string without error', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('handles limit of 0', () => {
      expect(truncate('Thái Lan', 0)).toBe('...');
    });
  });

  describe('getImageUrl', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('returns the default fallback unsplash image when path is falsy (undefined, null, empty string)', () => {
      const fallback =
        'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop';
      expect(getImageUrl(undefined)).toBe(fallback);
      expect(getImageUrl(null)).toBe(fallback);
      expect(getImageUrl('')).toBe(fallback);
    });

    it('applies cloudinary transformations when path includes res.cloudinary.com and width is specified', () => {
      const cloudPath =
        'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const transformed = getImageUrl(cloudPath, { width: 300, quality: 80 });
      expect(transformed).toBe(
        'https://res.cloudinary.com/demo/image/upload/w_300,q_80,f_auto/sample.jpg',
      );
    });

    it('defaults quality to "auto" when quality is not specified or falsy for cloudinary images', () => {
      const cloudPath =
        'https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg';
      const transformed = getImageUrl(cloudPath, { width: 500 });
      expect(transformed).toBe(
        'https://res.cloudinary.com/demo/image/upload/w_500,q_auto,f_auto/v1234/sample.jpg',
      );

      const transformedWithZero = getImageUrl(cloudPath, {
        width: 400,
        quality: 0,
      });
      expect(transformedWithZero).toBe(
        'https://res.cloudinary.com/demo/image/upload/w_400,q_auto,f_auto/v1234/sample.jpg',
      );
    });

    it('returns original cloudinary path if options or options.width are omitted', () => {
      const cloudPath =
        'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      expect(getImageUrl(cloudPath)).toBe(cloudPath);
      expect(getImageUrl(cloudPath, { quality: 90 })).toBe(cloudPath);
    });

    it('returns full external http and https urls as-is', () => {
      expect(getImageUrl('https://example.com/images/spray.png')).toBe(
        'https://example.com/images/spray.png',
      );
      expect(getImageUrl('http://insecure-domain.org/photo.jpg')).toBe(
        'http://insecure-domain.org/photo.jpg',
      );
    });

    it('prepends VITE_API_BASE_URL to relative paths when env variable is defined', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.thaisprayshop.vn');
      expect(getImageUrl('/uploads/product-1.jpg')).toBe(
        'https://api.thaisprayshop.vn/uploads/product-1.jpg',
      );
    });

    it('falls back to window.location.origin when VITE_API_BASE_URL is not defined', () => {
      vi.stubEnv('VITE_API_BASE_URL', '');
      expect(getImageUrl('/assets/images/logo.png')).toBe(
        `${window.location.origin}/assets/images/logo.png`,
      );
    });
  });

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
  });
});
