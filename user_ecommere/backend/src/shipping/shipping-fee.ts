import { ShippingMethod } from '@/orders/dtos/checkout.dto';

export { ShippingMethod };

export function isFreeShippingProvince(province?: string | null): boolean {
  if (!province) {
    return false;
  }
  const provinceLower = province.trim().toLowerCase();
  return (
    provinceLower.includes('bangkok') ||
    provinceLower.includes('กรุงเทพ') ||
    provinceLower.includes('nonthaburi') ||
    provinceLower.includes('นนทบุรี')
  );
}

export function getEstimatedDeliveryDays(province?: string | null): number {
  return isFreeShippingProvince(province) ? 1 : 3;
}

export function calculateShippingFee(
  provinceOrAddress?: string | { province?: string } | null,
  method: ShippingMethod | string = ShippingMethod.STANDARD,
): number {
  const province =
    typeof provinceOrAddress === 'string'
      ? provinceOrAddress
      : provinceOrAddress?.province;

  if (isFreeShippingProvince(province)) {
    return 0;
  }

  return method === ShippingMethod.EXPRESS ? 50000 : 30000;
}
