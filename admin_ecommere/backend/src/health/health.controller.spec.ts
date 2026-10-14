import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '@/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrismaService: {
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    mockPrismaService = {
      $queryRaw: jest.fn(),
    };

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
  });

  it('should return status ok on success', async () => {
    mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.uptime).toBeDefined();
    expect(typeof result.uptime).toBe('number');
  });

  it('should throw ServiceUnavailableException when $queryRaw rejects', async () => {
    mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
    await expect(controller.check()).rejects.toThrow('Database unavailable');
  });
});
