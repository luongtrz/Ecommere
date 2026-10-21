import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('ReferralsController', () => {
  let controller: ReferralsController;
  let mockReferralsService: {
    getMyReferralInfo: jest.Mock;
    getMyReferrals: jest.Mock;
    getMyCouponsFromReferral: jest.Mock;
  };

  const mockCanActivate = jest.fn(() => true);

  beforeEach(async () => {
    mockReferralsService = {
      getMyReferralInfo: jest.fn(),
      getMyReferrals: jest.fn(),
      getMyCouponsFromReferral: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralsController],
      providers: [
        {
          provide: ReferralsService,
          useValue: mockReferralsService,
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

    controller = module.get<ReferralsController>(ReferralsController);
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

  describe('Route 1: GET /referrals/me - getMyReferralInfo', () => {
    const userId = 'user-test-123';
    const mockReferralInfo = {
      referralCode: 'REF-TEST1234',
      totalReferrals: 3,
      totalCouponsEarned: 2,
    };

    it('delegates to referralsService.getMyReferralInfo with the authenticated user id and returns service result', async () => {
      mockReferralsService.getMyReferralInfo.mockResolvedValue(mockReferralInfo);

      const result = await controller.getMyReferralInfo(userId);

      expect(mockReferralsService.getMyReferralInfo).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getMyReferralInfo).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockReferralInfo);
    });

    it('propagates exceptions thrown by referralsService.getMyReferralInfo', async () => {
      mockReferralsService.getMyReferralInfo.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      await expect(controller.getMyReferralInfo(userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockReferralsService.getMyReferralInfo).toHaveBeenCalledWith(userId);
    });
  });

  describe('Route 2: GET /referrals/my-referrals - getMyReferrals', () => {
    const userId = 'user-test-123';
    const mockReferralsResult = {
      data: [
        {
          id: 'ref-1',
          refereeName: 'Jane Doe',
          refereeEmail: 'j***@example.com',
          couponCode: 'REF-EE-11223344',
          createdAt: new Date('2026-01-15T08:00:00.000Z'),
        },
        {
          id: 'ref-2',
          refereeName: 'John Smith',
          refereeEmail: 's***@example.com',
          couponCode: 'REF-EE-55667788',
          createdAt: new Date('2026-02-10T10:00:00.000Z'),
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('delegates to referralsService.getMyReferrals with authenticated user id and default/provided paginationDto, returning service result', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 20 };
      mockReferralsService.getMyReferrals.mockResolvedValue(mockReferralsResult);

      const result = await controller.getMyReferrals(userId, paginationDto);

      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledWith(
        userId,
        paginationDto,
      );
      expect(result).toEqual(mockReferralsResult);
    });

    it('delegates to referralsService.getMyReferrals with custom paginationDto options', async () => {
      const customPaginationDto: PaginationDto = { page: 2, limit: 10 };
      const paginatedResult = {
        ...mockReferralsResult,
        page: 2,
        limit: 10,
      };
      mockReferralsService.getMyReferrals.mockResolvedValue(paginatedResult);

      const result = await controller.getMyReferrals(
        userId,
        customPaginationDto,
      );

      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledWith(
        userId,
        customPaginationDto,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('handles empty query / empty paginationDto object', async () => {
      const emptyPagination: PaginationDto = {};
      mockReferralsService.getMyReferrals.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const result = await controller.getMyReferrals(userId, emptyPagination);

      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledWith(
        userId,
        emptyPagination,
      );
      expect(result.data).toEqual([]);
    });

    it('propagates exceptions thrown by referralsService.getMyReferrals', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 20 };
      mockReferralsService.getMyReferrals.mockRejectedValue(
        new Error('Database query failure'),
      );

      await expect(
        controller.getMyReferrals(userId, paginationDto),
      ).rejects.toThrow('Database query failure');
      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledWith(
        userId,
        paginationDto,
      );
    });
  });

  describe('Route 3: GET /referrals/my-coupons - getMyCouponsFromReferral', () => {
    const userId = 'user-test-123';
    const mockCouponsResult = {
      data: [
        {
          id: 'coupon-1',
          code: 'REF-EE-11223344',
          type: 'PERCENT',
          value: 10,
          maxDiscount: 50000,
          minOrder: 100000,
          active: true,
          createdAt: new Date('2026-01-15T08:00:00.000Z'),
        },
      ],
    };

    it('delegates to referralsService.getMyCouponsFromReferral with authenticated user id and returns service result', async () => {
      mockReferralsService.getMyCouponsFromReferral.mockResolvedValue(
        mockCouponsResult,
      );

      const result = await controller.getMyCouponsFromReferral(userId);

      expect(
        mockReferralsService.getMyCouponsFromReferral,
      ).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getMyCouponsFromReferral).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(mockCouponsResult);
    });

    it('returns empty coupon list when user has not earned any coupons', async () => {
      mockReferralsService.getMyCouponsFromReferral.mockResolvedValue({
        data: [],
      });

      const result = await controller.getMyCouponsFromReferral(userId);

      expect(mockReferralsService.getMyCouponsFromReferral).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual({ data: [] });
    });

    it('propagates exceptions thrown by referralsService.getMyCouponsFromReferral', async () => {
      mockReferralsService.getMyCouponsFromReferral.mockRejectedValue(
        new NotFoundException('No coupons found'),
      );

      await expect(controller.getMyCouponsFromReferral(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockReferralsService.getMyCouponsFromReferral).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
