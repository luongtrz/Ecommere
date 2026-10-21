import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('UsersModule', () => {
  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let usersModule: UsersModule;
    let usersController: UsersController;
    let usersService: UsersService;

    const mockUsersService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getAddresses: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [UsersModule],
      })
        .overrideProvider(UsersService)
        .useValue(mockUsersService)
        .compile();

      usersModule = moduleRef.get<UsersModule>(UsersModule);
      usersController = moduleRef.get<UsersController>(UsersController);
      usersService = moduleRef.get<UsersService>(UsersService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(usersModule).toBeDefined();
      expect(usersModule).toBeInstanceOf(UsersModule);
    });

    it('should resolve UsersController', () => {
      expect(usersController).toBeDefined();
      expect(usersController).toBeInstanceOf(UsersController);
    });

    it('should resolve UsersService with the overridden provider', () => {
      expect(usersService).toBeDefined();
      expect(usersService).toBe(mockUsersService);
    });

    it('should allow UsersController to interact with the mocked UsersService', async () => {
      const mockResult = {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      mockUsersService.getProfile.mockResolvedValueOnce(mockResult);

      const result = await usersController.getProfile('user-1');

      expect(result).toBe(mockResult);
      expect(mockUsersService.getProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Module compilation with mocked PrismaService provider', () => {
    let moduleRef: TestingModule;

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

    @Global()
    @Module({
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
      exports: [PrismaService],
    })
    class MockPrismaModule {}

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [MockPrismaModule, UsersModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real UsersService and UsersController with mocked PrismaService', () => {
      const module = moduleRef.get<UsersModule>(UsersModule);
      const service = moduleRef.get<UsersService>(UsersService);
      const controller = moduleRef.get<UsersController>(UsersController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(UsersModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(UsersService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(UsersController);
    });

    it('should allow real UsersService to execute operations with mocked PrismaService', async () => {
      const service = moduleRef.get<UsersService>(UsersService);
      const mockUser = {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        name: 'Nguyen Van A',
        phone: '0912345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

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
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new UsersModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(UsersModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register controllers, providers, and exports metadata', () => {
      const controllers = Reflect.getMetadata('controllers', UsersModule);
      const providers = Reflect.getMetadata('providers', UsersModule);
      const exportsList = Reflect.getMetadata('exports', UsersModule);

      expect(controllers).toEqual([UsersController]);
      expect(providers).toEqual([UsersService]);
      expect(exportsList).toEqual([UsersService]);
    });
  });
});
