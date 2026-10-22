import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, CouponType, OrderStatus } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { MoneyUtil } from '@/common/utils/money.util';

describe('CouponsService', () => {
  let service: CouponsService;

  const mockPrismaService = {
    coupon: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    cart: {
      count: jest.fn(),
    },
  };

  const createMockCoupon = (overrides = {}) => ({
    code: 'SAVE10',
    type: CouponType.PERCENT,
    value: 10,
    minOrder: 100000,
    maxDiscount: 50000,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2026-12-31T23:59:59.000Z'),
    maxUses: 100,
    maxUsesPerUser: 1,
    usedCount: 5,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated coupons with custom page and limit', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 10 };
      const mockCoupons = [
        createMockCoupon({ code: 'COUPON1' }),
        createMockCoupon({ code: 'COUPON2' }),
      ];
      const total = 25;

      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);
      mockPrismaService.coupon.count.mockResolvedValue(total);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.coupon.count).toHaveBeenCalledWith();
      expect(result).toEqual({
        data: mockCoupons,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should use default page=1 and limit=20 when paginationDto has no page or limit', async () => {
      const paginationDto: PaginationDto = {};
      const mockCoupons = [createMockCoupon()];
      const total = 1;

      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);
      mockPrismaService.coupon.count.mockResolvedValue(total);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        data: mockCoupons,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle last page correctly with hasNextPage=false and hasPreviousPage=true', async () => {
      const paginationDto: PaginationDto = { page: 3, limit: 10 };
      mockPrismaService.coupon.findMany.mockResolvedValue([createMockCoupon()]);
      mockPrismaService.coupon.count.mockResolvedValue(25);

      const result = await service.findAll(paginationDto);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle empty result set correctly', async () => {
      mockPrismaService.coupon.findMany.mockResolvedValue([]);
      mockPrismaService.coupon.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should find coupon by code in uppercase and return it', async () => {
      const mockCoupon = createMockCoupon({ code: 'SUMMER2026' });
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await service.findOne('summer2026');

      expect(result).toEqual(mockCoupon);
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SUMMER2026' },
      });
    });

    it('should throw NotFoundException when coupon is not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.findOne('notfound')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('notfound')).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'NOTFOUND' },
      });
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if type is PERCENT and value is less than 0', async () => {
      const createDto: CreateCouponDto = {
        code: 'MINUS_PCT',
        type: CouponType.PERCENT,
        value: -1,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if type is PERCENT and value is greater than 100', async () => {
      const createDto: CreateCouponDto = {
        code: 'OVER_PCT',
        type: CouponType.PERCENT,
        value: 101,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if validFrom is greater than validUntil', async () => {
      const createDto: CreateCouponDto = {
        code: 'INVALID_DATES',
        type: CouponType.FIXED,
        value: 50000,
        validFrom: new Date('2026-07-02T00:00:00.000Z'),
        validUntil: new Date('2026-07-01T00:00:00.000Z'),
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if validFrom equals validUntil', async () => {
      const sameDate = new Date('2026-07-01T00:00:00.000Z');
      const createDto: CreateCouponDto = {
        code: 'SAME_DATES',
        type: CouponType.FIXED,
        value: 50000,
        validFrom: sameDate,
        validUntil: sameDate,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if coupon code already exists before insert', async () => {
      const createDto: CreateCouponDto = {
        code: 'existing',
        type: CouponType.PERCENT,
        value: 15,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(
        createMockCoupon({ code: 'EXISTING' }),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Coupon code already exists',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'EXISTING' },
      });
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should successfully create a new PERCENT coupon with uppercase code and valid date range', async () => {
      const validFrom = new Date('2026-06-01T00:00:00.000Z');
      const validUntil = new Date('2026-06-30T23:59:59.000Z');
      const createDto: CreateCouponDto = {
        code: 'promo20',
        type: CouponType.PERCENT,
        value: 20,
        minOrder: 100000,
        maxDiscount: 50000,
        validFrom,
        validUntil,
        maxUses: 100,
        maxUsesPerUser: 2,
      };

      const createdCoupon = createMockCoupon({
        code: 'PROMO20',
        type: CouponType.PERCENT,
        value: 20,
        minOrder: 100000,
        maxDiscount: 50000,
        validFrom,
        validUntil,
        maxUses: 100,
        maxUsesPerUser: 2,
      });

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue(createdCoupon);

      const result = await service.create(createDto);

      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'PROMO20' },
      });
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          code: 'PROMO20',
          type: CouponType.PERCENT,
          value: 20,
          minOrder: 100000,
          maxDiscount: 50000,
          validFrom,
          validUntil,
          maxUses: 100,
          maxUsesPerUser: 2,
        },
      });
      expect(result).toEqual(createdCoupon);
    });

    it('should successfully create a FIXED coupon with value > 100 and only validFrom defined', async () => {
      const validFrom = new Date('2026-06-01T00:00:00.000Z');
      const createDto: CreateCouponDto = {
        code: 'fixed50k',
        type: CouponType.FIXED,
        value: 50000,
        validFrom,
      };

      const createdCoupon = createMockCoupon({
        code: 'FIXED50K',
        type: CouponType.FIXED,
        value: 50000,
        validFrom,
        validUntil: undefined,
      });

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue(createdCoupon);

      const result = await service.create(createDto);

      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'FIXED50K' },
      });
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          code: 'FIXED50K',
          type: CouponType.FIXED,
          value: 50000,
          minOrder: undefined,
          maxDiscount: undefined,
          validFrom,
          validUntil: undefined,
          maxUses: undefined,
          maxUsesPerUser: undefined,
        },
      });
      expect(result).toEqual(createdCoupon);
    });

    it('should catch Prisma P2002 conflict error during create and throw BadRequestException', async () => {
      const createDto: CreateCouponDto = {
        code: 'racecondition',
        type: CouponType.PERCENT,
        value: 10,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.create.mockRejectedValue(p2002Error);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Coupon code already exists',
      );
    });

    it('should rethrow non-P2002 Prisma errors or unexpected errors during create', async () => {
      const createDto: CreateCouponDto = {
        code: 'dberror',
        type: CouponType.PERCENT,
        value: 10,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      const unexpectedError = new Error('Database connection failed');
      mockPrismaService.coupon.create.mockRejectedValue(unexpectedError);

      await expect(service.create(createDto)).rejects.toThrow(unexpectedError);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if coupon does not exist', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { value: 15 })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('missing', { value: 15 })).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'MISSING' },
      });
    });

    it('should throw BadRequestException if updating type to PERCENT and effective value is < 0', async () => {
      const existing = createMockCoupon({
        type: CouponType.FIXED,
        value: 50000,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const updateDto: UpdateCouponDto = {
        type: CouponType.PERCENT,
        value: -5,
      };

      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
    });

    it('should throw BadRequestException if coupon is PERCENT and updated value is > 100', async () => {
      const existing = createMockCoupon({
        type: CouponType.PERCENT,
        value: 10,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const updateDto: UpdateCouponDto = {
        value: 105,
      };

      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
    });

    it('should throw BadRequestException if existing value > 100 and type updated to PERCENT without value', async () => {
      const existing = createMockCoupon({
        type: CouponType.FIXED,
        value: 20000,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const updateDto: UpdateCouponDto = {
        type: CouponType.PERCENT,
      };

      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
    });

    it('should throw BadRequestException if new validFrom is greater than or equal to coupon validUntil', async () => {
      const existing = createMockCoupon({
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-06-01T00:00:00.000Z'),
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const updateDto: UpdateCouponDto = {
        validFrom: new Date('2026-06-02T00:00:00.000Z'),
      };

      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
    });

    it('should throw BadRequestException if new validUntil is less than or equal to coupon validFrom', async () => {
      const existing = createMockCoupon({
        validFrom: new Date('2026-06-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const updateDto: UpdateCouponDto = {
        validUntil: new Date('2026-05-31T00:00:00.000Z'),
      };

      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
    });

    it('should throw BadRequestException if maxUses is less than coupon usedCount', async () => {
      const existing = createMockCoupon({
        usedCount: 20,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const updateDto: UpdateCouponDto = {
        maxUses: 15,
      };

      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SAVE10', updateDto)).rejects.toThrow(
        'maxUses cannot be less than usedCount',
      );
    });

    it('should successfully update coupon when active is explicitly provided as false', async () => {
      const existing = createMockCoupon({
        active: true,
        usedCount: 5,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);
      const updatedCoupon = { ...existing, active: false };
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const updateDto: UpdateCouponDto = {
        active: false,
        maxUses: 50,
      };

      const result = await service.update('save10', updateDto);

      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        data: {
          active: false,
          maxUses: 50,
        },
      });
      expect(result).toEqual(updatedCoupon);
    });

    it('should delete active from updateData when active is undefined', async () => {
      const existing = createMockCoupon({
        active: true,
        usedCount: 5,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);
      const updatedCoupon = { ...existing, minOrder: 150000 };
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const updateDto: UpdateCouponDto = {
        minOrder: 150000,
      };

      const result = await service.update('save10', updateDto);

      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        data: {
          minOrder: 150000,
        },
      });
      expect(result).toEqual(updatedCoupon);
    });

    it('should allow maxUses to be null without throwing maxUses validation error', async () => {
      const existing = createMockCoupon({
        usedCount: 10,
        maxUses: 20,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);
      const updatedCoupon = { ...existing, maxUses: null };
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const updateDto: UpdateCouponDto = {
        maxUses: null,
      };

      const result = await service.update('SAVE10', updateDto);

      expect(result).toEqual(updatedCoupon);
      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        data: { maxUses: null },
      });
    });

    it('should catch Prisma P2002 conflict error during update and throw BadRequestException', async () => {
      const existing = createMockCoupon();
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.update.mockRejectedValue(p2002Error);

      await expect(
        service.update('SAVE10', { minOrder: 50000 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('SAVE10', { minOrder: 50000 }),
      ).rejects.toThrow('Coupon code already exists');
    });

    it('should rethrow unexpected non-P2002 errors during update', async () => {
      const existing = createMockCoupon();
      mockPrismaService.coupon.findUnique.mockResolvedValue(existing);

      const unexpectedError = new Error('Database connection failed');
      mockPrismaService.coupon.update.mockRejectedValue(unexpectedError);

      await expect(
        service.update('SAVE10', { minOrder: 50000 }),
      ).rejects.toThrow(unexpectedError);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if coupon to remove does not exist', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('unknown')).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'UNKNOWN' },
      });
      expect(mockPrismaService.order.count).not.toHaveBeenCalled();
      expect(mockPrismaService.cart.count).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if coupon has been used in orders', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(createMockCoupon());
      mockPrismaService.order.count.mockResolvedValue(3);
      mockPrismaService.cart.count.mockResolvedValue(0);

      await expect(service.remove('save10')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('save10')).rejects.toThrow(
        'Cannot delete coupon that has been used in orders',
      );
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: { couponCode: 'SAVE10' },
      });
      expect(mockPrismaService.cart.count).toHaveBeenCalledWith({
        where: { couponId: 'SAVE10' },
      });
      expect(mockPrismaService.coupon.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if coupon is currently applied to carts', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(createMockCoupon());
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(2);

      await expect(service.remove('save10')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('save10')).rejects.toThrow(
        'Cannot delete coupon currently applied to carts',
      );
      expect(mockPrismaService.coupon.delete).not.toHaveBeenCalled();
    });

    it('should delete coupon and return success message when orderCount and cartCount are 0', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(createMockCoupon());
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);
      mockPrismaService.coupon.delete.mockResolvedValue(createMockCoupon());

      const result = await service.remove('save10');

      expect(mockPrismaService.coupon.delete).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
      });
      expect(result).toEqual({ message: 'Coupon deleted successfully' });
    });

    it('should catch Prisma P2003 foreign key constraint error and throw BadRequestException', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(createMockCoupon());
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);

      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.delete.mockRejectedValue(p2003Error);

      await expect(service.remove('save10')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('save10')).rejects.toThrow(
        'Cannot delete coupon currently referenced by another record',
      );
    });

    it('should rethrow unexpected non-P2003 errors during remove', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(createMockCoupon());
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);

      const unexpectedError = new Error('Database failure');
      mockPrismaService.coupon.delete.mockRejectedValue(unexpectedError);

      await expect(service.remove('save10')).rejects.toThrow(unexpectedError);
    });
  });

  describe('validateCoupon', () => {
    const fixedNow = new Date('2026-06-15T12:00:00.000Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return valid=false when coupon does not exist', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await service.validateCoupon('unknown', 'user-1', 100000);

      expect(result).toEqual({
        valid: false,
        message: 'Coupon not found',
      });
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'UNKNOWN' },
      });
    });

    it('should return valid=false when coupon is inactive', async () => {
      const coupon = createMockCoupon({ active: false });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('save10', 'user-1', 100000);

      expect(result).toEqual({
        valid: false,
        message: 'Coupon is inactive',
      });
    });

    it('should return valid=false when coupon validFrom is in the future', async () => {
      const coupon = createMockCoupon({
        active: true,
        validFrom: new Date('2026-06-20T00:00:00.000Z'),
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('save10', 'user-1', 100000);

      expect(result).toEqual({
        valid: false,
        message: 'Coupon is not yet valid',
      });
    });

    it('should return valid=false when coupon validUntil is in the past', async () => {
      const coupon = createMockCoupon({
        active: true,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-06-10T00:00:00.000Z'),
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('save10', 'user-1', 100000);

      expect(result).toEqual({
        valid: false,
        message: 'Coupon has expired',
      });
    });

    it('should return valid=false when coupon has reached maximum usage limit', async () => {
      const coupon = createMockCoupon({
        active: true,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        maxUses: 10,
        usedCount: 10,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('save10', 'user-1', 100000);

      expect(result).toEqual({
        valid: false,
        message: 'Coupon has reached maximum usage limit',
      });
    });

    it('should return valid=false when user has already reached maxUsesPerUser limit', async () => {
      const coupon = createMockCoupon({
        code: 'USERLIMIT',
        active: true,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        maxUses: 100,
        usedCount: 10,
        maxUsesPerUser: 1,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.validateCoupon(
        'userlimit',
        'user-1',
        100000,
      );

      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          couponCode: 'USERLIMIT',
          status: { not: OrderStatus.CANCELED },
        },
      });
      expect(result).toEqual({
        valid: false,
        message:
          'You have already used this coupon the maximum number of times',
      });
    });

    it('should return valid=false when orderTotal is less than minOrder', async () => {
      const coupon = createMockCoupon({
        active: true,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        minOrder: 200000,
        maxUses: null,
        maxUsesPerUser: null,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('save10', 'user-1', 150000);

      expect(result).toEqual({
        valid: false,
        message: `Minimum order amount is ${MoneyUtil.format(200000)}`,
      });
    });

    it('should return valid=true and calculate discount for PERCENT coupon without exceeding maxDiscount', async () => {
      const coupon = createMockCoupon({
        type: CouponType.PERCENT,
        value: 10,
        minOrder: 50000,
        maxDiscount: 50000,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        maxUses: 100,
        usedCount: 0,
        maxUsesPerUser: 2,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.validateCoupon('save10', 'user-1', 200000);

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon,
        discountAmount: 20000,
      });
    });

    it('should return valid=true and cap discount at maxDiscount for PERCENT coupon', async () => {
      const coupon = createMockCoupon({
        type: CouponType.PERCENT,
        value: 50,
        minOrder: 100000,
        maxDiscount: 25000,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        maxUses: null,
        maxUsesPerUser: null,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('save10', 'user-1', 200000);

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon,
        discountAmount: 25000,
      });
    });

    it('should return valid=true and calculate discount for FIXED coupon', async () => {
      const coupon = createMockCoupon({
        type: CouponType.FIXED,
        value: 30000,
        minOrder: 50000,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('fixed30', 'user-1', 100000);

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon,
        discountAmount: 30000,
      });
    });

    it('should return valid=true and return 0 discount for FREESHIP coupon', async () => {
      const coupon = createMockCoupon({
        type: CouponType.FREESHIP,
        value: 0,
        minOrder: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCoupon('freeship', 'user-1', 100000);

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon,
        discountAmount: 0,
      });
    });
  });

  describe('applyCoupon', () => {
    it('should throw BadRequestException with validation message when coupon is invalid', async () => {
      jest.spyOn(service, 'validateCoupon').mockResolvedValue({
        valid: false,
        message: 'Coupon has expired',
      });

      await expect(
        service.applyCoupon('expired', 'user-1', 100000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.applyCoupon('expired', 'user-1', 100000),
      ).rejects.toThrow('Coupon has expired');
      expect(service.validateCoupon).toHaveBeenCalledWith(
        'expired',
        'user-1',
        100000,
      );
    });

    it('should return coupon and discountAmount when coupon is valid', async () => {
      const mockCoupon = createMockCoupon();
      jest.spyOn(service, 'validateCoupon').mockResolvedValue({
        valid: true,
        message: 'Coupon is valid',
        coupon: mockCoupon as any,
        discountAmount: 10000,
      });

      const result = await service.applyCoupon('save10', 'user-1', 100000);

      expect(result).toEqual({
        coupon: mockCoupon,
        discountAmount: 10000,
      });
      expect(service.validateCoupon).toHaveBeenCalledWith(
        'save10',
        'user-1',
        100000,
      );
    });
  });

  describe('incrementUsage', () => {
    it('should increment coupon usedCount by 1 and return updated coupon', async () => {
      const updatedCoupon = createMockCoupon({
        code: 'SAVE10',
        usedCount: 6,
      });
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await service.incrementUsage('save10');

      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        data: {
          usedCount: { increment: 1 },
        },
      });
      expect(result).toEqual(updatedCoupon);
    });
  });
});
