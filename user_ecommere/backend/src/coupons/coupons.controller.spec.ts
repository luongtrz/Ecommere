import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, CouponType } from '@prisma/client';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';

describe('CouponsController', () => {
  let controller: CouponsController;
  let couponsService: CouponsService;

  const mockCouponsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    validateCoupon: jest.fn(),
    canUserUseCoupon: jest.fn(),
  };

  const canActivateStub = jest.fn((_context?: ExecutionContext) => true);

  const mockCoupon = {
    code: 'SUMMER2025',
    type: CouponType.PERCENT,
    value: 20,
    minOrder: 100000,
    maxDiscount: 50000,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2026-12-31T23:59:59.999Z'),
    maxUses: 100,
    maxUsesPerUser: 2,
    usedCount: 5,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    canActivateStub.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponsController],
      providers: [
        {
          provide: CouponsService,
          useValue: mockCouponsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: canActivateStub })
      .compile();

    controller = module.get<CouponsController>(CouponsController);
    couponsService = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(couponsService).toBeDefined();
  });

  describe('Route Guards and Metadata', () => {
    it('should have route guards overridden with canActivate returning true', () => {
      expect(canActivateStub()).toBe(true);
    });

    it('should have @Roles(Role.ADMIN) decorator metadata on admin routes', () => {
      const reflector = new Reflector();

      expect(reflector.get(ROLES_KEY, controller.findAll)).toEqual([
        Role.ADMIN,
      ]);
      expect(reflector.get(ROLES_KEY, controller.findOne)).toEqual([
        Role.ADMIN,
      ]);
      expect(reflector.get(ROLES_KEY, controller.create)).toEqual([Role.ADMIN]);
      expect(reflector.get(ROLES_KEY, controller.update)).toEqual([Role.ADMIN]);
      expect(reflector.get(ROLES_KEY, controller.remove)).toEqual([Role.ADMIN]);
      expect(
        reflector.get(ROLES_KEY, controller.validateCoupon),
      ).toBeUndefined();
    });
  });

  describe('GET /coupons (findAll)', () => {
    it('should delegate to couponsService.findAll with paginationDto and return result', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 10 };
      const expectedResult = {
        data: [mockCoupon],
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      };

      mockCouponsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(result).toEqual(expectedResult);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith(paginationDto);
    });

    it('should delegate with empty paginationDto and return result', async () => {
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockCouponsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({});

      expect(result).toEqual(expectedResult);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith({});
    });

    it('should propagate errors thrown by couponsService.findAll', async () => {
      const error = new Error('Database query failure');
      mockCouponsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll({})).rejects.toThrow(error);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('GET /coupons/:code (findOne)', () => {
    it('should delegate to couponsService.findOne with code param and return coupon', async () => {
      mockCouponsService.findOne.mockResolvedValue(mockCoupon);

      const result = await controller.findOne('SUMMER2025');

      expect(result).toEqual(mockCoupon);
      expect(mockCouponsService.findOne).toHaveBeenCalledWith('SUMMER2025');
    });

    it('should propagate NotFoundException when coupon is not found', async () => {
      const notFoundError = new NotFoundException('Coupon not found');
      mockCouponsService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCouponsService.findOne).toHaveBeenCalledWith('UNKNOWN');
    });
  });

  describe('POST /coupons (create)', () => {
    const createCouponDto: CreateCouponDto = {
      code: 'NEWYEAR2026',
      type: CouponType.PERCENT,
      value: 15,
      minOrder: 150000,
      maxDiscount: 30000,
      maxUses: 50,
      maxUsesPerUser: 1,
    };

    it('should delegate to couponsService.create with createCouponDto and return created coupon', async () => {
      const createdCoupon = {
        ...mockCoupon,
        code: 'NEWYEAR2026',
        value: 15,
      };
      mockCouponsService.create.mockResolvedValue(createdCoupon);

      const result = await controller.create(createCouponDto);

      expect(result).toEqual(createdCoupon);
      expect(mockCouponsService.create).toHaveBeenCalledWith(createCouponDto);
    });

    it('should propagate BadRequestException when coupon code already exists', async () => {
      const badRequestError = new BadRequestException(
        'Coupon code already exists',
      );
      mockCouponsService.create.mockRejectedValue(badRequestError);

      await expect(controller.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCouponsService.create).toHaveBeenCalledWith(createCouponDto);
    });
  });

  describe('PATCH /coupons/:code (update)', () => {
    const updateCouponDto: UpdateCouponDto = {
      value: 25,
      active: false,
    };

    it('should delegate to couponsService.update with code and updateCouponDto and return updated coupon', async () => {
      const updatedCoupon = {
        ...mockCoupon,
        value: 25,
        active: false,
      };
      mockCouponsService.update.mockResolvedValue(updatedCoupon);

      const result = await controller.update('SUMMER2025', updateCouponDto);

      expect(result).toEqual(updatedCoupon);
      expect(mockCouponsService.update).toHaveBeenCalledWith(
        'SUMMER2025',
        updateCouponDto,
      );
    });

    it('should propagate NotFoundException when coupon to update is not found', async () => {
      const notFoundError = new NotFoundException('Coupon not found');
      mockCouponsService.update.mockRejectedValue(notFoundError);

      await expect(
        controller.update('NOTFOUND', updateCouponDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockCouponsService.update).toHaveBeenCalledWith(
        'NOTFOUND',
        updateCouponDto,
      );
    });

    it('should propagate BadRequestException on invalid update data', async () => {
      const badRequestError = new BadRequestException(
        'Percentage value must be between 0 and 100',
      );
      mockCouponsService.update.mockRejectedValue(badRequestError);

      await expect(
        controller.update('SUMMER2025', { value: 150 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCouponsService.update).toHaveBeenCalledWith('SUMMER2025', {
        value: 150,
      });
    });
  });

  describe('DELETE /coupons/:code (remove)', () => {
    it('should delegate to couponsService.remove with code param and return service result', async () => {
      const deleteResult = { message: 'Coupon deleted successfully' };
      mockCouponsService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('SUMMER2025');

      expect(result).toEqual(deleteResult);
      expect(mockCouponsService.remove).toHaveBeenCalledWith('SUMMER2025');
    });

    it('should propagate NotFoundException when coupon to delete does not exist', async () => {
      const notFoundError = new NotFoundException('Coupon not found');
      mockCouponsService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove('NOTFOUND')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCouponsService.remove).toHaveBeenCalledWith('NOTFOUND');
    });

    it('should propagate BadRequestException when coupon is in use', async () => {
      const badRequestError = new BadRequestException(
        'Cannot delete coupon that has been used in orders',
      );
      mockCouponsService.remove.mockRejectedValue(badRequestError);

      await expect(controller.remove('USED')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCouponsService.remove).toHaveBeenCalledWith('USED');
    });
  });

  describe('GET /coupons/validate (validateCoupon)', () => {
    const couponCode = 'SUMMER2025';

    const mockValidationSuccess = {
      valid: true,
      message: 'Coupon is valid',
      discount: 20000,
      finalTotal: 80000,
      coupon: {
        code: 'SUMMER2025',
        type: CouponType.PERCENT,
        value: 20,
      },
    };

    it('should throw BadRequestException when code is undefined', async () => {
      await expect(
        controller.validateCoupon(undefined as any, 'user-1', '100000'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon(undefined as any, 'user-1', '100000'),
      ).rejects.toThrow('code is required');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when code is empty string', async () => {
      await expect(
        controller.validateCoupon('', 'user-1', '100000'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon('', 'user-1', '100000'),
      ).rejects.toThrow('code is required');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when code is whitespace only', async () => {
      await expect(
        controller.validateCoupon('   ', 'user-1', '100000'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon('   ', 'user-1', '100000'),
      ).rejects.toThrow('code is required');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should trim code whitespace before delegating to service', async () => {
      mockCouponsService.validateCoupon.mockResolvedValue(
        mockValidationSuccess,
      );

      const result = await controller.validateCoupon(
        '  SUMMER2025  ',
        'user-1',
        '100000',
      );

      expect(result).toEqual(mockValidationSuccess);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'SUMMER2025',
        'user-1',
        100000,
      );
    });

    it('should delegate to couponsService.validateCoupon with parsed integer when orderTotal is provided', async () => {
      mockCouponsService.validateCoupon.mockResolvedValue(
        mockValidationSuccess,
      );

      const result = await controller.validateCoupon(
        couponCode,
        'user-1',
        '100000',
      );

      expect(result).toEqual(mockValidationSuccess);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'SUMMER2025',
        'user-1',
        100000,
      );
    });

    it('should trim orderTotal whitespace and pass the numeric value', async () => {
      mockCouponsService.validateCoupon.mockResolvedValue(
        mockValidationSuccess,
      );

      const result = await controller.validateCoupon(
        couponCode,
        'user-1',
        '  250000  ',
      );

      expect(result).toEqual(mockValidationSuccess);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'SUMMER2025',
        'user-1',
        250000,
      );
    });

    it('should allow orderTotal of 0', async () => {
      mockCouponsService.validateCoupon.mockResolvedValue(
        mockValidationSuccess,
      );

      const result = await controller.validateCoupon(couponCode, 'user-1', '0');

      expect(result).toEqual(mockValidationSuccess);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'SUMMER2025',
        'user-1',
        0,
      );
    });

    it('should default total to 0 when orderTotal is undefined', async () => {
      mockCouponsService.validateCoupon.mockResolvedValue(
        mockValidationSuccess,
      );

      const result = await controller.validateCoupon(
        couponCode,
        'user-1',
        undefined,
      );

      expect(result).toEqual(mockValidationSuccess);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'SUMMER2025',
        'user-1',
        0,
      );
    });

    it('should throw BadRequestException when orderTotal is empty string', async () => {
      await expect(
        controller.validateCoupon(couponCode, 'user-1', ''),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon(couponCode, 'user-1', ''),
      ).rejects.toThrow('orderTotal must be a non-negative integer');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when orderTotal is whitespace only', async () => {
      await expect(
        controller.validateCoupon(couponCode, 'user-1', '   '),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon(couponCode, 'user-1', '   '),
      ).rejects.toThrow('orderTotal must be a non-negative integer');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when orderTotal is negative', async () => {
      await expect(
        controller.validateCoupon(couponCode, 'user-1', '-100'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon(couponCode, 'user-1', '-100'),
      ).rejects.toThrow('orderTotal must be a non-negative integer');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when orderTotal is non-numeric string', async () => {
      await expect(
        controller.validateCoupon(couponCode, 'user-1', 'abc'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon(couponCode, 'user-1', 'abc'),
      ).rejects.toThrow('orderTotal must be a non-negative integer');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when orderTotal is a decimal number', async () => {
      await expect(
        controller.validateCoupon(couponCode, 'user-1', '100.5'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.validateCoupon(couponCode, 'user-1', '100.5'),
      ).rejects.toThrow('orderTotal must be a non-negative integer');

      expect(mockCouponsService.validateCoupon).not.toHaveBeenCalled();
    });

    it('should propagate service errors during coupon validation', async () => {
      const error = new Error('Service unavailable');
      mockCouponsService.validateCoupon.mockRejectedValue(error);

      await expect(
        controller.validateCoupon(couponCode, 'user-1', '50000'),
      ).rejects.toThrow(error);

      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'SUMMER2025',
        'user-1',
        50000,
      );
    });
  });
});
