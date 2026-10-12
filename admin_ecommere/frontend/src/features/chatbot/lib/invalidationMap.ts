import type { QueryKey } from '@tanstack/react-query';

/**
 * Admin Tool Invalidation Map
 *
 * Full list of admin tools grouped according to approved plan (section 5.2):
 *
 * 1. Orders (Đơn):
 *    - update_order_status (mutating) -> [['admin', 'orders']]
 *    - list_orders (read-only) -> []
 *    - get_order (read-only) -> []
 *
 * 2. Products (Sản phẩm):
 *    - create_product (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - update_product (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - delete_product (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - create_variant (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - update_variant (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - delete_variant (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - list_products (read-only) -> []
 *    - get_product (read-only) -> []
 *
 * 3. Inventory / Stock (Tồn kho):
 *    - stock_add (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - stock_remove (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - stock_set (mutating) -> [['products'], ['admin-products'], ['product-detail']]
 *    - get_stock_levels (read-only) -> []
 *    - get_low_stock (read-only) -> []
 *    - get_stock_history (read-only) -> []
 *
 * 4. Categories (Danh mục):
 *    - create_category (mutating) -> [['categories']]
 *    - update_category (mutating) -> [['categories']]
 *    - delete_category (mutating) -> [['categories']]
 *    - list_categories (read-only) -> []
 *
 * 5. Coupons (Mã giảm giá):
 *    - create_coupon (mutating) -> [['admin-referral-list']]
 *    - update_coupon (mutating) -> [['admin-referral-list']]
 *    - delete_coupon (mutating) -> [['admin-referral-list']]
 *    - list_coupons (read-only) -> []
 *    - get_coupon (read-only) -> []
 *
 * 6. Referral:
 *    - update_referral_config (mutating) -> [['admin-referral-config'], ['admin-referral-stats']]
 *    - get_referral_config (read-only) -> []
 *    - get_referral_stats (read-only) -> []
 *    - list_referrals (read-only) -> []
 *
 * 7. Reviews:
 *    - delete_review (mutating) -> [['product-detail']]
 *    - get_product_reviews (read-only) -> []
 *    - get_review_stats (read-only) -> []
 *    - list_reviews (read-only) -> []
 *
 * 8. Images (Ảnh):
 *    - delete_image (mutating, no frontend query cache) -> []
 *
 * 9. Reports / Dashboard (Báo cáo):
 *    - get_dashboard_stats (read-only) -> []
 *    - get_sales_report (read-only) -> []
 *    - get_top_products (read-only) -> []
 *
 * 10. Customers (Khách):
 *     - list_customers (read-only) -> []
 *     - get_customer (read-only) -> []
 *
 * 11. Navigation / UI (Điều hướng):
 *     - navigate_to (read-only / UI action) -> []
 */

const PRODUCT_KEYS: QueryKey[] = [
  ['products'],
  ['admin-products'],
  ['product-detail'],
];

const ORDER_KEYS: QueryKey[] = [
  ['admin', 'orders'],
];

const CATEGORY_KEYS: QueryKey[] = [
  ['categories'],
];

const COUPON_KEYS: QueryKey[] = [
  ['admin-referral-list'],
];

const REFERRAL_CONFIG_KEYS: QueryKey[] = [
  ['admin-referral-config'],
  ['admin-referral-stats'],
];

const REVIEW_KEYS: QueryKey[] = [
  ['product-detail'],
];

const EMPTY_KEYS: QueryKey[] = [];

export const TOOL_KEYS_MAP: Record<string, QueryKey[]> = {
  // Orders
  update_order_status: ORDER_KEYS,

  // Products
  create_product: PRODUCT_KEYS,
  update_product: PRODUCT_KEYS,
  delete_product: PRODUCT_KEYS,
  create_variant: PRODUCT_KEYS,
  update_variant: PRODUCT_KEYS,
  delete_variant: PRODUCT_KEYS,

  // Inventory / Stock
  stock_add: PRODUCT_KEYS,
  stock_remove: PRODUCT_KEYS,
  stock_set: PRODUCT_KEYS,

  // Categories
  create_category: CATEGORY_KEYS,
  update_category: CATEGORY_KEYS,
  delete_category: CATEGORY_KEYS,

  // Coupons
  create_coupon: COUPON_KEYS,
  update_coupon: COUPON_KEYS,
  delete_coupon: COUPON_KEYS,

  // Referral
  update_referral_config: REFERRAL_CONFIG_KEYS,

  // Reviews
  delete_review: REVIEW_KEYS,

  // Images
  delete_image: EMPTY_KEYS,

  // Read-only: Reports / Dashboard
  get_dashboard_stats: EMPTY_KEYS,
  get_sales_report: EMPTY_KEYS,
  get_top_products: EMPTY_KEYS,

  // Read-only: Orders
  list_orders: EMPTY_KEYS,
  get_order: EMPTY_KEYS,

  // Read-only: Products
  list_products: EMPTY_KEYS,
  get_product: EMPTY_KEYS,

  // Read-only: Categories
  list_categories: EMPTY_KEYS,

  // Read-only: Coupons
  list_coupons: EMPTY_KEYS,
  get_coupon: EMPTY_KEYS,

  // Read-only: Inventory
  get_stock_levels: EMPTY_KEYS,
  get_low_stock: EMPTY_KEYS,
  get_stock_history: EMPTY_KEYS,

  // Read-only: Reviews
  get_product_reviews: EMPTY_KEYS,
  get_review_stats: EMPTY_KEYS,
  list_reviews: EMPTY_KEYS,

  // Read-only: Referral
  get_referral_config: EMPTY_KEYS,
  get_referral_stats: EMPTY_KEYS,
  list_referrals: EMPTY_KEYS,

  // Read-only: Customers
  list_customers: EMPTY_KEYS,
  get_customer: EMPTY_KEYS,

  // UI / Navigation
  navigate_to: EMPTY_KEYS,
};

/**
 * Returns TanStack Query keys to invalidate after an admin tool executes.
 *
 * @param toolName The name of the tool executed by the admin agent.
 * @returns An array of QueryKey prefixes to invalidate, or an empty array if none.
 */
export function keysForTool(toolName: string): QueryKey[] {
  return TOOL_KEYS_MAP[toolName] ?? [];
}
