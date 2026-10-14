import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from '@/auth/auth.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export class JwtUtil {
  static generateAccessToken(
    jwtService: JwtService,
    configService: ConfigService,
    payload: JwtPayload,
  ): string {
    return jwtService.sign(payload, {
      secret: configService.get('ADMIN_JWT_ACCESS_SECRET'),
      expiresIn: configService.get('TOKEN_EXPIRES_IN'),
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    });
  }

  static generateRefreshToken(
    jwtService: JwtService,
    configService: ConfigService,
    payload: JwtPayload,
  ): string {
    return jwtService.sign(payload, {
      secret: configService.get('ADMIN_JWT_REFRESH_SECRET'),
      expiresIn: configService.get('REFRESH_EXPIRES_IN'),
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    });
  }

  static verifyAccessToken(
    jwtService: JwtService,
    configService: ConfigService,
    token: string,
  ): JwtPayload {
    return jwtService.verify(token, {
      secret: configService.get('ADMIN_JWT_ACCESS_SECRET'),
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    });
  }

  static verifyRefreshToken(
    jwtService: JwtService,
    configService: ConfigService,
    token: string,
  ): JwtPayload {
    return jwtService.verify(token, {
      secret: configService.get('ADMIN_JWT_REFRESH_SECRET'),
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    });
  }
}
