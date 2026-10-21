import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user1@example.com',
      role: 'CUSTOMER',
      name: 'Nguyen Van A',
      phone: '0912345678',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should return the user profile when the user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getProfile('non-existent')).rejects.toThrow('User not found');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('updateProfile', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Nguyen Van B',
      phone: '0987654321',
    };

    const mockUpdatedUser = {
      id: 'user-1',
      email: 'user1@example.com',
      role: 'CUSTOMER',
      name: 'Nguyen Van B',
      phone: '0987654321',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    it('should update and return the user profile successfully', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateProfile('user-1', updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw BadRequestException when phone number is already registered (Prisma P2002 error)', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `users_phone_key`',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.user.update.mockRejectedValue(p2002Error);

      await expect(service.updateProfile('user-1', updateUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateProfile('user-1', updateUserDto)).rejects.toThrow(
        'Số điện thoại đã được đăng ký',
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.8.0',
      });
      mockPrismaService.user.update.mockRejectedValue(p2025Error);

      await expect(service.updateProfile('user-1', updateUserDto)).rejects.toThrow(p2025Error);
    });

    it('should rethrow unexpected non-Prisma errors', async () => {
      const unknownError = new Error('Database connection failed');
      mockPrismaService.user.update.mockRejectedValue(unknownError);

      await expect(service.updateProfile('user-1', updateUserDto)).rejects.toThrow(unknownError);
    });
  });

  describe('getAddresses', () => {
    it('should return all addresses for a user ordered by isDefault desc and createdAt desc', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          userId: 'user-1',
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          isDefault: true,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          id: 'addr-2',
          userId: 'user-1',
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Đà Nẵng',
          district: 'Hải Châu',
          ward: 'Thạch Thang',
          line1: '456 Bạch Đằng',
          isDefault: false,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ];

      mockPrismaService.address.findMany.mockResolvedValue(mockAddresses);

      const result = await service.getAddresses('user-1');

      expect(result).toEqual(mockAddresses);
      expect(mockPrismaService.address.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('createAddress', () => {
    const baseDto: CreateAddressDto = {
      fullName: 'Nguyen Van A',
      phone: '0912345678',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng',
      line1: '123 Cầu Giấy',
    };

    it('should create address with isDefault=true and unset other default addresses in transaction', async () => {
      const createAddressDto: CreateAddressDto = {
        ...baseDto,
        isDefault: true,
      };

      const mockCreatedAddress = {
        id: 'addr-new',
        userId: 'user-1',
        ...createAddressDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.address.create.mockResolvedValue(mockCreatedAddress);

      const result = await service.createAddress('user-1', createAddressDto);

      expect(result).toEqual(mockCreatedAddress);
      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      expect(mockPrismaService.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrismaService.address.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          userId: 'user-1',
          isDefault: true,
        },
      });
    });

    it('should create address with isDefault=false without unsetting defaults', async () => {
      const createAddressDto: CreateAddressDto = {
        ...baseDto,
        isDefault: false,
      };

      const mockCreatedAddress = {
        id: 'addr-new',
        userId: 'user-1',
        ...createAddressDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.address.create.mockResolvedValue(mockCreatedAddress);

      const result = await service.createAddress('user-1', createAddressDto);

      expect(result).toEqual(mockCreatedAddress);
      expect(mockPrismaService.address.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.address.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          userId: 'user-1',
          isDefault: false,
        },
      });
    });

    it('should set isDefault to false when isDefault is omitted in createAddressDto', async () => {
      const createAddressDto: CreateAddressDto = {
        ...baseDto,
      };

      const mockCreatedAddress = {
        id: 'addr-new',
        userId: 'user-1',
        ...createAddressDto,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.address.create.mockResolvedValue(mockCreatedAddress);

      const result = await service.createAddress('user-1', createAddressDto);

      expect(result).toEqual(mockCreatedAddress);
      expect(mockPrismaService.address.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.address.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          userId: 'user-1',
          isDefault: false,
        },
      });
    });
  });

  describe('updateAddress', () => {
    const mockExistingAddress = {
      id: 'addr-1',
      userId: 'user-1',
      fullName: 'Nguyen Van A',
      phone: '0912345678',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng',
      line1: '123 Cầu Giấy',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw NotFoundException when address does not exist', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAddress('user-1', 'addr-999', { fullName: 'Updated Name' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateAddress('user-1', 'addr-999', { fullName: 'Updated Name' }),
      ).rejects.toThrow('Address not found');

      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-999', userId: 'user-1' },
      });
      expect(mockPrismaService.address.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.address.update).not.toHaveBeenCalled();
    });

    it('should update address and unset other default addresses when isDefault is true', async () => {
      const updateAddressDto: UpdateAddressDto = {
        isDefault: true,
        line1: '456 Đường Mới',
      };

      const mockUpdatedAddress = {
        ...mockExistingAddress,
        ...updateAddressDto,
      };

      mockPrismaService.address.findFirst.mockResolvedValue(mockExistingAddress);
      mockPrismaService.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.address.update.mockResolvedValue(mockUpdatedAddress);

      const result = await service.updateAddress('user-1', 'addr-1', updateAddressDto);

      expect(result).toEqual(mockUpdatedAddress);
      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-1', userId: 'user-1' },
      });
      expect(mockPrismaService.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true, id: { not: 'addr-1' } },
        data: { isDefault: false },
      });
      expect(mockPrismaService.address.update).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
        data: updateAddressDto,
      });
    });

    it('should update address without unsetting other defaults when isDefault is not true', async () => {
      const updateAddressDto: UpdateAddressDto = {
        fullName: 'Nguyen Van C',
        isDefault: false,
      };

      const mockUpdatedAddress = {
        ...mockExistingAddress,
        ...updateAddressDto,
      };

      mockPrismaService.address.findFirst.mockResolvedValue(mockExistingAddress);
      mockPrismaService.address.update.mockResolvedValue(mockUpdatedAddress);

      const result = await service.updateAddress('user-1', 'addr-1', updateAddressDto);

      expect(result).toEqual(mockUpdatedAddress);
      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-1', userId: 'user-1' },
      });
      expect(mockPrismaService.address.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.address.update).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
        data: updateAddressDto,
      });
    });
  });

  describe('deleteAddress', () => {
    const mockExistingAddress = {
      id: 'addr-1',
      userId: 'user-1',
      fullName: 'Nguyen Van A',
      phone: '0912345678',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng',
      line1: '123 Cầu Giấy',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw NotFoundException when address to delete does not exist', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(service.deleteAddress('user-1', 'addr-999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteAddress('user-1', 'addr-999')).rejects.toThrow(
        'Address not found',
      );

      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-999', userId: 'user-1' },
      });
      expect(mockPrismaService.address.delete).not.toHaveBeenCalled();
    });

    it('should delete address and return success message when address exists', async () => {
      mockPrismaService.address.findFirst.mockResolvedValue(mockExistingAddress);
      mockPrismaService.address.delete.mockResolvedValue(mockExistingAddress);

      const result = await service.deleteAddress('user-1', 'addr-1');

      expect(result).toEqual({ message: 'Address deleted successfully' });
      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-1', userId: 'user-1' },
      });
      expect(mockPrismaService.address.delete).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
      });
    });
  });

  describe('runSerializableTransaction (retry mechanism)', () => {
    it('should retry transaction and succeed when P2034 serialization failure occurs on initial attempt', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError('Transaction conflict', {
        code: 'P2034',
        clientVersion: '5.8.0',
      });

      const mockAddress = {
        id: 'addr-1',
        userId: 'user-1',
        fullName: 'Nguyen Van A',
      };

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2034Error)
        .mockImplementationOnce(async (callback) => {
          return callback(mockPrismaService);
        });

      mockPrismaService.address.create.mockResolvedValue(mockAddress);

      const result = await service.createAddress('user-1', {
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '123 Cầu Giấy',
        isDefault: false,
      });

      expect(result).toEqual(mockAddress);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should retry up to 3 attempts and rethrow P2034 error if all attempts fail', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError('Transaction conflict', {
        code: 'P2034',
        clientVersion: '5.8.0',
      });

      mockPrismaService.$transaction.mockRejectedValue(p2034Error);

      await expect(
        service.createAddress('user-1', {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          isDefault: false,
        }),
      ).rejects.toThrow(p2034Error);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should immediately rethrow non-P2034 error without retrying', async () => {
      const generalError = new Error('Database connection lost');

      mockPrismaService.$transaction.mockRejectedValue(generalError);

      await expect(
        service.createAddress('user-1', {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          isDefault: false,
        }),
      ).rejects.toThrow(generalError);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
