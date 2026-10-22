import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { Role, CouponType } from '@prisma/client';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { UpdateReferralConfigDto } from './dtos/update-referral-config.dto';

describe('ReferralsController', () => {
  let controller: ReferralsController;
  let mockReferralsService: {
    getConfig: jest.Mock;
    updateConfig: jest.Mock;
    getStats: jest.Mock;
    getAllReferrals: jest.Mock;
  };

  const mockCanActivate = jest.fn(() => true);

  beforeEach(async () => {
    mockReferralsService = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn(),
      getAllReferrals: jest.fn(),
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

  describe('Direct instantiation', () => {
    it('can be instantiated directly with constructor injection', () => {
      const directController = new ReferralsController(
        mockReferralsService as unknown as ReferralsService,
      );
      expect(directController).toBeDefined();
      expect(directController).toBeInstanceOf(ReferralsController);
    });
  });

  describe('Route Guards & Controller Metadata', () => {
    it('route guards are overridden with a canActivate stub returning true', () => {
      expect(mockCanActivate()).toBe(true);
    });

    it('has @Controller("referrals") metadata defined', () => {
      const path = Reflect.getMetadata('path', ReferralsController);
      expect(path).toBe('referrals');
    });

    it('has @Roles(Role.ADMIN) defined on controller and handler methods', () => {
      const controllerRoles = Reflect.getMetadata('roles', ReferralsController);
      expect(controllerRoles).toEqual([Role.ADMIN]);

      const getConfigRoles = Reflect.getMetadata('roles', controller.getConfig);
      expect(getConfigRoles).toEqual([Role.ADMIN]);

      const updateConfigRoles = Reflect.getMetadata(
        'roles',
        controller.updateConfig,
      );
      expect(updateConfigRoles).toEqual([Role.ADMIN]);

      const getStatsRoles = Reflect.getMetadata('roles', controller.getStats);
      expect(getStatsRoles).toEqual([Role.ADMIN]);

      const getAllReferralsRoles = Reflect.getMetadata(
        'roles',
        controller.getAllReferrals,
      );
      expect(getAllReferralsRoles).toEqual([Role.ADMIN]);
    });
  });

  describe('GET /referrals/config (getConfig)', () => {
    const mockConfig = {
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

    it('should delegate to referralsService.getConfig and return the result', async () => {
      mockReferralsService.getConfig.mockResolvedValue(mockConfig);

      const result = await controller.getConfig();

      expect(mockReferralsService.getConfig).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getConfig).toHaveBeenCalledWith();
      expect(result).toEqual(mockConfig);
    });

    it('should propagate exceptions thrown by referralsService.getConfig', async () => {
      const error = new InternalServerErrorException('Database failure');
      mockReferralsService.getConfig.mockRejectedValue(error);

      await expect(controller.getConfig()).rejects.toThrow(error);
      expect(mockReferralsService.getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT /referrals/config (updateConfig)', () => {
    const dto: UpdateReferralConfigDto = {
      active: true,
      referrerCouponType: CouponType.PERCENT,
      referrerCouponValue: 15,
      refereeCouponType: CouponType.PERCENT,
      refereeCouponValue: 10,
      couponValidDays: 45,
    };

    const mockUpdatedConfig = {
      id: 'cfg-1',
      ...dto,
      referrerMaxDiscount: null,
      refereeMaxDiscount: null,
      minOrderForCoupon: null,
      maxReferralsPerUser: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    it('should delegate to referralsService.updateConfig with dto and return the result', async () => {
      mockReferralsService.updateConfig.mockResolvedValue(mockUpdatedConfig);

      const result = await controller.updateConfig(dto);

      expect(mockReferralsService.updateConfig).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.updateConfig).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUpdatedConfig);
    });

    it('should propagate BadRequestException thrown by referralsService.updateConfig', async () => {
      const badReqError = new BadRequestException(
        'Invalid referral coupon value',
      );
      mockReferralsService.updateConfig.mockRejectedValue(badReqError);

      await expect(controller.updateConfig(dto)).rejects.toThrow(badReqError);
      expect(mockReferralsService.updateConfig).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.updateConfig).toHaveBeenCalledWith(dto);
    });

    it('should propagate generic errors thrown by referralsService.updateConfig', async () => {
      const genericError = new Error('Database transaction error');
      mockReferralsService.updateConfig.mockRejectedValue(genericError);

      await expect(controller.updateConfig(dto)).rejects.toThrow(genericError);
      expect(mockReferralsService.updateConfig).toHaveBeenCalledWith(dto);
    });
  });

  describe('GET /referrals/stats (getStats)', () => {
    const mockStats = {
      totalReferrals: 10,
      totalCouponsCreated: 5,
      isActive: true,
      topReferrers: [
        {
          user: {
            id: 'user-1',
            name: 'Nguyen Van A',
            email: 'a@example.com',
            referralCode: 'REF-A',
          },
          referralCount: 7,
        },
      ],
    };

    it('should delegate to referralsService.getStats and return the result', async () => {
      mockReferralsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(mockReferralsService.getStats).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('should propagate exceptions thrown by referralsService.getStats', async () => {
      const error = new Error('Stats query failed');
      mockReferralsService.getStats.mockRejectedValue(error);

      await expect(controller.getStats()).rejects.toThrow('Stats query failed');
      expect(mockReferralsService.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /referrals/list (getAllReferrals)', () => {
    const mockReferralsResult = {
      data: [
        {
          id: 'ref-1',
          referrer: {
            id: 'user-1',
            name: 'Nguyen Van A',
            email: 'a@example.com',
            referralCode: 'REF-A',
          },
          referee: {
            id: 'user-2',
            name: 'Tran Thi B',
            email: 'b@example.com',
            createdAt: new Date('2026-01-10T00:00:00.000Z'),
          },
          createdAt: new Date('2026-01-10T00:00:00.000Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('should delegate to referralsService.getAllReferrals with paginationDto and return result', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 20 };
      mockReferralsService.getAllReferrals.mockResolvedValue(
        mockReferralsResult,
      );

      const result = await controller.getAllReferrals(paginationDto);

      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledWith(
        paginationDto,
      );
      expect(result).toEqual(mockReferralsResult);
    });

    it('should handle custom pagination parameters', async () => {
      const customPaginationDto: PaginationDto = { page: 3, limit: 10 };
      const paginatedResult = {
        ...mockReferralsResult,
        page: 3,
        limit: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      };
      mockReferralsService.getAllReferrals.mockResolvedValue(paginatedResult);

      const result = await controller.getAllReferrals(customPaginationDto);

      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledWith(
        customPaginationDto,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should handle empty paginationDto object', async () => {
      const emptyDto: PaginationDto = {};
      mockReferralsService.getAllReferrals.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const result = await controller.getAllReferrals(emptyDto);

      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledWith(
        emptyDto,
      );
      expect(result.data).toEqual([]);
    });

    it('should propagate exceptions thrown by referralsService.getAllReferrals', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 20 };
      const error = new BadRequestException('Invalid page parameter');
      mockReferralsService.getAllReferrals.mockRejectedValue(error);

      await expect(controller.getAllReferrals(paginationDto)).rejects.toThrow(
        error,
      );
      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledWith(
        paginationDto,
      );
    });
  });
});
