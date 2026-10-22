import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://mock:mock@localhost:5432/mock_db?schema=public';
    }
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(PrismaClient.prototype, '$connect').mockResolvedValue(undefined);
    jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(PrismaModule).toBeDefined();
    const instance = new PrismaModule();
    expect(instance).toBeDefined();
    expect(instance).toBeInstanceOf(PrismaModule);
  });

  describe('Module metadata', () => {
    it('declares PrismaService in providers', () => {
      const providers = Reflect.getMetadata('providers', PrismaModule);
      expect(providers).toBeDefined();
      expect(providers).toContain(PrismaService);
    });

    it('exports PrismaService', () => {
      const exports = Reflect.getMetadata('exports', PrismaModule);
      expect(exports).toBeDefined();
      expect(exports).toContain(PrismaService);
    });

    it('is decorated with @Global()', () => {
      const isGlobal = Reflect.getMetadata('__module:global__', PrismaModule);
      expect(isGlobal).toBe(true);
    });
  });

  describe('Module compilation', () => {
    it('compiles successfully with providers overridden and no real connections', async () => {
      const mockPrismaService = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        cleanDatabase: jest.fn().mockResolvedValue([]),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [PrismaModule],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrismaService)
        .compile();

      expect(moduleRef).toBeDefined();

      const prismaModule = moduleRef.get<PrismaModule>(PrismaModule);
      expect(prismaModule).toBeDefined();
      expect(prismaModule).toBeInstanceOf(PrismaModule);

      const prismaService = moduleRef.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBe(mockPrismaService);
    });

    it('compiles successfully with the actual PrismaService provider when PrismaClient is mocked', async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [PrismaModule],
      }).compile();

      expect(moduleRef).toBeDefined();

      const prismaModule = moduleRef.get<PrismaModule>(PrismaModule);
      expect(prismaModule).toBeDefined();
      expect(prismaModule).toBeInstanceOf(PrismaModule);

      const prismaService = moduleRef.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(PrismaService);
      expect(prismaService).toBeInstanceOf(PrismaClient);
    });

    it('exports PrismaService to dependent consumers when imported', async () => {
      @Injectable()
      class ConsumerService {
        constructor(public readonly prisma: PrismaService) {}
      }

      const mockPrismaService = {
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [PrismaModule],
        providers: [ConsumerService],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrismaService)
        .compile();

      const consumer = moduleRef.get<ConsumerService>(ConsumerService);
      expect(consumer).toBeDefined();
      expect(consumer.prisma).toBe(mockPrismaService);
    });
  });
});
