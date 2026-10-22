import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CouponType, Role } from '@prisma/client';
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
  let mockCouponsService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCsrfGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCoupon = {
    code: 'PROMO2026',
    type: CouponType.PERCENT,
    value: 20,
    minOrder: 100000,
    maxDiscount: 50000,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2026-12-31T23:59:59.000Z'),
    maxUses: 100,
    maxUsesPerUser: 1,
    usedCount: 0,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    mockCouponsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

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
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(CsrfGuard)
      .useValue(mockCsrfGuard)
      .compile();

    controller = module.get<CouponsController>(CouponsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated coupons from service', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const expectedResponse = {
        data: [mockCoupon],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockCouponsService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(paginationDto);

      expect(result).toEqual(expectedResponse);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith(paginationDto);
    });

    it('should propagate service errors during findAll', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const error = new Error('Database query failure');
      mockCouponsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll(paginationDto)).rejects.toThrow(error);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findOne', () => {
    it('should return coupon when found by code', async () => {
      mockCouponsService.findOne.mockResolvedValue(mockCoupon);

      const result = await controller.findOne('promo2026');

      expect(result).toEqual(mockCoupon);
      expect(mockCouponsService.findOne).toHaveBeenCalledWith('promo2026');
    });

    it('should throw NotFoundException when coupon is not found', async () => {
      mockCouponsService.findOne.mockRejectedValue(
        new NotFoundException('Coupon not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('non-existent')).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockCouponsService.findOne).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('create', () => {
    const createDto: CreateCouponDto = {
      code: 'promo2026',
      type: CouponType.PERCENT,
      value: 20,
      minOrder: 100000,
      maxDiscount: 50000,
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2026-12-31T23:59:59.000Z'),
      maxUses: 100,
      maxUsesPerUser: 1,
    };

    it('should create and return coupon', async () => {
      mockCouponsService.create.mockResolvedValue(mockCoupon);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCoupon);
      expect(mockCouponsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when create validation fails', async () => {
      mockCouponsService.create.mockRejectedValue(
        new BadRequestException('Coupon code already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'Coupon code already exists',
      );
      expect(mockCouponsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCouponDto = {
      value: 25,
      active: true,
    };

    it('should update and return updated coupon', async () => {
      const updatedCoupon = { ...mockCoupon, value: 25 };
      mockCouponsService.update.mockResolvedValue(updatedCoupon);

      const result = await controller.update('promo2026', updateDto);

      expect(result).toEqual(updatedCoupon);
      expect(mockCouponsService.update).toHaveBeenCalledWith(
        'promo2026',
        updateDto,
      );
    });

    it('should throw NotFoundException when coupon to update is not found', async () => {
      mockCouponsService.update.mockRejectedValue(
        new NotFoundException('Coupon not found'),
      );

      await expect(
        controller.update('non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update('non-existent', updateDto),
      ).rejects.toThrow('Coupon not found');
      expect(mockCouponsService.update).toHaveBeenCalledWith(
        'non-existent',
        updateDto,
      );
    });

    it('should throw BadRequestException when update validation fails', async () => {
      mockCouponsService.update.mockRejectedValue(
        new BadRequestException('Percentage value must be between 0 and 100'),
      );

      await expect(
        controller.update('promo2026', { value: 150 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.update('promo2026', { value: 150 }),
      ).rejects.toThrow('Percentage value must be between 0 and 100');
      expect(mockCouponsService.update).toHaveBeenCalledWith('promo2026', {
        value: 150,
      });
    });
  });

  describe('remove', () => {
    it('should remove coupon and return confirmation message', async () => {
      const successResponse = { message: 'Coupon deleted successfully' };
      mockCouponsService.remove.mockResolvedValue(successResponse);

      const result = await controller.remove('promo2026');

      expect(result).toEqual(successResponse);
      expect(mockCouponsService.remove).toHaveBeenCalledWith('promo2026');
    });

    it('should throw NotFoundException when coupon to remove is not found', async () => {
      mockCouponsService.remove.mockRejectedValue(
        new NotFoundException('Coupon not found'),
      );

      await expect(controller.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove('non-existent')).rejects.toThrow(
        'Coupon not found',
      );
      expect(mockCouponsService.remove).toHaveBeenCalledWith('non-existent');
    });

    it('should throw BadRequestException when coupon cannot be deleted because of usage', async () => {
      mockCouponsService.remove.mockRejectedValue(
        new BadRequestException(
          'Cannot delete coupon that has been used in orders',
        ),
      );

      await expect(controller.remove('promo2026')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.remove('promo2026')).rejects.toThrow(
        'Cannot delete coupon that has been used in orders',
      );
      expect(mockCouponsService.remove).toHaveBeenCalledWith('promo2026');
    });
  });

  describe('Roles metadata', () => {
    it('should have ADMIN role configured at controller class level', () => {
      const classRoles = Reflect.getMetadata(ROLES_KEY, CouponsController);
      expect(classRoles).toEqual([Role.ADMIN]);
    });

    it('should have ADMIN role configured on controller methods', () => {
      const findAllRoles = Reflect.getMetadata(
        ROLES_KEY,
        CouponsController.prototype.findAll,
      );
      const findOneRoles = Reflect.getMetadata(
        ROLES_KEY,
        CouponsController.prototype.findOne,
      );
      const createRoles = Reflect.getMetadata(
        ROLES_KEY,
        CouponsController.prototype.create,
      );
      const updateRoles = Reflect.getMetadata(
        ROLES_KEY,
        CouponsController.prototype.update,
      );
      const removeRoles = Reflect.getMetadata(
        ROLES_KEY,
        CouponsController.prototype.remove,
      );

      expect(findAllRoles).toEqual([Role.ADMIN]);
      expect(findOneRoles).toEqual([Role.ADMIN]);
      expect(createRoles).toEqual([Role.ADMIN]);
      expect(updateRoles).toEqual([Role.ADMIN]);
      expect(removeRoles).toEqual([Role.ADMIN]);
    });
  });
});
