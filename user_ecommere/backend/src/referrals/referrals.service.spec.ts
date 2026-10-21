import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CouponType, OrderStatus, Prisma } from '@prisma/client';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ReferralsService', () => {
  let service: ReferralsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    referral: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    referralConfig: {
      findFirst: jest.fn(),
    },
    coupon: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof mockPrismaService) => Promise<any>) => {
        if (typeof callback === 'function') {
          return callback(mockPrismaService);
        }
        return callback;
      },
    );

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

  describe('getMyReferralInfo', () => {
    it('should throw BadRequestException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyReferralInfo('user-not-found')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getMyReferralInfo('user-not-found')).rejects.toThrow(
        'User not found',
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-not-found' },
        select: {
          id: true,
          referralCode: true,
          referredById: true,
        },
      });
    });

    it('should return referral info when user already has a referral code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        referralCode: 'REF-EXISTING',
        referredById: null,
      });
      mockPrismaService.referral.count.mockResolvedValue(3);
      mockPrismaService.referral.findMany.mockResolvedValue([
        { referrerCouponCode: 'COUPON-1' },
        { referrerCouponCode: null },
        { referrerCouponCode: 'COUPON-2' },
        { referrerCouponCode: '' },
      ]);

      const result = await service.getMyReferralInfo('user-1');

      expect(result).toEqual({
        referralCode: 'REF-EXISTING',
        totalReferrals: 3,
        totalCouponsEarned: 2,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          referralCode: true,
          referredById: true,
        },
      });
      expect(mockPrismaService.referral.count).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
      });
      expect(mockPrismaService.referral.findMany).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
        select: { referrerCouponCode: true },
      });
    });

    it('should generate a referral code if user does not have one', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-2',
          referralCode: null,
          referredById: null,
        })
        .mockResolvedValueOnce({
          referralCode: null,
        });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.referral.count.mockResolvedValue(0);
      mockPrismaService.referral.findMany.mockResolvedValue([]);

      const result = await service.getMyReferralInfo('user-2');

      expect(result.referralCode).toMatch(/^REF-[0-9A-F]{8}$/);
      expect(result.totalReferrals).toBe(0);
      expect(result.totalCouponsEarned).toBe(0);
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-2', referralCode: null },
        data: { referralCode: result.referralCode },
      });
    });
  });

  describe('getMyReferrals', () => {
    it('should return paginated referrals with default page (1) and limit (20)', async () => {
      mockPrismaService.referral.findMany.mockResolvedValue([]);
      mockPrismaService.referral.count.mockResolvedValue(0);

      const result = await service.getMyReferrals('user-1', {});

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      expect(mockPrismaService.referral.findMany).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
        include: {
          referee: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.referral.count).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
      });
    });

    it('should return paginated referrals with custom pagination and formatted referee name and email', async () => {
      const createdAt = new Date('2026-03-01T08:00:00.000Z');
      const mockReferrals = [
        {
          id: 'ref-1',
          referrerCouponCode: 'REF-COUPON-1',
          createdAt,
          referee: {
            id: 'referee-1',
            name: 'Nguyen Van A',
            email: 'nguyen.a@example.com',
            createdAt,
          },
        },
      ];
      mockPrismaService.referral.findMany.mockResolvedValue(mockReferrals);
      mockPrismaService.referral.count.mockResolvedValue(25);

      const result = await service.getMyReferrals('user-1', {
        page: 2,
        limit: 10,
      });

      expect(result).toEqual({
        data: [
          {
            id: 'ref-1',
            refereeName: 'Nguyen Van A',
            refereeEmail: 'n***@example.com',
            couponCode: 'REF-COUPON-1',
            createdAt,
          },
        ],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
      expect(mockPrismaService.referral.findMany).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
        include: {
          referee: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should fall back to masked email when referee name is missing and handle edge cases of maskEmail', async () => {
      const createdAt = new Date('2026-03-01T08:00:00.000Z');
      const mockReferrals = [
        {
          id: 'ref-1',
          referrerCouponCode: null,
          createdAt,
          referee: {
            id: 'referee-1',
            name: null,
            email: 'alice@domain.com',
            createdAt,
          },
        },
        {
          id: 'ref-2',
          referrerCouponCode: null,
          createdAt,
          referee: {
            id: 'referee-2',
            name: '',
            email: 'plainemailwithoutat',
            createdAt,
          },
        },
        {
          id: 'ref-3',
          referrerCouponCode: null,
          createdAt,
          referee: {
            id: 'referee-3',
            name: null,
            email: '@domainwithleadingat.com',
            createdAt,
          },
        },
        {
          id: 'ref-4',
          referrerCouponCode: null,
          createdAt,
          referee: {
            id: 'referee-4',
            name: null,
            email: null,
            createdAt,
          },
        },
        {
          id: 'ref-5',
          referrerCouponCode: null,
          createdAt,
          referee: {
            id: 'referee-5',
            name: null,
            email: undefined,
            createdAt,
          },
        },
      ];
      mockPrismaService.referral.findMany.mockResolvedValue(mockReferrals);
      mockPrismaService.referral.count.mockResolvedValue(5);

      const result = await service.getMyReferrals('user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([
        {
          id: 'ref-1',
          refereeName: 'a***@domain.com',
          refereeEmail: 'a***@domain.com',
          couponCode: null,
          createdAt,
        },
        {
          id: 'ref-2',
          refereeName: '***',
          refereeEmail: '***',
          couponCode: null,
          createdAt,
        },
        {
          id: 'ref-3',
          refereeName: '***',
          refereeEmail: '***',
          couponCode: null,
          createdAt,
        },
        {
          id: 'ref-4',
          refereeName: null,
          refereeEmail: null,
          couponCode: null,
          createdAt,
        },
        {
          id: 'ref-5',
          refereeName: undefined,
          refereeEmail: undefined,
          couponCode: null,
          createdAt,
        },
      ]);
    });
  });

  describe('getMyCouponsFromReferral', () => {
    it('should return empty data array when user has no referral records', async () => {
      mockPrismaService.referral.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getMyCouponsFromReferral('user-1');

      expect(result).toEqual({ data: [] });
      expect(mockPrismaService.referral.findMany).toHaveBeenNthCalledWith(1, {
        where: { referrerId: 'user-1' },
        select: { referrerCouponCode: true },
      });
      expect(mockPrismaService.referral.findMany).toHaveBeenNthCalledWith(2, {
        where: { refereeId: 'user-1' },
        select: { refereeCouponCode: true },
      });
      expect(mockPrismaService.coupon.findMany).not.toHaveBeenCalled();
    });

    it('should return empty data array when referral records contain only null or falsy coupon codes', async () => {
      mockPrismaService.referral.findMany
        .mockResolvedValueOnce([{ referrerCouponCode: null }])
        .mockResolvedValueOnce([
          { refereeCouponCode: null },
          { refereeCouponCode: '' },
        ]);

      const result = await service.getMyCouponsFromReferral('user-1');

      expect(result).toEqual({ data: [] });
      expect(mockPrismaService.coupon.findMany).not.toHaveBeenCalled();
    });

    it('should fetch deduplicated coupons when codes are found from both referrer and referee records', async () => {
      mockPrismaService.referral.findMany
        .mockResolvedValueOnce([
          { referrerCouponCode: 'COUPON-A' },
          { referrerCouponCode: 'COUPON-B' },
          { referrerCouponCode: null },
        ])
        .mockResolvedValueOnce([
          { refereeCouponCode: 'COUPON-B' },
          { refereeCouponCode: 'COUPON-C' },
        ]);

      const mockCoupons = [
        {
          code: 'COUPON-C',
          type: CouponType.PERCENT,
          value: 10,
          createdAt: new Date('2026-03-03'),
        },
        {
          code: 'COUPON-B',
          type: CouponType.FIXED,
          value: 50000,
          createdAt: new Date('2026-03-02'),
        },
        {
          code: 'COUPON-A',
          type: CouponType.PERCENT,
          value: 15,
          createdAt: new Date('2026-03-01'),
        },
      ];
      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);

      const result = await service.getMyCouponsFromReferral('user-1');

      expect(result).toEqual({ data: mockCoupons });
      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        where: {
          code: { in: ['COUPON-A', 'COUPON-B', 'COUPON-C'] },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('processReferral', () => {
    it('should return null when referralCode is empty string', async () => {
      const result = await service.processReferral('', 'new-user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should return null when referralCode contains only whitespace', async () => {
      const result = await service.processReferral('   ', 'new-user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should return null when referrer is not found for the given code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.processReferral('REF-UNKNOWN', 'new-user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { referralCode: 'REF-UNKNOWN' },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });

    it('should return null when self-referring (referrer.id === newUserId)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'new-user-1',
        referralCode: 'REF-SELF',
      });

      const result = await service.processReferral('ref-self', 'new-user-1');

      expect(result).toBeNull();
    });

    it('should return null when referee already has an existing referral', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'existing-ref',
        refereeId: 'new-user-1',
      });

      const result = await service.processReferral('REF-VALID', 'new-user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.referral.findUnique).toHaveBeenCalledWith({
        where: { refereeId: 'new-user-1' },
      });
    });

    it('should return null when no active referral configuration is found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);

      const result = await service.processReferral('REF-VALID', 'new-user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.referralConfig.findFirst).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return null when referrer has reached maxReferralsPerUser limit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        maxReferralsPerUser: 5,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 10,
        couponValidDays: 30,
      });
      mockPrismaService.referral.count.mockResolvedValue(5);

      const result = await service.processReferral('REF-VALID', 'new-user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.referral.count).toHaveBeenCalledWith({
        where: { referrerId: 'referrer-1' },
      });
    });

    it('should throw BadRequestException when referee coupon value is negative', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        maxReferralsPerUser: 5,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: -5,
        couponValidDays: 30,
      });
      mockPrismaService.referral.count.mockResolvedValue(2);

      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow('Invalid referral coupon value');
    });

    it('should throw BadRequestException when referee coupon percentage value exceeds 100', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        maxReferralsPerUser: null,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 105,
        couponValidDays: 30,
      });

      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow('Invalid referral coupon value');
    });

    it('should throw BadRequestException when couponValidDays is less than 1', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        maxReferralsPerUser: null,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 10,
        couponValidDays: 0,
      });

      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow('Referral coupon validity must be at least one day');
    });

    it('should create coupon, referral, update user and succeed when referrer is under limit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        email: 'referrer@example.com',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        maxReferralsPerUser: 10,
        refereeCouponType: CouponType.FIXED,
        refereeCouponValue: 50000,
        refereeMaxDiscount: null,
        minOrderForCoupon: 150000,
        couponValidDays: 14,
      });
      mockPrismaService.referral.count.mockResolvedValue(3);

      const mockCreatedReferral = {
        id: 'ref-created-1',
        referrerId: 'referrer-1',
        refereeId: 'new-user-1',
        referrerCouponCode: null,
        refereeCouponCode: 'REF-EE-MOCKCODE',
      };
      mockPrismaService.coupon.create.mockResolvedValue({});
      mockPrismaService.referral.create.mockResolvedValue(mockCreatedReferral);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.processReferral(
        '  ref-valid  ',
        'new-user-1',
      );

      expect(result).toEqual(mockCreatedReferral);
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          code: expect.stringMatching(/^REF-EE-[0-9A-F]{16}$/),
          type: CouponType.FIXED,
          value: 50000,
          maxDiscount: null,
          minOrder: 150000,
          validFrom: expect.any(Date),
          validUntil: expect.any(Date),
          maxUses: 1,
          maxUsesPerUser: 1,
          active: true,
        },
      });
      expect(mockPrismaService.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'referrer-1',
          refereeId: 'new-user-1',
          referrerCouponCode: null,
          refereeCouponCode: expect.stringMatching(/^REF-EE-[0-9A-F]{16}$/),
        },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'new-user-1' },
        data: { referredById: 'referrer-1' },
      });
    });

    it('should succeed when maxReferralsPerUser is null (no count check needed)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        email: 'referrer@example.com',
        referralCode: 'REF-VALID',
      });
      mockPrismaService.referral.findUnique.mockResolvedValue(null);
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        maxReferralsPerUser: null,
        refereeCouponType: CouponType.PERCENT,
        refereeCouponValue: 10,
        refereeMaxDiscount: 20000,
        minOrderForCoupon: null,
        couponValidDays: 30,
      });

      const mockCreatedReferral = {
        id: 'ref-created-2',
        referrerId: 'referrer-1',
        refereeId: 'new-user-2',
        referrerCouponCode: null,
        refereeCouponCode: 'REF-EE-MOCK2',
      };
      mockPrismaService.coupon.create.mockResolvedValue({});
      mockPrismaService.referral.create.mockResolvedValue(mockCreatedReferral);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.processReferral('REF-VALID', 'new-user-2');

      expect(result).toEqual(mockCreatedReferral);
      expect(mockPrismaService.referral.count).not.toHaveBeenCalled();
    });

    it('should retry on serialization conflict (P2034) and succeed on next attempt', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Serialization conflict',
        { code: 'P2034', clientVersion: '5.8.0' },
      );
      const mockCreatedReferral = {
        id: 'ref-created-retry',
        referrerId: 'referrer-1',
        refereeId: 'new-user-1',
        referrerCouponCode: null,
        refereeCouponCode: 'REF-EE-RETRY',
      };

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2034Error)
        .mockResolvedValueOnce(mockCreatedReferral);

      const result = await service.processReferral('REF-VALID', 'new-user-1');

      expect(result).toEqual(mockCreatedReferral);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should rethrow after exhausting 3 attempts on serialization conflict (P2034)', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Serialization conflict',
        { code: 'P2034', clientVersion: '5.8.0' },
      );

      mockPrismaService.$transaction.mockRejectedValue(p2034Error);

      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow(p2034Error);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should immediately rethrow non-serialization errors without retrying', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.$transaction.mockRejectedValue(dbError);

      await expect(
        service.processReferral('REF-VALID', 'new-user-1'),
      ).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateReferralCode', () => {
    it('should throw BadRequestException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.generateReferralCode('user-unknown'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.generateReferralCode('user-unknown'),
      ).rejects.toThrow('User not found');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-unknown' },
        select: { referralCode: true },
      });
    });

    it('should return existing referralCode without updating if user already has one', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: 'REF-ALREADY-SET',
      });

      const result = await service.generateReferralCode('user-1');

      expect(result).toBe('REF-ALREADY-SET');
      expect(mockPrismaService.user.updateMany).not.toHaveBeenCalled();
    });

    it('should assign and return code when updateMany succeeds with count 1', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        referralCode: null,
      });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.generateReferralCode('user-1');

      expect(result).toMatch(/^REF-[0-9A-F]{8}$/);
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1', referralCode: null },
        data: { referralCode: result },
      });
    });

    it('should return referralCode from concurrent assignment if updateMany count is 0 and findUnique finds code', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ referralCode: null })
        .mockResolvedValueOnce({ referralCode: 'REF-FROM-OTHER-PROCESS' });
      mockPrismaService.user.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.generateReferralCode('user-1');

      expect(result).toBe('REF-FROM-OTHER-PROCESS');
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should retry when updateMany count is 0 and updatedUser still has no code, succeeding on attempt 2', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ referralCode: null })
        .mockResolvedValueOnce({ referralCode: null });
      mockPrismaService.user.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.generateReferralCode('user-1');

      expect(result).toMatch(/^REF-[0-9A-F]{8}$/);
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should catch P2002 unique constraint conflict and succeed on next attempt', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        referralCode: null,
      });
      mockPrismaService.user.updateMany
        .mockRejectedValueOnce(p2002Error)
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.generateReferralCode('user-1');

      expect(result).toMatch(/^REF-[0-9A-F]{8}$/);
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should immediately rethrow non-P2002 Prisma errors', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        referralCode: null,
      });
      mockPrismaService.user.updateMany.mockRejectedValue(p2025Error);

      await expect(service.generateReferralCode('user-1')).rejects.toThrow(
        p2025Error,
      );
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should immediately rethrow generic errors', async () => {
      const genericError = new Error('Database server crashed');
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        referralCode: null,
      });
      mockPrismaService.user.updateMany.mockRejectedValue(genericError);

      await expect(service.generateReferralCode('user-1')).rejects.toThrow(
        'Database server crashed',
      );
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when 10 attempts are exhausted without success', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: null,
      });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.generateReferralCode('user-1')).rejects.toThrow(
        new BadRequestException('Unable to generate referral code'),
      );
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledTimes(10);
    });
  });

  describe('grantReferrerRewards', () => {
    it('should return 0 counts when no active referral configuration exists', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue(null);

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 0,
        processed: 0,
        skipped: 0,
        errors: 0,
      });
      expect(mockPrismaService.referralConfig.findFirst).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockPrismaService.referral.findMany).not.toHaveBeenCalled();
    });

    it('should return errors: 1 and skip evaluation when referrer coupon config is invalid', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: -1,
        couponValidDays: 30,
      });

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 0,
        processed: 0,
        skipped: 0,
        errors: 1,
      });
      expect(mockPrismaService.referral.findMany).not.toHaveBeenCalled();
    });

    it('should return evaluated: 0 when no eligible referrals are found', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 10,
        referrerMaxDiscount: 50000,
        minOrderForCoupon: 100000,
        couponValidDays: 30,
      });
      mockPrismaService.referral.findMany.mockResolvedValue([]);

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 0,
        processed: 0,
        skipped: 0,
        errors: 0,
      });
      expect(mockPrismaService.referral.findMany).toHaveBeenCalledWith({
        where: {
          referrerCouponCode: null,
          referee: {
            orders: {
              some: {
                status: OrderStatus.DELIVERED,
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should process eligible referrals and grant referrer rewards', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 15,
        referrerMaxDiscount: 50000,
        minOrderForCoupon: 100000,
        couponValidDays: 30,
      });
      mockPrismaService.referral.findMany.mockResolvedValue([
        { id: 'ref-1', referrerCouponCode: null },
        { id: 'ref-2', referrerCouponCode: null },
      ]);
      mockPrismaService.referral.findUnique.mockResolvedValue({
        referrerCouponCode: null,
      });
      mockPrismaService.coupon.create.mockResolvedValue({});
      mockPrismaService.referral.update.mockResolvedValue({});

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 2,
        processed: 2,
        skipped: 0,
        errors: 0,
      });
      expect(mockPrismaService.coupon.create).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          code: expect.stringMatching(/^REF-ER-[0-9A-F]{16}$/),
          type: CouponType.PERCENT,
          value: 15,
          maxDiscount: 50000,
          minOrder: 100000,
          validFrom: expect.any(Date),
          validUntil: expect.any(Date),
          maxUses: 1,
          maxUsesPerUser: 1,
          active: true,
        },
      });
      expect(mockPrismaService.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: {
          referrerCouponCode: expect.stringMatching(/^REF-ER-[0-9A-F]{16}$/),
        },
      });
      expect(mockPrismaService.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-2' },
        data: {
          referrerCouponCode: expect.stringMatching(/^REF-ER-[0-9A-F]{16}$/),
        },
      });
    });

    it('should skip referral in pre-check if referral.referrerCouponCode is already populated', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 10,
        couponValidDays: 30,
      });
      mockPrismaService.referral.findMany.mockResolvedValue([
        { id: 'ref-1', referrerCouponCode: 'ALREADY-HAS-CODE' },
      ]);

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 1,
        processed: 0,
        skipped: 1,
        errors: 0,
      });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should skip referral if current record inside transaction already has referrerCouponCode', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 10,
        couponValidDays: 30,
      });
      mockPrismaService.referral.findMany.mockResolvedValue([
        { id: 'ref-1', referrerCouponCode: null },
      ]);
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'ref-1',
        referrerCouponCode: 'CONCURRENTLY-SET-CODE',
      });

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 1,
        processed: 0,
        skipped: 1,
        errors: 0,
      });
      expect(mockPrismaService.coupon.create).not.toHaveBeenCalled();
      expect(mockPrismaService.referral.update).not.toHaveBeenCalled();
    });

    it('should increment errors and continue processing when a referral transaction throws', async () => {
      mockPrismaService.referralConfig.findFirst.mockResolvedValue({
        active: true,
        referrerCouponType: CouponType.PERCENT,
        referrerCouponValue: 10,
        couponValidDays: 30,
      });
      mockPrismaService.referral.findMany.mockResolvedValue([
        { id: 'ref-err-error-instance', referrerCouponCode: null },
        { id: 'ref-err-string', referrerCouponCode: null },
        { id: 'ref-success', referrerCouponCode: null },
      ]);

      mockPrismaService.$transaction
        .mockRejectedValueOnce(
          new Error('Transaction failed with Error instance'),
        )
        .mockRejectedValueOnce('Transaction rejected with string')
        .mockImplementationOnce(
          async (callback: (tx: typeof mockPrismaService) => Promise<any>) =>
            callback(mockPrismaService),
        );
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'ref-success',
        referrerCouponCode: null,
      });
      mockPrismaService.coupon.create.mockResolvedValue({});
      mockPrismaService.referral.update.mockResolvedValue({});

      const result = await service.grantReferrerRewards();

      expect(result).toEqual({
        evaluated: 3,
        processed: 1,
        skipped: 0,
        errors: 2,
      });
      expect(mockPrismaService.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-success' },
        data: {
          referrerCouponCode: expect.stringMatching(/^REF-ER-[0-9A-F]{16}$/),
        },
      });
    });
  });
});
