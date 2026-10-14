import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '@/prisma/prisma.service';
import { Public } from '@/common/decorators/public.decorator';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) { }

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        uptime: process.uptime(),
      };
    } catch (error) {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
