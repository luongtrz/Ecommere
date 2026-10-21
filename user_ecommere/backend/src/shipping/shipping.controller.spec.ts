import { Test, TestingModule } from '@nestjs/testing';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';

describe('ShippingController', () => {
  let controller: ShippingController;
  let mockShippingService: {
    calculateFee: jest.Mock;
    trackShipment: jest.Mock;
  };

  const mockCanActivate = jest.fn(() => true);

  beforeEach(async () => {
    mockShippingService = {
      calculateFee: jest.fn(),
      trackShipment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: mockCanActivate })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: mockCanActivate })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: mockCanActivate })
      .compile();

    controller = module.get<ShippingController>(ShippingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Route Guards', () => {
    it('route guards are overridden with a canActivate stub returning true', () => {
      expect(mockCanActivate()).toBe(true);
    });
  });

  describe('Route 1: GET /shipping/calculate-fee - calculateFee', () => {
    const expectedMockOrigin = {
      province: 'Bangkok',
      district: 'Chatuchak',
      ward: 'Lat Yao',
      line1: '123 Warehouse St.',
    };

    it('delegates to shippingService.calculateFee with provided province and weight, returning service result', async () => {
      const mockFeeResult = {
        fee: 30000,
        estimatedDays: 3,
        currency: 'VND',
      };
      mockShippingService.calculateFee.mockResolvedValue(mockFeeResult);

      const result = await controller.calculateFee('Chiang Mai', 2.5);

      expect(mockShippingService.calculateFee).toHaveBeenCalledTimes(1);
      expect(mockShippingService.calculateFee).toHaveBeenCalledWith(
        expectedMockOrigin,
        {
          province: 'Chiang Mai',
          district: 'Unknown',
          ward: 'Unknown',
          line1: 'Customer address',
        },
        2.5,
      );
      expect(result).toEqual(mockFeeResult);
    });

    it('defaults province to Bangkok and weight to 1 when neither is provided', async () => {
      const mockFeeResult = {
        fee: 0,
        estimatedDays: 1,
        currency: 'VND',
      };
      mockShippingService.calculateFee.mockResolvedValue(mockFeeResult);

      const result = await controller.calculateFee(undefined as any, undefined);

      expect(mockShippingService.calculateFee).toHaveBeenCalledWith(
        expectedMockOrigin,
        {
          province: 'Bangkok',
          district: 'Unknown',
          ward: 'Unknown',
          line1: 'Customer address',
        },
        1,
      );
      expect(result).toEqual(mockFeeResult);
    });

    it('defaults province to Bangkok when empty string is provided', async () => {
      const mockFeeResult = {
        fee: 0,
        estimatedDays: 1,
        currency: 'VND',
      };
      mockShippingService.calculateFee.mockResolvedValue(mockFeeResult);

      const result = await controller.calculateFee('', 1);

      expect(mockShippingService.calculateFee).toHaveBeenCalledWith(
        expectedMockOrigin,
        {
          province: 'Bangkok',
          district: 'Unknown',
          ward: 'Unknown',
          line1: 'Customer address',
        },
        1,
      );
      expect(result).toEqual(mockFeeResult);
    });

    it('defaults weight to 1 when weight is 0', async () => {
      const mockFeeResult = {
        fee: 30000,
        estimatedDays: 3,
        currency: 'VND',
      };
      mockShippingService.calculateFee.mockResolvedValue(mockFeeResult);

      const result = await controller.calculateFee('Phuket', 0);

      expect(mockShippingService.calculateFee).toHaveBeenCalledWith(
        expectedMockOrigin,
        {
          province: 'Phuket',
          district: 'Unknown',
          ward: 'Unknown',
          line1: 'Customer address',
        },
        1,
      );
      expect(result).toEqual(mockFeeResult);
    });

    it('parses string weight to number via parseFloat(weight.toString())', async () => {
      const mockFeeResult = {
        fee: 30000,
        estimatedDays: 3,
        currency: 'VND',
      };
      mockShippingService.calculateFee.mockResolvedValue(mockFeeResult);

      const result = await controller.calculateFee('Nonthaburi', '4.75' as any);

      expect(mockShippingService.calculateFee).toHaveBeenCalledWith(
        expectedMockOrigin,
        {
          province: 'Nonthaburi',
          district: 'Unknown',
          ward: 'Unknown',
          line1: 'Customer address',
        },
        4.75,
      );
      expect(result).toEqual(mockFeeResult);
    });

    it('propagates exceptions thrown by shippingService.calculateFee', async () => {
      mockShippingService.calculateFee.mockRejectedValue(
        new Error('Failed to calculate shipping fee'),
      );

      await expect(
        controller.calculateFee('Chiang Mai', 1),
      ).rejects.toThrow('Failed to calculate shipping fee');
    });
  });

  describe('Route 2: GET /shipping/track - trackShipment', () => {
    const trackingNumber = 'THAI12345678';
    const mockTrackingResult = {
      trackingNumber,
      status: 'In Transit',
      events: [
        {
          timestamp: new Date('2026-03-01T10:00:00.000Z'),
          location: 'Bangkok Sorting Center',
          status: 'Picked Up',
          description: 'Package picked up from sender',
        },
        {
          timestamp: new Date('2026-03-02T10:00:00.000Z'),
          location: 'Regional Hub',
          status: 'In Transit',
          description: 'Package in transit to destination',
        },
      ],
    };

    it('delegates to shippingService.trackShipment with the trackingNumber query parameter and returns service result', async () => {
      mockShippingService.trackShipment.mockResolvedValue(mockTrackingResult);

      const result = await controller.trackShipment(trackingNumber);

      expect(mockShippingService.trackShipment).toHaveBeenCalledTimes(1);
      expect(mockShippingService.trackShipment).toHaveBeenCalledWith(trackingNumber);
      expect(result).toEqual(mockTrackingResult);
    });

    it('propagates exceptions thrown by shippingService.trackShipment', async () => {
      mockShippingService.trackShipment.mockRejectedValue(
        new Error('Tracking number not found'),
      );

      await expect(controller.trackShipment('INVALID_TRACKING')).rejects.toThrow(
        'Tracking number not found',
      );
      expect(mockShippingService.trackShipment).toHaveBeenCalledWith(
        'INVALID_TRACKING',
      );
    });
  });
});
