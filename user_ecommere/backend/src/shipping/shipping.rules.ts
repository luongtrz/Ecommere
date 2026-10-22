export const FREE_SHIPPING_KEYWORDS = [
  'bangkok',
  'กรุงเทพ',
  'nonthaburi',
  'นนทบุรี',
] as const;

export const STANDARD_SHIPPING_FEE = 30000;
export const EXPRESS_SHIPPING_FEE = 50000;
export const FREE_SHIPPING_FEE = 0;

export interface ShippingFeeOptions {
  province?: string | null;
  method?: string | null;
  weight?: number | null;
}

export function isFreeShippingProvince(province?: string | null): boolean {
  if (typeof province !== 'string') {
    return false;
  }
  const lower = province.toLowerCase();
  return FREE_SHIPPING_KEYWORDS.some((kw) => lower.includes(kw));
}

function isOptionsObject(
  value: string | null | undefined | ShippingFeeOptions,
): value is ShippingFeeOptions {
  return value !== null && typeof value === 'object';
}

export function calculateShippingFee(options: ShippingFeeOptions): number;
export function calculateShippingFee(
  province?: string | null,
  method?: string | null,
  weight?: number | null,
): number;
export function calculateShippingFee(
  provinceOrOptions?: string | null | ShippingFeeOptions,
  method?: string | null,
  _weight?: number | null,
): number {
  const options: ShippingFeeOptions = isOptionsObject(provinceOrOptions)
    ? provinceOrOptions
    : { province: provinceOrOptions, method };
  const { province, method: shippingMethod } = options;

  if (isFreeShippingProvince(province)) {
    return FREE_SHIPPING_FEE;
  }

  const isExpress =
    typeof shippingMethod === 'string' &&
    shippingMethod.trim().toUpperCase() === 'EXPRESS';

  return isExpress ? EXPRESS_SHIPPING_FEE : STANDARD_SHIPPING_FEE;
}
