import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from './auth.constants';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const accessSecret = configService.get<string>(
          'ADMIN_JWT_ACCESS_SECRET',
        );
        const refreshSecret = configService.get<string>(
          'ADMIN_JWT_REFRESH_SECRET',
        );
        if (!accessSecret || accessSecret.trim() === '') {
          throw new Error('ADMIN_JWT_ACCESS_SECRET is required');
        }
        if (!refreshSecret || refreshSecret.trim() === '') {
          throw new Error('ADMIN_JWT_REFRESH_SECRET is required');
        }
        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: configService.get('TOKEN_EXPIRES_IN'),
            issuer: ADMIN_JWT_ISSUER,
            audience: ADMIN_JWT_AUDIENCE,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
