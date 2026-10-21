import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponType, OrderStatus, Prisma } from '@prisma/client';
import { CouponsService, canUserUseCoupon } from './coupons.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { MoneyUtil } from '@/common/utils/money.util';

describe('CouponsService', () => {
  let service: CouponsService;

  const mockPrismaService = {
    coupon: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    cart: {
      count: jest.fn(),
    },
    referral: {
      findFirst: jest.fn(),
    },
  };

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

    mockPrismaService.referral.findFirst.mockResolvedValue(null);

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

  describe('canUserUseCoupon (helper and public method)', () => {
    it('should return true when coupon code is empty, null, or undefined without querying referral', async () => {
      const resultEmpty = await service.canUserUseCoupon('', 'user-1');
      const resultNull = await canUserUseCoupon(
        mockPrismaService,
        null as any,
        'user-1',
      );
      const resultUndefined = await canUserUseCoupon(
        mockPrismaService,
        undefined as any,
        'user-1',
      );

      expect(resultEmpty).toBe(true);
      expect(resultNull).toBe(true);
      expect(resultUndefined).toBe(true);
      expect(mockPrismaService.referral.findFirst).not.toHaveBeenCalled();
    });

    it('should return true when no referral row is associated with the code', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue(null);

      const result = await service.canUserUseCoupon('PROMO2025', 'user-1');

      expect(result).toBe(true);
      expect(mockPrismaService.referral.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { referrerCouponCode: 'PROMO2025' },
            { refereeCouponCode: 'PROMO2025' },
          ],
        },
      });
    });

    it('should return true when code matches referrerCouponCode and userId matches referrerId', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'REF-OWNER',
        refereeCouponCode: 'REF-FRIEND',
        referrerId: 'user-referrer',
        refereeId: 'user-referee',
      });

      const result = await service.canUserUseCoupon(
        'ref-owner',
        'user-referrer',
      );

      expect(result).toBe(true);
      expect(mockPrismaService.referral.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { referrerCouponCode: 'REF-OWNER' },
            { refereeCouponCode: 'REF-OWNER' },
          ],
        },
      });
    });

    it('should return true when code matches refereeCouponCode and userId matches refereeId', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'REF-OWNER',
        refereeCouponCode: 'REF-FRIEND',
        referrerId: 'user-referrer',
        refereeId: 'user-referee',
      });

      const result = await service.canUserUseCoupon(
        'ref-friend',
        'user-referee',
      );

      expect(result).toBe(true);
      expect(mockPrismaService.referral.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { referrerCouponCode: 'REF-FRIEND' },
            { refereeCouponCode: 'REF-FRIEND' },
          ],
        },
      });
    });

    it('should return false when code is referrer coupon but userId does not match referrerId', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'REF-OWNER',
        refereeCouponCode: 'REF-FRIEND',
        referrerId: 'user-referrer',
        refereeId: 'user-referee',
      });

      const result = await service.canUserUseCoupon('REF-OWNER', 'user-other');

      expect(result).toBe(false);
    });

    it('should return false when code is referee coupon but userId does not match refereeId', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'REF-OWNER',
        refereeCouponCode: 'REF-FRIEND',
        referrerId: 'user-referrer',
        refereeId: 'user-referee',
      });

      const result = await service.canUserUseCoupon('REF-FRIEND', 'user-other');

      expect(result).toBe(false);
    });

    it('should return false when code is referral-linked but userId is omitted or null', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'REF-OWNER',
        refereeCouponCode: 'REF-FRIEND',
        referrerId: 'user-referrer',
        refereeId: 'user-referee',
      });

      const resultUndefined = await service.canUserUseCoupon(
        'REF-OWNER',
        undefined,
      );
      const resultNull = await service.canUserUseCoupon('REF-OWNER', null);

      expect(resultUndefined).toBe(false);
      expect(resultNull).toBe(false);
    });

    it('should return false when referral row codes do not match normalized code', async () => {
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'OTHER-CODE',
        refereeCouponCode: null,
        referrerId: 'user-1',
        refereeId: 'user-2',
      });

      const result = await canUserUseCoupon(
        mockPrismaService,
        'UNMATCHED',
        'user-1',
      );

      expect(result).toBe(false);
    });

    it('should return true when prisma or prisma.referral is not provided', async () => {
      const result = await canUserUseCoupon({}, 'SOMECODE', 'user-1');

      expect(result).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated coupons with default pagination parameters (page=1, limit=20)', async () => {
      const mockCoupons = [mockCoupon];
      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);
      mockPrismaService.coupon.count.mockResolvedValue(25);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: mockCoupons,
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.coupon.count).toHaveBeenCalledWith();
    });

    it('should return paginated coupons with custom page and limit', async () => {
      const mockCoupons = [mockCoupon];
      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);
      mockPrismaService.coupon.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result).toEqual({
        data: mockCoupons,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should set hasNextPage to false when on the last page', async () => {
      mockPrismaService.coupon.findMany.mockResolvedValue([mockCoupon]);
      mockPrismaService.coupon.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should return empty list and zero pages when no coupons exist', async () => {
      mockPrismaService.coupon.findMany.mockResolvedValue([]);
      mockPrismaService.coupon.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('findOne', () => {
    it('should return coupon when found by uppercase code', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await service.findOne('summer2025');

      expect(result).toEqual(mockCoupon);
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SUMMER2025' },
      });
    });

    it('should throw NotFoundException when coupon is not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.findOne('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('UNKNOWN')).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'UNKNOWN' },
      });
    });
  });

  describe('create', () => {
    it('should throw BadRequestException when type is PERCENT and value is negative', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'DISCOUNT',
        type: CouponType.PERCENT,
        value: -5,
      };

      await expect(service.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCouponDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when type is PERCENT and value is greater than 100', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'DISCOUNT',
        type: CouponType.PERCENT,
        value: 105,
      };

      await expect(service.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCouponDto)).rejects.toThrow(
        'Percentage value must be between 0 and 100',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when validFrom is greater than validUntil', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'TIMED',
        type: CouponType.PERCENT,
        value: 10,
        validFrom: new Date('2026-06-01T00:00:00.000Z'),
        validUntil: new Date('2026-05-01T00:00:00.000Z'),
      };

      await expect(service.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCouponDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when validFrom equals validUntil', async () => {
      const sameDate = new Date('2026-06-01T00:00:00.000Z');
      const createCouponDto: CreateCouponDto = {
        code: 'TIMED',
        type: CouponType.PERCENT,
        value: 10,
        validFrom: sameDate,
        validUntil: sameDate,
      };

      await expect(service.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCouponDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when coupon code already exists in findUnique check', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'summer2025',
        type: CouponType.PERCENT,
        value: 20,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      await expect(service.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCouponDto)).rejects.toThrow(
        'Coupon code already exists',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SUMMER2025' },
      });
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
    });

    it('should successfully create and return a PERCENT coupon', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'save20',
        type: CouponType.PERCENT,
        value: 20,
        minOrder: 100000,
        maxDiscount: 50000,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-06-01T00:00:00.000Z'),
        maxUses: 100,
        maxUsesPerUser: 1,
      };

      const createdCoupon = {
        ...mockCoupon,
        code: 'SAVE20',
        ...createCouponDto,
        code_upper: 'SAVE20',
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue(createdCoupon);

      const result = await service.create(createCouponDto);

      expect(result).toEqual(createdCoupon);
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          code: 'SAVE20',
          type: CouponType.PERCENT,
          value: 20,
          minOrder: 100000,
          maxDiscount: 50000,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: new Date('2026-06-01T00:00:00.000Z'),
          maxUses: 100,
          maxUsesPerUser: 1,
        },
      });
    });

    it('should successfully create a FIXED coupon with value > 100 without percentage check', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'FIXED50K',
        type: CouponType.FIXED,
        value: 50000,
      };

      const createdCoupon = {
        ...mockCoupon,
        code: 'FIXED50K',
        type: CouponType.FIXED,
        value: 50000,
        minOrder: undefined,
        maxDiscount: undefined,
        validFrom: undefined,
        validUntil: undefined,
        maxUses: undefined,
        maxUsesPerUser: undefined,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue(createdCoupon);

      const result = await service.create(createCouponDto);

      expect(result).toEqual(createdCoupon);
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          code: 'FIXED50K',
          type: CouponType.FIXED,
          value: 50000,
          minOrder: undefined,
          maxDiscount: undefined,
          validFrom: undefined,
          validUntil: undefined,
          maxUses: undefined,
          maxUsesPerUser: undefined,
        },
      });
    });

    it('should throw BadRequestException when prisma.coupon.create throws P2002 error', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'RACE_DUP',
        type: CouponType.PERCENT,
        value: 15,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `coupons_pkey`',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.create.mockRejectedValue(p2002Error);

      await expect(service.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCouponDto)).rejects.toThrow(
        'Coupon code already exists',
      );
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'OTHER_ERR',
        type: CouponType.PERCENT,
        value: 15,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.create.mockRejectedValue(p2025Error);

      await expect(service.create(createCouponDto)).rejects.toThrow(p2025Error);
    });

    it('should rethrow unexpected non-Prisma errors during create', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'ERR',
        type: CouponType.PERCENT,
        value: 15,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      const genericError = new Error('Database connection failed');
      mockPrismaService.coupon.create.mockRejectedValue(genericError);

      await expect(service.create(createCouponDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when coupon to update is not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.update('NOTFOUND', { value: 30 })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('NOTFOUND', { value: 30 })).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'NOTFOUND' },
      });
      expect(mockPrismaService.coupon.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when update sets type to PERCENT with negative value', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      await expect(
        service.update('SUMMER2025', {
          type: CouponType.PERCENT,
          value: -1,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('SUMMER2025', {
          type: CouponType.PERCENT,
          value: -1,
        }),
      ).rejects.toThrow('Percentage value must be between 0 and 100');
    });

    it('should throw BadRequestException when update sets type to PERCENT with value > 100', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      await expect(
        service.update('SUMMER2025', {
          type: CouponType.PERCENT,
          value: 120,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('SUMMER2025', {
          type: CouponType.PERCENT,
          value: 120,
        }),
      ).rejects.toThrow('Percentage value must be between 0 and 100');
    });

    it('should throw BadRequestException when existing coupon is PERCENT and update provides value > 100 without type', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        type: CouponType.PERCENT,
      });

      await expect(
        service.update('SUMMER2025', { value: 150 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('SUMMER2025', { value: 150 }),
      ).rejects.toThrow('Percentage value must be between 0 and 100');
    });

    it('should throw BadRequestException when existing coupon has value > 100 and update changes type to PERCENT without value', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        type: CouponType.FIXED,
        value: 50000,
      });

      await expect(
        service.update('SUMMER2025', { type: CouponType.PERCENT }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('SUMMER2025', { type: CouponType.PERCENT }),
      ).rejects.toThrow('Percentage value must be between 0 and 100');
    });

    it('should throw BadRequestException when update validFrom >= update validUntil', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const updateDto: UpdateCouponDto = {
        validFrom: new Date('2026-08-01T00:00:00.000Z'),
        validUntil: new Date('2026-07-01T00:00:00.000Z'),
      };

      await expect(service.update('SUMMER2025', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SUMMER2025', updateDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
    });

    it('should throw BadRequestException when updated validFrom >= existing coupon validUntil', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validUntil: new Date('2026-06-01T00:00:00.000Z'),
      });

      const updateDto: UpdateCouponDto = {
        validFrom: new Date('2026-06-02T00:00:00.000Z'),
      };

      await expect(service.update('SUMMER2025', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SUMMER2025', updateDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
    });

    it('should throw BadRequestException when updated validUntil <= existing coupon validFrom', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validFrom: new Date('2026-06-01T00:00:00.000Z'),
      });

      const updateDto: UpdateCouponDto = {
        validUntil: new Date('2026-05-31T00:00:00.000Z'),
      };

      await expect(service.update('SUMMER2025', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SUMMER2025', updateDto)).rejects.toThrow(
        'validFrom must be before validUntil',
      );
    });

    it('should update coupon and include active when active is provided', async () => {
      const updateDto: UpdateCouponDto = {
        active: false,
        maxUses: 200,
      };

      const updatedCoupon = {
        ...mockCoupon,
        active: false,
        maxUses: 200,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await service.update('summer2025', updateDto);

      expect(result).toEqual(updatedCoupon);
      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SUMMER2025' },
        data: {
          active: false,
          maxUses: 200,
        },
      });
    });

    it('should delete active from updateData when active is undefined', async () => {
      const updateDto: UpdateCouponDto = {
        value: 25,
      };

      const updatedCoupon = {
        ...mockCoupon,
        value: 25,
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await service.update('SUMMER2025', updateDto);

      expect(result).toEqual(updatedCoupon);
      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SUMMER2025' },
        data: {
          value: 25,
        },
      });
      const updateArgs = mockPrismaService.coupon.update.mock.calls[0][0];
      expect(updateArgs.data).not.toHaveProperty('active');
    });

    it('should throw BadRequestException when prisma.coupon.update throws P2002 error', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.update.mockRejectedValue(p2002Error);

      await expect(service.update('SUMMER2025', { value: 30 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('SUMMER2025', { value: 30 })).rejects.toThrow(
        'Coupon code already exists',
      );
    });

    it('should rethrow PrismaClientKnownRequestError when update error code is not P2002', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.update.mockRejectedValue(p2025Error);

      await expect(service.update('SUMMER2025', { value: 30 })).rejects.toThrow(
        p2025Error,
      );
    });

    it('should rethrow unexpected non-Prisma errors during update', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      const unknownError = new Error('Database write failure');
      mockPrismaService.coupon.update.mockRejectedValue(unknownError);

      await expect(service.update('SUMMER2025', { value: 30 })).rejects.toThrow(
        unknownError,
      );
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when coupon to remove does not exist', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.remove('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('UNKNOWN')).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'UNKNOWN' },
      });
      expect(mockPrismaService.order.count).not.toHaveBeenCalled();
      expect(mockPrismaService.cart.count).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when coupon has been used in orders', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.order.count.mockResolvedValue(2);
      mockPrismaService.cart.count.mockResolvedValue(0);

      await expect(service.remove('summer2025')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('summer2025')).rejects.toThrow(
        'Cannot delete coupon that has been used in orders',
      );
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: { couponCode: 'SUMMER2025' },
      });
      expect(mockPrismaService.cart.count).toHaveBeenCalledWith({
        where: { couponId: 'SUMMER2025' },
      });
      expect(mockPrismaService.coupon.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when coupon is currently applied to carts', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(1);

      await expect(service.remove('summer2025')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('summer2025')).rejects.toThrow(
        'Cannot delete coupon currently applied to carts',
      );
      expect(mockPrismaService.coupon.delete).not.toHaveBeenCalled();
    });

    it('should delete coupon and return success message when not used in orders or carts', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);
      mockPrismaService.coupon.delete.mockResolvedValue(mockCoupon);

      const result = await service.remove('summer2025');

      expect(result).toEqual({ message: 'Coupon deleted successfully' });
      expect(mockPrismaService.coupon.delete).toHaveBeenCalledWith({
        where: { code: 'SUMMER2025' },
      });
    });

    it('should throw BadRequestException when prisma.coupon.delete throws P2003 foreign key error', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);
      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.delete.mockRejectedValue(p2003Error);

      await expect(service.remove('SUMMER2025')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('SUMMER2025')).rejects.toThrow(
        'Cannot delete coupon currently referenced by another record',
      );
    });

    it('should rethrow PrismaClientKnownRequestError when delete error code is not P2003', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.coupon.delete.mockRejectedValue(p2025Error);

      await expect(service.remove('SUMMER2025')).rejects.toThrow(p2025Error);
    });

    it('should rethrow unexpected non-Prisma error during delete', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.cart.count.mockResolvedValue(0);
      const unknownError = new Error('Database deletion failed');
      mockPrismaService.coupon.delete.mockRejectedValue(unknownError);

      await expect(service.remove('SUMMER2025')).rejects.toThrow(unknownError);
    });
  });

  describe('validateCoupon', () => {
    it('should return valid: false when coupon is not found in database', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await service.validateCoupon('UNKNOWN', 'user-1', 200000);

      expect(result).toEqual({
        valid: false,
        message: 'Coupon not found',
      });
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'UNKNOWN' },
      });
    });

    it('should return valid: false when coupon is restricted by referral rules and user is not allowed', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'SUMMER2025',
        refereeCouponCode: null,
        referrerId: 'user-different',
        refereeId: 'user-another',
      });

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message: 'Coupon not found',
      });
    });

    it('should return valid: false when coupon is inactive', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        active: false,
      });

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message: 'Coupon is inactive',
      });
    });

    it('should return valid: false when coupon validFrom is in the future', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validFrom: futureDate,
      });

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message: 'Coupon is not yet valid',
      });
    });

    it('should return valid: false when coupon validUntil is in the past', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validUntil: pastDate,
      });

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message: 'Coupon has expired',
      });
    });

    it('should return valid: false when coupon has reached maximum usage limit', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validFrom: null,
        validUntil: null,
        maxUses: 10,
        usedCount: 10,
      });

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message: 'Coupon has reached maximum usage limit',
      });
    });

    it('should return valid: false when user has reached maxUsesPerUser limit', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: 2,
      });
      mockPrismaService.order.count.mockResolvedValue(2);

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message:
          'You have already used this coupon the maximum number of times',
      });
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          couponCode: 'SUMMER2025',
          status: { not: OrderStatus.CANCELED },
        },
      });
    });

    it('should return valid: false when orderTotal is less than minOrder', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
        minOrder: 500000,
      });

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: false,
        message: `Minimum order amount is ${MoneyUtil.format(500000)}`,
      });
    });

    it('should return valid: true and calculate discount for PERCENT coupon without maxDiscount cap', async () => {
      const validCoupon = {
        ...mockCoupon,
        type: CouponType.PERCENT,
        value: 20,
        minOrder: 100000,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(validCoupon);

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon: validCoupon,
        discountAmount: 40000,
      });
    });

    it('should return valid: true and cap discount at maxDiscount for PERCENT coupon', async () => {
      const validCoupon = {
        ...mockCoupon,
        type: CouponType.PERCENT,
        value: 20,
        minOrder: 100000,
        maxDiscount: 30000,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(validCoupon);

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon: validCoupon,
        discountAmount: 30000,
      });
    });

    it('should return valid: true and calculate discount for FIXED coupon', async () => {
      const validCoupon = {
        ...mockCoupon,
        type: CouponType.FIXED,
        value: 50000,
        minOrder: 100000,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(validCoupon);

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon: validCoupon,
        discountAmount: 50000,
      });
    });

    it('should return valid: true and discount 0 for FREESHIP coupon', async () => {
      const validCoupon = {
        ...mockCoupon,
        type: CouponType.FREESHIP,
        value: 0,
        minOrder: 100000,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(validCoupon);

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        200000,
      );

      expect(result).toEqual({
        valid: true,
        message: 'Coupon is valid',
        coupon: validCoupon,
        discountAmount: 0,
      });
    });

    it('should allow usage when user has used coupon fewer times than maxUsesPerUser', async () => {
      const validCoupon = {
        ...mockCoupon,
        type: CouponType.PERCENT,
        value: 10,
        minOrder: null,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: 3,
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(validCoupon);
      mockPrismaService.order.count.mockResolvedValue(2);

      const result = await service.validateCoupon(
        'SUMMER2025',
        'user-1',
        100000,
      );

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(10000);
    });
  });

  describe('applyCoupon', () => {
    it('should throw BadRequestException when coupon validation fails', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.applyCoupon('UNKNOWN', 'user-1', 200000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.applyCoupon('UNKNOWN', 'user-1', 200000),
      ).rejects.toThrow('Coupon not found');
    });

    it('should throw BadRequestException with specific inactive message when coupon is inactive', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        active: false,
      });

      await expect(
        service.applyCoupon('SUMMER2025', 'user-1', 200000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.applyCoupon('SUMMER2025', 'user-1', 200000),
      ).rejects.toThrow('Coupon is inactive');
    });

    it('should return coupon and discountAmount when coupon is valid', async () => {
      const validCoupon = {
        ...mockCoupon,
        type: CouponType.PERCENT,
        value: 15,
        minOrder: null,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        maxUsesPerUser: null,
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(validCoupon);

      const result = await service.applyCoupon('SUMMER2025', 'user-1', 100000);

      expect(result).toEqual({
        coupon: validCoupon,
        discountAmount: 15000,
      });
    });
  });

  describe('incrementUsage', () => {
    it('should increment usedCount and return updated coupon with uppercase code', async () => {
      const updatedCoupon = {
        ...mockCoupon,
        usedCount: mockCoupon.usedCount + 1,
      };
      mockPrismaService.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await service.incrementUsage('summer2025');

      expect(result).toEqual(updatedCoupon);
      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SUMMER2025' },
        data: {
          usedCount: { increment: 1 },
        },
      });
    });
  });
});
