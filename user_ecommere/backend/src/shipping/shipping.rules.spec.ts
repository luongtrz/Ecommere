import {
  calculateShippingFee,
  isFreeShippingProvince,
  STANDARD_SHIPPING_FEE,
  EXPRESS_SHIPPING_FEE,
  FREE_SHIPPING_FEE,
} from './shipping.rules';
import { ShippingService } from './shipping.service';

describe('shipping.rules and ShippingService', () => {
  const cases = [
    {
      name: 'Bangkok is free (STANDARD)',
      province: 'Bangkok',
      weight: 1,
      method: 'STANDARD',
      expectedFee: FREE_SHIPPING_FEE,
      expectedDays: 1,
    },
    {
      name: 'Bangkok is free (EXPRESS)',
      province: 'Bangkok',
      weight: 1,
      method: 'EXPRESS',
      expectedFee: FREE_SHIPPING_FEE,
      expectedDays: 1,
    },
    {
      name: 'Nonthaburi is free (STANDARD)',
      province: 'Nonthaburi',
      weight: 1,
      method: 'STANDARD',
      expectedFee: FREE_SHIPPING_FEE,
      expectedDays: 1,
    },
    {
      name: 'Nonthaburi is free (EXPRESS)',
      province: 'Nonthaburi',
      weight: 1,
      method: 'EXPRESS',
      expectedFee: FREE_SHIPPING_FEE,
      expectedDays: 1,
    },
    {
      name: 'Samut Prakan is not free (STANDARD)',
      province: 'Samut Prakan',
      weight: 1,
      method: 'STANDARD',
      expectedFee: STANDARD_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'Samut Prakan is not free (EXPRESS)',
      province: 'Samut Prakan',
      weight: 1,
      method: 'EXPRESS',
      expectedFee: EXPRESS_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'missing province is not free and does not throw exception (STANDARD)',
      province: undefined,
      weight: 1,
      method: 'STANDARD',
      expectedFee: STANDARD_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'missing province is not free and does not throw exception (EXPRESS)',
      province: undefined,
      weight: 1,
      method: 'EXPRESS',
      expectedFee: EXPRESS_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'standard shipping for non-free province (Chiang Mai)',
      province: 'Chiang Mai',
      weight: 1,
      method: 'STANDARD',
      expectedFee: STANDARD_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'express shipping for non-free province (Chiang Mai)',
      province: 'Chiang Mai',
      weight: 1,
      method: 'EXPRESS',
      expectedFee: EXPRESS_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'weight does not change fee (10kg STANDARD)',
      province: 'Chiang Mai',
      weight: 10,
      method: 'STANDARD',
      expectedFee: STANDARD_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'weight does not change fee (20kg EXPRESS)',
      province: 'Chiang Mai',
      weight: 20,
      method: 'EXPRESS',
      expectedFee: EXPRESS_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'weight does not change fee (Bangkok 10kg)',
      province: 'Bangkok',
      weight: 10,
      method: 'STANDARD',
      expectedFee: FREE_SHIPPING_FEE,
      expectedDays: 1,
    },
    {
      name: 'weight does not change fee (Samut Prakan 15kg STANDARD)',
      province: 'Samut Prakan',
      weight: 15,
      method: 'STANDARD',
      expectedFee: STANDARD_SHIPPING_FEE,
      expectedDays: 3,
    },
    {
      name: 'weight does not change fee (Samut Prakan 15kg EXPRESS)',
      province: 'Samut Prakan',
      weight: 15,
      method: 'EXPRESS',
      expectedFee: EXPRESS_SHIPPING_FEE,
      expectedDays: 3,
    },
  ];

  test.each(cases)(
    '$name ($province, weight: $weight, method: $method) -> fee: $expectedFee',
    async ({ province, weight, method, expectedFee, expectedDays }) => {
      const pureFee = calculateShippingFee({ province, method, weight });
      expect(pureFee).toBe(expectedFee);

      const positionalFee = calculateShippingFee(province, method, weight);
      expect(positionalFee).toBe(expectedFee);

      const service = new ShippingService();
      const mockOrigin = {
        province: 'Bangkok',
        district: 'Chatuchak',
        ward: 'Lat Yao',
        line1: '123 Warehouse St.',
      };
      const destination = {
        province: province ?? '',
        district: 'Unknown',
        ward: 'Unknown',
        line1: 'Customer address',
      };
      const quote = await service.calculateFee(mockOrigin, destination, weight, method);
      expect(quote.fee).toBe(expectedFee);
      expect(quote.estimatedDays).toBe(expectedDays);
      expect(quote.currency).toBe('VND');
    },
  );

  it('correctly identifies free shipping provinces only for Bangkok and Nonthaburi', () => {
    expect(isFreeShippingProvince('Bangkok')).toBe(true);
    expect(isFreeShippingProvince('กรุงเทพมหานคร')).toBe(true);
    expect(isFreeShippingProvince('Nonthaburi')).toBe(true);
    expect(isFreeShippingProvince('นนทบุรี')).toBe(true);

    expect(isFreeShippingProvince('Samut Prakan')).toBe(false);
    expect(isFreeShippingProvince('สมุทรปราการ')).toBe(false);
    expect(isFreeShippingProvince('Chiang Mai')).toBe(false);
    expect(isFreeShippingProvince(undefined)).toBe(false);
    expect(isFreeShippingProvince(null)).toBe(false);
    expect(isFreeShippingProvince('')).toBe(false);
  });
});
