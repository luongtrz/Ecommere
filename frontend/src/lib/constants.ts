export const PRODUCT_SCENTS = [
  'Hoa Nhài',
  'Hoa Hồng',
  'Hoa Lavender',
  'Cam Chanh',
  'Dừa',
  'Bạc Hà',
  'Trà Xanh',
  'Hương Biển',
  'Hương Gỗ',
] as const;

export const PRODUCT_VOLUMES = [50, 100, 150, 200, 300, 500] as const;

export const ORDER_STATUS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
} as const;

export const PAYMENT_METHODS = [
  { id: 'COD', name: 'Thanh toán khi nhận hàng (COD)' },
  { id: 'BANK_TRANSFER', name: 'Chuyển khoản ngân hàng' },
  { id: 'MOMO', name: 'Ví MoMo' },
  { id: 'ZALOPAY', name: 'ZaloPay' },
] as const;

export const SHIPPING_METHODS = [
  { id: 'STANDARD', name: 'Giao hàng tiêu chuẩn', price: 30000, days: '3-5 ngày' },
  { id: 'EXPRESS', name: 'Giao hàng nhanh', price: 50000, days: '1-2 ngày' },
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp đến cao' },
  { value: 'price_desc', label: 'Giá: Cao đến thấp' },
  { value: 'best_selling', label: 'Bán chạy nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  ADMIN_LIMIT: 20,
} as const;

export const QUERY_KEYS = {
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
} as const;
