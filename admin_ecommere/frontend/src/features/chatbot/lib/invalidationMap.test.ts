import { describe, expect, it } from 'vitest';
import { TOOL_KEYS_MAP, keysForTool } from './invalidationMap';

describe('invalidationMap', () => {
  describe('TOOL_KEYS_MAP', () => {
    it('defines query keys for mutating order tools', () => {
      expect(TOOL_KEYS_MAP.update_order_status).toEqual([
        ['admin', 'orders'],
        ['admin', 'dashboard-stats'],
      ]);
    });

    it('defines query keys for mutating product and variant tools', () => {
      const expectedProductKeys = [
        ['products'],
        ['admin-products'],
        ['product-detail'],
      ];

      expect(TOOL_KEYS_MAP.create_product).toEqual(expectedProductKeys);
      expect(TOOL_KEYS_MAP.update_product).toEqual(expectedProductKeys);
      expect(TOOL_KEYS_MAP.delete_product).toEqual(expectedProductKeys);
      expect(TOOL_KEYS_MAP.create_variant).toEqual(expectedProductKeys);
      expect(TOOL_KEYS_MAP.update_variant).toEqual(expectedProductKeys);
      expect(TOOL_KEYS_MAP.delete_variant).toEqual(expectedProductKeys);
    });

    it('defines query keys for stock mutation tools', () => {
      const expectedStockKeys = [
        ['products'],
        ['admin-products'],
        ['product-detail'],
      ];

      expect(TOOL_KEYS_MAP.stock_add).toEqual(expectedStockKeys);
      expect(TOOL_KEYS_MAP.stock_remove).toEqual(expectedStockKeys);
      expect(TOOL_KEYS_MAP.stock_set).toEqual(expectedStockKeys);
    });

    it('defines query keys for category mutation tools', () => {
      const expectedCategoryKeys = [['categories']];

      expect(TOOL_KEYS_MAP.create_category).toEqual(expectedCategoryKeys);
      expect(TOOL_KEYS_MAP.update_category).toEqual(expectedCategoryKeys);
      expect(TOOL_KEYS_MAP.delete_category).toEqual(expectedCategoryKeys);
    });

    it('defines query keys for referral configuration tool', () => {
      expect(TOOL_KEYS_MAP.update_referral_config).toEqual([
        ['admin-referral-config'],
        ['admin-referral-stats'],
      ]);
    });

    it('defines empty keys for coupon tools without frontend cache', () => {
      expect(TOOL_KEYS_MAP.create_coupon).toEqual([]);
      expect(TOOL_KEYS_MAP.update_coupon).toEqual([]);
      expect(TOOL_KEYS_MAP.delete_coupon).toEqual([]);
      expect(TOOL_KEYS_MAP.list_coupons).toEqual([]);
      expect(TOOL_KEYS_MAP.get_coupon).toEqual([]);
    });

    it('defines empty keys for review and image tools without frontend cache', () => {
      expect(TOOL_KEYS_MAP.delete_review).toEqual([]);
      expect(TOOL_KEYS_MAP.get_product_reviews).toEqual([]);
      expect(TOOL_KEYS_MAP.get_review_stats).toEqual([]);
      expect(TOOL_KEYS_MAP.list_reviews).toEqual([]);
      expect(TOOL_KEYS_MAP.delete_image).toEqual([]);
    });

    it('defines empty keys for read-only reporting and dashboard tools', () => {
      expect(TOOL_KEYS_MAP.get_dashboard_stats).toEqual([]);
      expect(TOOL_KEYS_MAP.get_sales_report).toEqual([]);
      expect(TOOL_KEYS_MAP.get_top_products).toEqual([]);
    });

    it('defines empty keys for read-only order, product, category and stock tools', () => {
      expect(TOOL_KEYS_MAP.list_orders).toEqual([]);
      expect(TOOL_KEYS_MAP.get_order).toEqual([]);
      expect(TOOL_KEYS_MAP.list_products).toEqual([]);
      expect(TOOL_KEYS_MAP.get_product).toEqual([]);
      expect(TOOL_KEYS_MAP.list_categories).toEqual([]);
      expect(TOOL_KEYS_MAP.get_stock_levels).toEqual([]);
      expect(TOOL_KEYS_MAP.get_low_stock).toEqual([]);
      expect(TOOL_KEYS_MAP.get_stock_history).toEqual([]);
    });

    it('defines empty keys for read-only referral, customer and UI navigation tools', () => {
      expect(TOOL_KEYS_MAP.get_referral_config).toEqual([]);
      expect(TOOL_KEYS_MAP.get_referral_stats).toEqual([]);
      expect(TOOL_KEYS_MAP.list_referrals).toEqual([]);
      expect(TOOL_KEYS_MAP.list_customers).toEqual([]);
      expect(TOOL_KEYS_MAP.get_customer).toEqual([]);
      expect(TOOL_KEYS_MAP.navigate_to).toEqual([]);
    });
  });

  describe('keysForTool', () => {
    it('returns corresponding query keys for every tool configured in TOOL_KEYS_MAP', () => {
      const toolNames = Object.keys(TOOL_KEYS_MAP);
      expect(toolNames.length).toBeGreaterThan(0);

      for (const toolName of toolNames) {
        expect(keysForTool(toolName)).toEqual(TOOL_KEYS_MAP[toolName]);
      }
    });

    it('returns empty array when tool is unknown or unmapped', () => {
      expect(keysForTool('unknown_custom_tool')).toEqual([]);
      expect(keysForTool('some_unregistered_action')).toEqual([]);
      expect(keysForTool('')).toEqual([]);
    });
  });
});
