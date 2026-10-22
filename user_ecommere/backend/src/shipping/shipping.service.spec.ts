import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import {
  Address,
  ShipmentDetails,
} from './interfaces/shipping-provider.interface';
import {
  STANDARD_SHIPPING_FEE,
  EXPRESS_SHIPPING_FEE,
  FREE_SHIPPING_FEE,
} from './shipping.rules';

describe('ShippingService', () => {
  let service: ShippingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShippingService],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getName', () => {
    it('should return the provider name', () => {
      const name = service.getName();
      expect(name).toBe('Mock Shipping Service');
    });
  });

  describe('calculateFee', () => {
    const defaultOrigin: Address = {
      province: 'Bangkok',
      district: 'Chatuchak',
      ward: 'Lat Yao',
      line1: '123 Main Warehouse',
    };

    it('should default method to STANDARD when method is omitted or undefined', async () => {
      const destination: Address = {
        province: 'Chiang Mai',
        district: 'Muang',
        ward: 'Haiya',
        line1: '456 Northern St',
      };

      const result = await service.calculateFee(defaultOrigin, destination, 2);

      expect(result).toEqual({
        fee: STANDARD_SHIPPING_FEE,
        estimatedDays: 3,
        currency: 'VND',
      });
    });

    it('should default method to STANDARD when method is empty string (falsy)', async () => {
      const destination: Address = {
        province: 'Chiang Mai',
        district: 'Muang',
        ward: 'Haiya',
        line1: '456 Northern St',
      };

      const result = await service.calculateFee(
        defaultOrigin,
        destination,
        2,
        '',
      );

      expect(result).toEqual({
        fee: STANDARD_SHIPPING_FEE,
        estimatedDays: 3,
        currency: 'VND',
      });
    });

    it('should calculate free fee and 1 estimated day for free shipping province (Bangkok)', async () => {
      const destination: Address = {
        province: 'Bangkok',
        district: 'Pathum Wan',
        ward: 'Lumphini',
        line1: '789 Central Ave',
      };

      const result = await service.calculateFee(
        defaultOrigin,
        destination,
        1,
        'STANDARD',
      );

      expect(result).toEqual({
        fee: FREE_SHIPPING_FEE,
        estimatedDays: 1,
        currency: 'VND',
      });
    });

    it('should calculate free fee and 1 estimated day for free shipping province (Nonthaburi) with EXPRESS', async () => {
      const destination: Address = {
        province: 'Nonthaburi',
        district: 'Muang Nonthaburi',
        ward: 'Bang Kraso',
        line1: '12 Rattanathibet Rd',
      };

      const result = await service.calculateFee(
        defaultOrigin,
        destination,
        1.5,
        'EXPRESS',
      );

      expect(result).toEqual({
        fee: FREE_SHIPPING_FEE,
        estimatedDays: 1,
        currency: 'VND',
      });
    });

    it('should calculate express fee and 3 estimated days for non-free shipping province', async () => {
      const destination: Address = {
        province: 'Phuket',
        district: 'Mueang Phuket',
        ward: 'Talat Yai',
        line1: '55 Beach Rd',
      };

      const result = await service.calculateFee(
        defaultOrigin,
        destination,
        3,
        'EXPRESS',
      );

      expect(result).toEqual({
        fee: EXPRESS_SHIPPING_FEE,
        estimatedDays: 3,
        currency: 'VND',
      });
    });

    it('should calculate standard fee and 3 estimated days when destination is undefined', async () => {
      const result = await service.calculateFee(
        defaultOrigin,
        undefined as unknown as Address,
        1,
      );

      expect(result).toEqual({
        fee: STANDARD_SHIPPING_FEE,
        estimatedDays: 3,
        currency: 'VND',
      });
    });

    it('should calculate standard fee and 3 estimated days when destination has no province', async () => {
      const destinationWithoutProvince = {
        district: 'Unknown',
        ward: 'Unknown',
        line1: 'Somewhere',
      } as unknown as Address;

      const result = await service.calculateFee(
        defaultOrigin,
        destinationWithoutProvince,
        1,
      );

      expect(result).toEqual({
        fee: STANDARD_SHIPPING_FEE,
        estimatedDays: 3,
        currency: 'VND',
      });
    });
  });

  describe('createShipment', () => {
    const mockDetails: ShipmentDetails = {
      sender: {
        name: 'Warehouse Bangkok',
        phone: '021234567',
        province: 'Bangkok',
        district: 'Chatuchak',
        ward: 'Lat Yao',
        line1: '123 Warehouse Rd',
      },
      recipient: {
        name: 'Somchai Jaidee',
        phone: '0812345678',
        province: 'Chiang Mai',
        district: 'Muang',
        ward: 'Haiya',
        line1: '456 Lanna St',
      },
      weight: 1.2,
      dimensions: {
        length: 20,
        width: 15,
        height: 10,
      },
      cod: 0,
    };

    it('should create shipment and return success, tracking number, estimated delivery date and message', async () => {
      const beforeTime = Date.now();
      const orderId = 'order-abc-123';

      const result = await service.createShipment(orderId, mockDetails);
      const afterTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.trackingNumber).toMatch(/^THAI\d{8}$/);
      expect(result.estimatedDelivery).toBeInstanceOf(Date);

      // Verify estimated delivery is ~3 days in the future
      const estimatedTime = result.estimatedDelivery.getTime();
      const expectedMinTime = beforeTime + 3 * 24 * 60 * 60 * 1000 - 5000;
      const expectedMaxTime = afterTime + 3 * 24 * 60 * 60 * 1000 + 5000;
      expect(estimatedTime).toBeGreaterThanOrEqual(expectedMinTime);
      expect(estimatedTime).toBeLessThanOrEqual(expectedMaxTime);

      expect(result.message).toBe(
        `Mock shipment created for order ${orderId}. In production, this would integrate with Thailand Post, Kerry, Flash Express, etc.`,
      );
    });
  });

  describe('trackShipment', () => {
    it('should return tracking information with 3 sequential status events', async () => {
      const trackingNumber = 'THAI98765432';

      const result = await service.trackShipment(trackingNumber);

      expect(result).toBeDefined();
      expect(result.trackingNumber).toBe(trackingNumber);
      expect(result.status).toBe('In Transit');
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events).toHaveLength(3);

      expect(result.events[0]).toEqual({
        timestamp: expect.any(Date),
        location: 'Bangkok Sorting Center',
        status: 'Picked Up',
        description: 'Package picked up from sender',
      });

      expect(result.events[1]).toEqual({
        timestamp: expect.any(Date),
        location: 'Regional Hub',
        status: 'In Transit',
        description: 'Package in transit to destination',
      });

      expect(result.events[2]).toEqual({
        timestamp: expect.any(Date),
        location: 'Local Distribution Center',
        status: 'Out for Delivery',
        description: 'Package is out for delivery',
      });

      // Events should be chronological: event[0] < event[1] < event[2]
      expect(result.events[0].timestamp.getTime()).toBeLessThan(
        result.events[1].timestamp.getTime(),
      );
      expect(result.events[1].timestamp.getTime()).toBeLessThan(
        result.events[2].timestamp.getTime(),
      );
    });
  });
});
