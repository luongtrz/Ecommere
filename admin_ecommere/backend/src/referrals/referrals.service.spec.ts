import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateReferralConfigDto } from './dtos/update-referral-config.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('ReferralsService', () => {
  let service: ReferralsService;

  const mockPrismaService = {
    referralConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    referral: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    coupon: {
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    const mockExistingConfig = {
      id: 'cfg-1',
      active: true,
      referrerCouponType: CouponType.PERCENT,
      referrerCouponValue: 15,
      referrerMaxDiscount: 50000,
      refereeCouponType: CouponType.PERCENT,
      refereeCouponValue: 10,
      refereeMaxDiscount: 20000,
      minOrderForCoupon: 100000,
      couponValidDays: 45,
      maxReferralsPerUser: 5,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    it('should return existing config when one is found in the database', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(
        mockExistingConfig,
      );

      const result = await service.getConfig();

      expect(result).toEqual(mockExistingConfig);
      expect(mockPrismaService.referralConfig.findFirst).toHaveBeenCalledTimes(
        1,
      );
      expect(mockPrismaService.referralConfig.findFirst).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
    });

    it('should create and return default config when no config exists', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);

      const mockCreatedConfig = {
        id: 'cfg-default',
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 10,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 5,
        couponValidDays: 30,
        referrerMaxDiscount: null,
        refereeMaxDiscount: null,
        minOrderForCoupon: null,
        maxReferralsPerUser: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockPrismaService.referralConfig.create.mockResolvedValue(
        mockCreatedConfig,
      );

      const result = await service.getConfig();

      expect(result).toEqual(mockCreatedConfig);
      expect(mockPrismaService.referralConfig.findFirst).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockPrismaService.referralConfig.create).toHaveBeenCalledWith({
        data: {
          active: true,
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 10,
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 5,
          couponValidDays: 30,
        },
      });
    });

    it('should propagate error if findFirst fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.referralConfig.findFirst.mockRejectedValue(dbError);

      await expect(service.getConfig()).rejects.toThrow(dbError);
      expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
    });

    it('should propagate error if create fails when creating default config', async () => {
      const dbError = new Error('Insert failed');
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.referralConfig.create.mockRejectedValue(dbError);

      await expect(service.getConfig()).rejects.toThrow(dbError);
    });
  });

  describe('updateConfig', () => {
    const mockExistingConfig = {
      id: 'cfg-1',
      active: true,
      referrerCouponType: CouponType.PERCENT,
      referrerCouponValue: 10,
      referrerMaxDiscount: 50000,
      refereeCouponType: CouponType.PERCENT,
      refereeCouponValue: 5,
      refereeMaxDiscount: 20000,
      minOrderForCoupon: 100000,
      couponValidDays: 30,
      maxReferralsPerUser: 10,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    describe('when no existing config exists (!existing branch)', () => {
      beforeEach(() => {
        mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      });

      it('should create new config with custom provided dto values', async () => {
        const dto: UpdateReferralConfigDto = {
          active: false,
          referrerCouponType: CouponType.FIXED,
          referrerCouponValue: 50000,
          referrerMaxDiscount: 100000,
          refereeCouponType: CouponType.FIXED,
          refereeCouponValue: 25000,
          refereeMaxDiscount: 50000,
          minOrderForCoupon: 200000,
          couponValidDays: 15,
          maxReferralsPerUser: 5,
        };

        const mockCreated = { id: 'cfg-new', ...dto };
        mockPrismaService.referralConfig.create.mockResolvedValue(mockCreated);

        const result = await service.updateConfig(dto);

        expect(result).toEqual(mockCreated);
        expect(mockPrismaService.referralConfig.create).toHaveBeenCalledWith({
          data: {
            active: false,
            referrerCouponType: CouponType.FIXED,
            referrerCouponValue: 50000,
            referrerMaxDiscount: 100000,
            refereeCouponType: CouponType.FIXED,
            refereeCouponValue: 25000,
            refereeMaxDiscount: 50000,
            minOrderForCoupon: 200000,
            couponValidDays: 15,
            maxReferralsPerUser: 5,
          },
        });
      });

      it('should create new config with fallback defaults when dto fields are undefined', async () => {
        const dto: UpdateReferralConfigDto = {};

        const mockCreated = {
          id: 'cfg-new-default',
          active: true,
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 10,
          referrerMaxDiscount: undefined,
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 5,
          refereeMaxDiscount: undefined,
          minOrderForCoupon: undefined,
          couponValidDays: 30,
          maxReferralsPerUser: undefined,
        };
        mockPrismaService.referralConfig.create.mockResolvedValue(mockCreated);

        const result = await service.updateConfig(dto);

        expect(result).toEqual(mockCreated);
        expect(mockPrismaService.referralConfig.create).toHaveBeenCalledWith({
          data: {
            active: true,
            referrerCouponType: CouponType.PERCENT,
            referrerCouponValue: 10,
            referrerMaxDiscount: undefined,
            refereeCouponType: CouponType.PERCENT,
            refereeCouponValue: 5,
            refereeMaxDiscount: undefined,
            minOrderForCoupon: undefined,
            couponValidDays: 30,
            maxReferralsPerUser: undefined,
          },
        });
      });

      it('should throw BadRequestException when referrerCouponValue is negative (< 0)', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponValue: -1,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when referrerCouponValue > 100 with PERCENT type', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponType: CouponType.PERCENT,
          referrerCouponValue: 101,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
      });

      it('should allow referrerCouponValue > 100 with FIXED type', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponType: CouponType.FIXED,
          referrerCouponValue: 50000,
          refereeCouponType: CouponType.FIXED,
          refereeCouponValue: 20000,
        };

        const mockCreated = { id: 'cfg-fixed', ...dto };
        mockPrismaService.referralConfig.create.mockResolvedValue(mockCreated);

        const result = await service.updateConfig(dto);
        expect(result).toEqual(mockCreated);
      });

      it('should throw BadRequestException when couponValidDays < 1 on referrer validation', async () => {
        const dto: UpdateReferralConfigDto = {
          couponValidDays: 0,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Referral coupon validity must be at least one day',
        );
        expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when refereeCouponValue is negative (< 0)', async () => {
        const dto: UpdateReferralConfigDto = {
          refereeCouponValue: -5,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when refereeCouponValue > 100 with PERCENT type', async () => {
        const dto: UpdateReferralConfigDto = {
          refereeCouponType: CouponType.PERCENT,
          refereeCouponValue: 150,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.create).not.toHaveBeenCalled();
      });

      it('should propagate database error when create fails', async () => {
        const dbError = new Error('Database insert failed');
        mockPrismaService.referralConfig.create.mockRejectedValue(dbError);

        await expect(service.updateConfig({})).rejects.toThrow(dbError);
      });
    });

    describe('when existing config exists (update branch)', () => {
      beforeEach(() => {
        mockPrismaService.referralConfig.findFirst.mockResolvedValue(
          mockExistingConfig,
        );
      });

      it('should update existing config using provided dto fields', async () => {
        const dto: UpdateReferralConfigDto = {
          active: false,
          referrerCouponType: CouponType.FIXED,
          referrerCouponValue: 60000,
          refereeCouponType: CouponType.FIXED,
          refereeCouponValue: 30000,
          couponValidDays: 14,
        };

        const mockUpdated = { ...mockExistingConfig, ...dto };
        mockPrismaService.referralConfig.update.mockResolvedValue(mockUpdated);

        const result = await service.updateConfig(dto);

        expect(result).toEqual(mockUpdated);
        expect(mockPrismaService.referralConfig.update).toHaveBeenCalledWith({
          where: { id: mockExistingConfig.id },
          data: dto,
        });
      });

      it('should use existing config values as fallback for effective validation when dto fields are omitted', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponValue: 20,
        };

        const mockUpdated = { ...mockExistingConfig, referrerCouponValue: 20 };
        mockPrismaService.referralConfig.update.mockResolvedValue(mockUpdated);

        const result = await service.updateConfig(dto);

        expect(result).toEqual(mockUpdated);
        expect(mockPrismaService.referralConfig.update).toHaveBeenCalledWith({
          where: { id: mockExistingConfig.id },
          data: dto,
        });
      });

      it('should throw BadRequestException when effective referrer coupon value < 0', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponValue: -10,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.update).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when effective referrer coupon value > 100 with PERCENT', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponValue: 120,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.update).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when effective referee coupon value < 0', async () => {
        const dto: UpdateReferralConfigDto = {
          refereeCouponValue: -1,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.update).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when effective referee coupon value > 100 with PERCENT', async () => {
        const dto: UpdateReferralConfigDto = {
          refereeCouponValue: 105,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Invalid referral coupon value',
        );
        expect(mockPrismaService.referralConfig.update).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when effective couponValidDays < 1', async () => {
        const dto: UpdateReferralConfigDto = {
          couponValidDays: -2,
        };

        await expect(service.updateConfig(dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.updateConfig(dto)).rejects.toThrow(
          'Referral coupon validity must be at least one day',
        );
        expect(mockPrismaService.referralConfig.update).not.toHaveBeenCalled();
      });

      it('should allow coupon value > 100 when effective type is FIXED', async () => {
        const dto: UpdateReferralConfigDto = {
          referrerCouponType: CouponType.FIXED,
          referrerCouponValue: 200000,
          refereeCouponType: CouponType.FIXED,
          refereeCouponValue: 50000,
        };

        const mockUpdated = { ...mockExistingConfig, ...dto };
        mockPrismaService.referralConfig.update.mockResolvedValue(mockUpdated);

        const result = await service.updateConfig(dto);

        expect(result).toEqual(mockUpdated);
        expect(mockPrismaService.referralConfig.update).toHaveBeenCalledWith({
          where: { id: mockExistingConfig.id },
          data: dto,
        });
      });

      it('should propagate database error when update fails', async () => {
        const dbError = new Error('Database update failed');
        mockPrismaService.referralConfig.update.mockRejectedValue(dbError);

        await expect(service.updateConfig({ active: false })).rejects.toThrow(
          dbError,
        );
      });
    });

    it('should propagate error when findFirst fails in updateConfig', async () => {
      const dbError = new Error('Database findFirst failed');
      mockPrismaService.referralConfig.findFirst.mockRejectedValue(dbError);

      await expect(service.updateConfig({})).rejects.toThrow(dbError);
    });
  });

  describe('validateCouponConfig (internal validation logic)', () => {
    it('should accept 0% for PERCENT type with valid days', () => {
      expect(() => {
        (service as any).validateCouponConfig(CouponType.PERCENT, 0, 1);
      }).not.toThrow();
    });

    it('should accept 100% for PERCENT type with valid days', () => {
      expect(() => {
        (service as any).validateCouponConfig(CouponType.PERCENT, 100, 30);
      }).not.toThrow();
    });

    it('should throw when value is negative for FREESHIP type', () => {
      expect(() => {
        (service as any).validateCouponConfig(CouponType.FREESHIP, -1, 30);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateCouponConfig(CouponType.FREESHIP, -1, 30);
      }).toThrow('Invalid referral coupon value');
    });

    it('should allow FREESHIP type with value > 100', () => {
      expect(() => {
        (service as any).validateCouponConfig(CouponType.FREESHIP, 15000, 30);
      }).not.toThrow();
    });

    it('should throw when validDays is 0', () => {
      expect(() => {
        (service as any).validateCouponConfig(CouponType.PERCENT, 10, 0);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateCouponConfig(CouponType.PERCENT, 10, 0);
      }).toThrow('Referral coupon validity must be at least one day');
    });

    it('should throw when validDays is negative', () => {
      expect(() => {
        (service as any).validateCouponConfig(CouponType.PERCENT, 10, -10);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateCouponConfig(CouponType.PERCENT, 10, -10);
      }).toThrow('Referral coupon validity must be at least one day');
    });
  });

  describe('getStats', () => {
    const mockTopReferrersGroup = [
      { referrerId: 'user-1', _count: { id: 8 } },
      { referrerId: 'user-2', _count: { id: 3 } },
    ];

    const mockUser1 = {
      id: 'user-1',
      name: 'User One',
      email: 'user1@example.com',
      referralCode: 'REF-USER1',
    };

    const mockUser2 = {
      id: 'user-2',
      name: 'User Two',
      email: 'user2@example.com',
      referralCode: 'REF-USER2',
    };

    it('should return complete stats with isActive=true when active config exists', async () => {
      mockPrismaService.referral.count.mockResolvedValue(25);
      mockPrismaService.coupon.count.mockResolvedValue(10);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        id: 'cfg-active',
        active: true,
      });
      mockPrismaService.referral.groupBy.mockResolvedValue(
        mockTopReferrersGroup,
      );
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      const result = await service.getStats();

      expect(result).toEqual({
        totalReferrals: 25,
        totalCouponsCreated: 10,
        isActive: true,
        topReferrers: [
          { user: mockUser1, referralCount: 8 },
          { user: mockUser2, referralCount: 3 },
        ],
      });

      expect(mockPrismaService.referral.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.coupon.count).toHaveBeenCalledWith({
        where: {
          code: { startsWith: 'REF-' },
        },
      });
      expect(mockPrismaService.referralConfig.findFirst).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockPrismaService.referral.groupBy).toHaveBeenCalledWith({
        by: ['referrerId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, name: true, email: true, referralCode: true },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        select: { id: true, name: true, email: true, referralCode: true },
      });
    });

    it('should return isActive=false when no active config is found (activeConfig is null)', async () => {
      mockPrismaService.referral.count.mockResolvedValue(0);
      mockPrismaService.coupon.count.mockResolvedValue(0);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.referral.groupBy.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.isActive).toBe(false);
      expect(result.totalReferrals).toBe(0);
      expect(result.totalCouponsCreated).toBe(0);
      expect(result.topReferrers).toEqual([]);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return isActive=false when activeConfig has active: false', async () => {
      mockPrismaService.referral.count.mockResolvedValue(5);
      mockPrismaService.coupon.count.mockResolvedValue(2);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        id: 'cfg-inactive',
        active: false,
      });
      mockPrismaService.referral.groupBy.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.isActive).toBe(false);
    });

    it('should return user: null when user is not found in database for a top referrer', async () => {
      mockPrismaService.referral.count.mockResolvedValue(1);
      mockPrismaService.coupon.count.mockResolvedValue(1);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        id: 'cfg-1',
        active: true,
      });
      mockPrismaService.referral.groupBy.mockResolvedValue([
        { referrerId: 'deleted-user', _count: { id: 5 } },
      ]);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getStats();

      expect(result.topReferrers).toEqual([{ user: null, referralCount: 5 }]);
    });

    it('should propagate error if referral.count fails', async () => {
      const dbError = new Error('Referral count failed');
      mockPrismaService.referral.count.mockRejectedValue(dbError);
      mockPrismaService.coupon.count.mockResolvedValue(0);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.referral.groupBy.mockResolvedValue([]);

      await expect(service.getStats()).rejects.toThrow(dbError);
    });

    it('should propagate error if coupon.count fails', async () => {
      const dbError = new Error('Coupon count failed');
      mockPrismaService.referral.count.mockResolvedValue(0);
      mockPrismaService.coupon.count.mockRejectedValue(dbError);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.referral.groupBy.mockResolvedValue([]);

      await expect(service.getStats()).rejects.toThrow(dbError);
    });

    it('should propagate error if referralConfig.findFirst fails', async () => {
      const dbError = new Error('Config lookup failed');
      mockPrismaService.referral.count.mockResolvedValue(0);
      mockPrismaService.coupon.count.mockResolvedValue(0);
      mockPrismaService.referralConfig.findFirst.mockRejectedValue(dbError);
      mockPrismaService.referral.groupBy.mockResolvedValue([]);

      await expect(service.getStats()).rejects.toThrow(dbError);
    });

    it('should propagate error if referral.groupBy fails', async () => {
      const dbError = new Error('GroupBy failed');
      mockPrismaService.referral.count.mockResolvedValue(0);
      mockPrismaService.coupon.count.mockResolvedValue(0);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.referral.groupBy.mockRejectedValue(dbError);

      await expect(service.getStats()).rejects.toThrow(dbError);
    });

    it('should propagate error if user.findUnique fails', async () => {
      const dbError = new Error('User findUnique failed');
      mockPrismaService.referral.count.mockResolvedValue(1);
      mockPrismaService.coupon.count.mockResolvedValue(1);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.referral.groupBy.mockResolvedValue([
        { referrerId: 'user-1', _count: { id: 2 } },
      ]);
      mockPrismaService.user.findUnique.mockRejectedValue(dbError);

      await expect(service.getStats()).rejects.toThrow(dbError);
    });
  });

  describe('getAllReferrals', () => {
    const mockReferralsList = [
      {
        id: 'ref-1',
        referrerId: 'user-1',
        refereeId: 'user-2',
        referrer: {
          id: 'user-1',
          name: 'Referrer Name',
          email: 'referrer@example.com',
          referralCode: 'REF-111',
        },
        referee: {
          id: 'user-2',
          name: 'Referee Name',
          email: 'referee@example.com',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ];

    it('should return paginated referrals with default page=1 and limit=20 when paginationDto is empty', async () => {
      mockPrismaService.referral.findMany.mockResolvedValue(mockReferralsList);
      mockPrismaService.referral.count.mockResolvedValue(1);

      const result = await service.getAllReferrals({});

      expect(result).toEqual({
        data: mockReferralsList,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(mockPrismaService.referral.findMany).toHaveBeenCalledWith({
        include: {
          referrer: {
            select: { id: true, name: true, email: true, referralCode: true },
          },
          referee: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.referral.count).toHaveBeenCalledTimes(1);
    });

    it('should paginate correctly on a middle page with hasNextPage=true and hasPreviousPage=true', async () => {
      mockPrismaService.referral.findMany.mockResolvedValue(mockReferralsList);
      mockPrismaService.referral.count.mockResolvedValue(55);

      const paginationDto: PaginationDto = { page: 2, limit: 10 };
      const result = await service.getAllReferrals(paginationDto);

      expect(result).toEqual({
        data: mockReferralsList,
        total: 55,
        page: 2,
        limit: 10,
        totalPages: 6,
        hasNextPage: true,
        hasPreviousPage: true,
      });

      expect(mockPrismaService.referral.findMany).toHaveBeenCalledWith({
        include: {
          referrer: {
            select: { id: true, name: true, email: true, referralCode: true },
          },
          referee: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should calculate hasNextPage=false and hasPreviousPage=true on the last page', async () => {
      mockPrismaService.referral.findMany.mockResolvedValue(mockReferralsList);
      mockPrismaService.referral.count.mockResolvedValue(20);

      const paginationDto: PaginationDto = { page: 2, limit: 10 };
      const result = await service.getAllReferrals(paginationDto);

      expect(result).toEqual({
        data: mockReferralsList,
        total: 20,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle zero results with totalPages=0, hasNextPage=false, hasPreviousPage=false', async () => {
      mockPrismaService.referral.findMany.mockResolvedValue([]);
      mockPrismaService.referral.count.mockResolvedValue(0);

      const paginationDto: PaginationDto = { page: 1, limit: 20 };
      const result = await service.getAllReferrals(paginationDto);

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

    it('should propagate error if referral.findMany fails', async () => {
      const dbError = new Error('findMany failed');
      mockPrismaService.referral.findMany.mockRejectedValue(dbError);
      mockPrismaService.referral.count.mockResolvedValue(0);

      await expect(service.getAllReferrals({})).rejects.toThrow(dbError);
    });

    it('should propagate error if referral.count fails', async () => {
      const dbError = new Error('count failed');
      mockPrismaService.referral.findMany.mockResolvedValue([]);
      mockPrismaService.referral.count.mockRejectedValue(dbError);

      await expect(service.getAllReferrals({})).rejects.toThrow(dbError);
    });
  });
});
