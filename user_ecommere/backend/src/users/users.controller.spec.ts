import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { UserEntity } from './entities/user.entity';
import { AddressEntity } from './entities/address.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: {
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
    getAddresses: jest.Mock;
    createAddress: jest.Mock;
    updateAddress: jest.Mock;
    deleteAddress: jest.Mock;
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

  beforeEach(async () => {
    mockUsersService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getAddresses: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
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

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Route: GET /users/me', () => {
    it('delegates to usersService.getProfile with authenticated userId, returning user profile', async () => {
      const userId = 'user-123';
      const mockUser = new UserEntity({
        id: userId,
        email: 'user@example.com',
        role: 'CUSTOMER',
        name: 'Nguyen Van A',
        phone: '0912345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUsersService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(userId);

      expect(mockUsersService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('propagates NotFoundException when user is not found', async () => {
      const userId = 'non-existent-user';
      mockUsersService.getProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.getProfile).toHaveBeenCalledWith(userId);
    });
  });

  describe('Route: PATCH /users/me', () => {
    it('delegates to usersService.updateProfile with authenticated userId and updateUserDto, returning updated profile', async () => {
      const userId = 'user-123';
      const updateUserDto: UpdateUserDto = {
        name: 'Nguyen Van B',
        phone: '0987654321',
      };
      const updatedUser = new UserEntity({
        id: userId,
        email: 'user@example.com',
        role: 'CUSTOMER',
        name: 'Nguyen Van B',
        phone: '0987654321',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(userId, updateUserDto);

      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('propagates BadRequestException when phone number is already registered', async () => {
      const userId = 'user-123';
      const updateUserDto: UpdateUserDto = {
        phone: '0987654321',
      };
      mockUsersService.updateProfile.mockRejectedValue(
        new BadRequestException('Số điện thoại đã được đăng ký'),
      );

      await expect(
        controller.updateProfile(userId, updateUserDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
    });
  });

  describe('Route: GET /users/addresses', () => {
    it('delegates to usersService.getAddresses with authenticated userId, returning addresses array', async () => {
      const userId = 'user-123';
      const mockAddresses = [
        new AddressEntity({
          id: 'addr-1',
          userId,
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Ho Chi Minh',
          district: 'Quan 1',
          ward: 'Ben Nghe',
          line1: '123 Le Loi',
          isDefault: true,
          createdAt: new Date(),
        }),
        new AddressEntity({
          id: 'addr-2',
          userId,
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Ha Noi',
          district: 'Hoan Kiem',
          ward: 'Hang Bac',
          line1: '456 Dinh Tien Hoang',
          isDefault: false,
          createdAt: new Date(),
        }),
      ];
      mockUsersService.getAddresses.mockResolvedValue(mockAddresses);

      const result = await controller.getAddresses(userId);

      expect(mockUsersService.getAddresses).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockAddresses);
    });

    it('returns empty array when user has no registered addresses', async () => {
      const userId = 'user-new';
      mockUsersService.getAddresses.mockResolvedValue([]);

      const result = await controller.getAddresses(userId);

      expect(mockUsersService.getAddresses).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe('Route: POST /users/addresses', () => {
    it('delegates to usersService.createAddress with authenticated userId and createAddressDto, returning created address', async () => {
      const userId = 'user-123';
      const createAddressDto: CreateAddressDto = {
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        province: 'Ho Chi Minh',
        district: 'Quan 1',
        ward: 'Ben Nghe',
        line1: '123 Le Loi',
        isDefault: true,
      };
      const createdAddress = new AddressEntity({
        id: 'addr-created',
        userId,
        ...createAddressDto,
        createdAt: new Date(),
      });
      mockUsersService.createAddress.mockResolvedValue(createdAddress);

      const result = await controller.createAddress(userId, createAddressDto);

      expect(mockUsersService.createAddress).toHaveBeenCalledWith(
        userId,
        createAddressDto,
      );
      expect(result).toEqual(createdAddress);
    });

    it('propagates error when usersService.createAddress fails', async () => {
      const userId = 'user-123';
      const createAddressDto: CreateAddressDto = {
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        province: 'Ho Chi Minh',
        district: 'Quan 1',
        ward: 'Ben Nghe',
        line1: '123 Le Loi',
      };
      mockUsersService.createAddress.mockRejectedValue(
        new BadRequestException('Address update could not be completed'),
      );

      await expect(
        controller.createAddress(userId, createAddressDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.createAddress).toHaveBeenCalledWith(
        userId,
        createAddressDto,
      );
    });
  });

  describe('Route: PATCH /users/addresses/:id', () => {
    it('delegates to usersService.updateAddress with authenticated userId, addressId param, and updateAddressDto, returning updated address', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';
      const updateAddressDto: UpdateAddressDto = {
        line1: '789 Nguyen Hue',
        isDefault: true,
      };
      const updatedAddress = new AddressEntity({
        id: addressId,
        userId,
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        province: 'Ho Chi Minh',
        district: 'Quan 1',
        ward: 'Ben Nghe',
        line1: '789 Nguyen Hue',
        isDefault: true,
        createdAt: new Date(),
      });
      mockUsersService.updateAddress.mockResolvedValue(updatedAddress);

      const result = await controller.updateAddress(
        userId,
        addressId,
        updateAddressDto,
      );

      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        userId,
        addressId,
        updateAddressDto,
      );
      expect(result).toEqual(updatedAddress);
    });

    it('propagates NotFoundException when address does not exist or belong to user', async () => {
      const userId = 'user-123';
      const addressId = 'addr-unknown';
      const updateAddressDto: UpdateAddressDto = {
        line1: '789 Nguyen Hue',
      };
      mockUsersService.updateAddress.mockRejectedValue(
        new NotFoundException('Address not found'),
      );

      await expect(
        controller.updateAddress(userId, addressId, updateAddressDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        userId,
        addressId,
        updateAddressDto,
      );
    });
  });

  describe('Route: DELETE /users/addresses/:id', () => {
    it('delegates to usersService.deleteAddress with authenticated userId and addressId param, returning success message', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';
      const mockResult = { message: 'Address deleted successfully' };
      mockUsersService.deleteAddress.mockResolvedValue(mockResult);

      const result = await controller.deleteAddress(userId, addressId);

      expect(mockUsersService.deleteAddress).toHaveBeenCalledWith(
        userId,
        addressId,
      );
      expect(result).toEqual(mockResult);
    });

    it('propagates NotFoundException when address does not exist or belong to user', async () => {
      const userId = 'user-123';
      const addressId = 'addr-unknown';
      mockUsersService.deleteAddress.mockRejectedValue(
        new NotFoundException('Address not found'),
      );

      await expect(controller.deleteAddress(userId, addressId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.deleteAddress).toHaveBeenCalledWith(
        userId,
        addressId,
      );
    });
  });
});
