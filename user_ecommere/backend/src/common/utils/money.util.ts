export class MoneyUtil {
  /**
   * Format money to VND currency string
   * @param amount Amount in VND (integer)
   * @returns Formatted string like "120,000đ"
   */
  static format(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Calculate percentage discount
   * @param original Original price
   * @param sale Sale price
   * @returns Discount percentage (0-100)
   */
  static calculateDiscountPercent(original: number, sale: number): number {
    if (original <= 0) return 0;
    return Math.round(((original - sale) / original) * 100);
  }

  /**
   * Apply percentage discount
   * @param amount Original amount
   * @param percent Discount percent (0-100)
   * @returns Discounted amount
   */
  static applyPercent(amount: number, percent: number): number {
    return Math.round(amount * (1 - percent / 100));
  }

  /**
   * Calculate total with tax
   * @param subtotal Subtotal amount
   * @param taxPercent Tax percentage (default 0 for Vietnam)
   * @returns Total with tax
   */
  static calculateTotal(subtotal: number, taxPercent: number = 0): number {
    return Math.round(subtotal * (1 + taxPercent / 100));
  }

  /**
   * Calculate discount amount based on coupon type
   * @param orderTotal Order total amount
   * @param couponType Type of coupon (PERCENT, FIXED, FREESHIP)
   * @param couponValue Value of coupon
   * @param maxDiscount Maximum discount (for PERCENT type)
   * @returns Discount amount
   */
  static calculateDiscount(
    orderTotal: number,
    couponType: 'PERCENT' | 'FIXED' | 'FREESHIP',
    couponValue: number,
    maxDiscount?: number | null,
  ): number {
    if (couponType === 'PERCENT') {
      const discount = Math.round((orderTotal * couponValue) / 100);
      if (maxDiscount && discount > maxDiscount) {
        return maxDiscount;
      }
      return discount;
    } else if (couponType === 'FIXED') {
      return Math.min(couponValue, orderTotal);
    } else if (couponType === 'FREESHIP') {
      return couponValue;
    }
    return 0;
  }
}
