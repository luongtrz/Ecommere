import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '@/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should return status ok on success', async () => {
    mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result).toHaveProperty('uptime');
    expect(typeof result.uptime).toBe('number');
    expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
  });

  it('should throw ServiceUnavailableException when $queryRaw rejects', async () => {
    mockPrismaService.$queryRaw.mockRejectedValue(new Error('Database unavailable'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
