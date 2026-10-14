import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_ISSUER, JWT_AUDIENCE } from '@/auth/constants';

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
      secret: configService.get('JWT_ACCESS_SECRET'),
      expiresIn: configService.get('TOKEN_EXPIRES_IN'),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  static generateRefreshToken(
    jwtService: JwtService,
    configService: ConfigService,
    payload: JwtPayload,
  ): string {
    return jwtService.sign(payload, {
      secret: configService.get('JWT_REFRESH_SECRET'),
      expiresIn: configService.get('REFRESH_EXPIRES_IN'),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  static verifyAccessToken(
    jwtService: JwtService,
    configService: ConfigService,
    token: string,
  ): JwtPayload {
    return jwtService.verify(token, {
      secret: configService.get('JWT_ACCESS_SECRET'),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  static verifyRefreshToken(
    jwtService: JwtService,
    configService: ConfigService,
    token: string,
  ): JwtPayload {
    return jwtService.verify(token, {
      secret: configService.get('JWT_REFRESH_SECRET'),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }
}
