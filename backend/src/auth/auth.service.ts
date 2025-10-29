import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { HashUtil } from '@/common/utils/hash.util';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { AuthTokensEntity } from './entities/auth-tokens.entity';
import {
  hashToken,
  generateTokenFamily,
  generateCsrfToken,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  clearAuthCookies,
} from './utils/token.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, response: Response) {
    const { email, password, name, phone } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await HashUtil.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${email}`);

    // Generate tokens with rotation
    const tokens = await this.generateTokensWithRotation(
      user.id,
      user.email,
      user.role,
      response,
    );

    return {
      user,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async login(loginDto: LoginDto, response: Response) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await HashUtil.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${email}`);

    // Generate tokens with rotation
    const tokens = await this.generateTokensWithRotation(
      user.id,
      user.email,
      user.role,
      response,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt, // Add createdAt for frontend
      },
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async refresh(oldRefreshToken: string, response: Response) {
    // 1. Verify token signature
    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Hash token to query database
    const tokenHash = hashToken(oldRefreshToken);

    // 3. Find token record in database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // 4. REUSE DETECTION - Check if token was already used or revoked
    if (!tokenRecord || tokenRecord.replacedBy || tokenRecord.revokedAt) {
      // Token reuse detected! Revoke entire token family
      if (payload.sub && payload.family) {
        this.logger.warn(
          `Token reuse detected! Revoking family: ${payload.family} for user: ${payload.sub}`,
        );

        await this.prisma.refreshToken.updateMany({
          where: {
            userId: payload.sub,
            tokenFamily: payload.family,
          },
          data: { revokedAt: new Date() },
        });
      }

      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
    }

    // 5. Check expiry
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // 6. Generate new tokens with rotation
    const tokens = await this.generateTokensWithRotation(
      tokenRecord.userId,
      tokenRecord.user.email,
      tokenRecord.user.role,
      response,
      payload.family, // Preserve token family
    );

    // 7. Mark old token as replaced
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { replacedBy: tokens.refreshTokenId },
    });

    this.logger.log(`Token refreshed for user: ${tokenRecord.user.email}`);

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link will be sent' };
    }

    // Mock: In production, generate token and send email
    const resetToken = `mock-reset-token-${user.id}-${Date.now()}`;
    
    this.logger.log(`Password reset requested for: ${email}`);
    this.logger.log(`Mock reset token: ${resetToken}`);

    return { 
      message: 'If email exists, reset link will be sent',
      // In dev mode, return token for testing
      ...(this.configService.get('NODE_ENV') === 'development' && { resetToken }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Mock validation - in production, verify token from database/redis
    if (!token.startsWith('mock-reset-token-')) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Extract userId from mock token
    const parts = token.split('-');
    const userId = parts[3];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await HashUtil.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return { message: 'Password reset successful' };
  }

  private generateTokens(userId: string, email: string, role: string): AuthTokensEntity {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('TOKEN_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_EXPIRES_IN'),
    });

    return new AuthTokensEntity(
      accessToken,
      refreshToken,
      this.configService.get('TOKEN_EXPIRES_IN'),
    );
  }

  /**
   * Generate tokens with rotation and store refresh token in DB
   */
  private async generateTokensWithRotation(
    userId: string,
    email: string,
    role: string,
    response: Response,
    existingFamily?: string,
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const tokenFamily = existingFamily || generateTokenFamily();

    // Generate access token (short-lived, in memory)
    const accessPayload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('TOKEN_EXPIRES_IN'),
    });

    // Generate refresh token (long-lived, in HTTP-only cookie)
    // Add unique jti (JWT ID) to prevent duplicate tokens
    const refreshPayload = { 
      sub: userId, 
      family: tokenFamily,
      jti: generateTokenFamily(), // Unique identifier for this specific token
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_EXPIRES_IN'),
    });

    // Hash refresh token for database storage
    const tokenHash = hashToken(refreshToken);

    // Save refresh token to database (with retry on hash collision - rare)
    let refreshTokenRecord;
    try {
      refreshTokenRecord = await this.prisma.refreshToken.create({
        data: {
          userId,
          tokenFamily,
          tokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error) {
      // If hash collision (extremely rare with jti), clean up and throw
      this.logger.error(`Token hash collision detected for user ${userId}`, error);
      throw new Error('Failed to generate unique token. Please try again.');
    }

    // Set refresh token in HTTP-only cookie
    setRefreshTokenCookie(response, refreshToken, isProduction);

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken();
    setCsrfTokenCookie(response, csrfToken, isProduction);

    return {
      accessToken,
      refreshTokenId: refreshTokenRecord.id,
      expiresIn: this.configService.get('TOKEN_EXPIRES_IN'),
    };
  }

  /**
   * Logout user and revoke refresh tokens
   */
  async logout(userId: string, refreshToken: string | undefined, response: Response) {
    // Clear cookies
    clearAuthCookies(response);

    // If refresh token provided, revoke its entire family
    if (refreshToken) {
      try {
        const tokenHash = hashToken(refreshToken);
        const tokenRecord = await this.prisma.refreshToken.findUnique({
          where: { tokenHash },
        });

        if (tokenRecord) {
          // Revoke entire token family
          await this.prisma.refreshToken.updateMany({
            where: {
              userId,
              tokenFamily: tokenRecord.tokenFamily,
            },
            data: { revokedAt: new Date() },
          });

          this.logger.log(`Logout: Revoked token family ${tokenRecord.tokenFamily}`);
        }
      } catch (error) {
        // Silent fail - user is logging out anyway
        this.logger.warn('Error revoking tokens during logout', error);
      }
    }

    return { message: 'Logged out successfully' };
  }
}

