import { describe, expect, it } from 'vitest';
import { isCartTool, keysForTool } from './invalidationMap';

describe('invalidationMap', () => {
  describe('isCartTool', () => {
    it('returns true for cart_add_item', () => {
      expect(isCartTool('cart_add_item')).toBe(true);
    });

    it('returns true for cart_update_item', () => {
      expect(isCartTool('cart_update_item')).toBe(true);
    });

    it('returns true for cart_remove_item', () => {
      expect(isCartTool('cart_remove_item')).toBe(true);
    });

    it('returns true for cart_clear', () => {
      expect(isCartTool('cart_clear')).toBe(true);
    });

    it('returns false for non-cart tools', () => {
      expect(isCartTool('checkout')).toBe(false);
      expect(isCartTool('cancel_my_order')).toBe(false);
      expect(isCartTool('update_my_profile')).toBe(false);
      expect(isCartTool('create_address')).toBe(false);
      expect(isCartTool('update_address')).toBe(false);
      expect(isCartTool('delete_address')).toBe(false);
      expect(isCartTool('create_review')).toBe(false);
      expect(isCartTool('update_review')).toBe(false);
      expect(isCartTool('delete_review')).toBe(false);
      expect(isCartTool('get_referral_info')).toBe(false);
      expect(isCartTool('unknown_tool')).toBe(false);
      expect(isCartTool('')).toBe(false);
    });
  });

  describe('keysForTool', () => {
    it('returns orders, order-detail, and cart query keys for checkout', () => {
      expect(keysForTool('checkout')).toEqual([
        ['orders'],
        ['order-detail'],
        ['cart'],
      ]);
    });

    it('returns orders and order-detail query keys for cancel_my_order', () => {
      expect(keysForTool('cancel_my_order')).toEqual([
        ['orders'],
        ['order-detail'],
      ]);
    });

    it('returns user query key for update_my_profile', () => {
      expect(keysForTool('update_my_profile')).toEqual([['user']]);
    });

    it('returns addresses query key for create_address', () => {
      expect(keysForTool('create_address')).toEqual([['addresses']]);
    });

    it('returns addresses query key for update_address', () => {
      expect(keysForTool('update_address')).toEqual([['addresses']]);
    });

    it('returns addresses query key for delete_address', () => {
      expect(keysForTool('delete_address')).toEqual([['addresses']]);
    });

    it('returns product-detail and products query keys for create_review', () => {
      expect(keysForTool('create_review')).toEqual([
        ['product-detail'],
        ['products'],
      ]);
    });

    it('returns product-detail and products query keys for update_review', () => {
      expect(keysForTool('update_review')).toEqual([
        ['product-detail'],
        ['products'],
      ]);
    });

    it('returns product-detail and products query keys for delete_review', () => {
      expect(keysForTool('delete_review')).toEqual([
        ['product-detail'],
        ['products'],
      ]);
    });

    it('returns referral-info query key for get_referral_info', () => {
      expect(keysForTool('get_referral_info')).toEqual([['referral-info']]);
    });

    it('returns empty array for unknown or default tools', () => {
      expect(keysForTool('cart_add_item')).toEqual([]);
      expect(keysForTool('cart_update_item')).toEqual([]);
      expect(keysForTool('cart_remove_item')).toEqual([]);
      expect(keysForTool('cart_clear')).toEqual([]);
      expect(keysForTool('unknown_tool')).toEqual([]);
      expect(keysForTool('')).toEqual([]);
    });
  });
});
