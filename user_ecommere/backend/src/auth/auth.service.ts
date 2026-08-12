import { Injectable, BadRequestException, UnauthorizedException, Logger, Inject, forwardRef } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { HashUtil } from '@/common/utils/hash.util';
import { ReferralsService } from '@/referrals/referrals.service';
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
  private readonly PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

  // Grace period for token reuse (30 seconds)
  // Allows duplicate refresh requests during F5/network delays
  private readonly TOKEN_REUSE_GRACE_PERIOD = 30 * 1000; // 30 seconds

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private referralsService: ReferralsService,
  ) { }

  async register(registerDto: RegisterDto, response: Response) {
    const { phone, password, name, email, referralCode } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      throw new BadRequestException('Số điện thoại đã được đăng ký');
    }

    const passwordHash = await HashUtil.hash(password);

    const user = await this.prisma.user.create({
      data: {
        phone,
        passwordHash,
        name,
        email,
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

    this.logger.log(`New user registered: ${phone}`);

    // Xử lý referral code nếu có
    if (referralCode) {
      try {
        await this.referralsService.processReferral(referralCode, user.id);
        this.logger.log(`Referral processed for new user ${phone} with code ${referralCode}`);
      } catch (error) {
        this.logger.warn(`Failed to process referral for ${phone}: ${error.message}`);
        // Không throw lỗi - referral thất bại không nên ảnh hưởng đăng ký
      }
    }

    // Generate tokens with rotation
    const tokens = await this.generateTokensWithRotation(
      user.id,
      user.phone,
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
    const { phone, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await HashUtil.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${phone}`);

    // Generate tokens with rotation
    const tokens = await this.generateTokensWithRotation(
      user.id,
      user.phone,
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
        createdAt: user.createdAt,
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

    // 4. REUSE DETECTION with Grace Period
    // Check if token was already used or revoked
    if (!tokenRecord || tokenRecord.revokedAt) {
      // Token doesn't exist or explicitly revoked - always reject
      if (payload.sub && payload.family) {
        this.logger.warn(
          `Invalid/revoked token used! Revoking family: ${payload.family} for user: ${payload.sub}`,
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

    if (tokenRecord.userId !== payload.sub || tokenRecord.tokenFamily !== payload.family) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Handle token already replaced (used before)
    if (tokenRecord.replacedBy) {
      const timeSinceReplaced = Date.now() - tokenRecord.updatedAt.getTime();

      // Grace period: Allow reuse within 30 seconds (F5 spam, network delay)
      if (timeSinceReplaced < this.TOKEN_REUSE_GRACE_PERIOD) {
        this.logger.debug(
          `Token reuse within grace period (${Math.round(timeSinceReplaced / 1000)}s) - allowing for user: ${tokenRecord.user.phone}`,
        );

        // Find and return the new token that was already issued
        const newTokenRecord = await this.prisma.refreshToken.findUnique({
          where: { id: tokenRecord.replacedBy },
          include: { user: true },
        });

        if (newTokenRecord && !newTokenRecord.revokedAt) {
          // Decrypt the new refresh token from DB (you'll need to store it temporarily)
          // For now, just generate new tokens again (acceptable within grace period)
          const tokens = await this.generateTokensWithRotation(
            newTokenRecord.userId,
            newTokenRecord.user.phone,
            newTokenRecord.user.role,
            response,
            payload.family,
          );

          return {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
          };
        }
      }

      // Outside grace period - this is suspicious
      this.logger.warn(
        `Token reuse OUTSIDE grace period (${Math.round(timeSinceReplaced / 1000)}s)! ` +
        `Revoking family: ${payload.family} for user: ${payload.sub}`,
      );

      await this.prisma.refreshToken.updateMany({
        where: {
          userId: payload.sub,
          tokenFamily: payload.family,
        },
        data: { revokedAt: new Date() },
      });

      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
    }

    // 5. Check expiry
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // 6. Generate and claim the replacement atomically. The old token is
    // conditionally updated so concurrent refresh requests cannot both win.
    const tokens = await this.prisma.$transaction(async (tx) => {
      const generatedTokens = await this.generateTokensWithRotation(
        tokenRecord.userId,
        tokenRecord.user.phone,
        tokenRecord.user.role,
        response,
        payload.family, // Preserve token family
        tx,
        false,
      );

      const replacement = await tx.refreshToken.updateMany({
        where: {
          id: tokenRecord.id,
          replacedBy: null,
          revokedAt: null,
        },
        data: { replacedBy: generatedTokens.refreshTokenId },
      });

      if (replacement.count !== 1) {
        throw new UnauthorizedException('Refresh token already used');
      }

      return generatedTokens;
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieMaxAge = Math.max(tokens.refreshTokenExpiresAt.getTime() - Date.now(), 0);
    setRefreshTokenCookie(response, tokens.refreshToken, isProduction, cookieMaxAge);
    setCsrfTokenCookie(response, tokens.csrfToken, isProduction, cookieMaxAge);

    this.logger.log(`Token refreshed for user: ${tokenRecord.user.phone}`);

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link will be sent' };
    }

    const resetToken = randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashToken(resetToken),
        passwordResetExpiresAt: new Date(Date.now() + this.PASSWORD_RESET_TTL_MS),
      },
    });

    this.logger.log(`Password reset requested for user ${user.id}`);

    return {
      message: 'If email exists, reset link will be sent',
      // In dev mode, return token for testing
      ...(this.configService.get('NODE_ENV') === 'development' && { resetToken }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const now = new Date();

    const user = await this.prisma.$transaction(async (tx) => {
      const resetUser = await tx.user.findFirst({
        where: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { gt: now },
        },
        select: { id: true },
      });

      if (!resetUser) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const passwordHash = await HashUtil.hash(newPassword);

      const consumedToken = await tx.user.updateMany({
        where: {
          id: resetUser.id,
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { gt: now },
        },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });

      if (consumedToken.count !== 1) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      await tx.refreshToken.updateMany({
        where: { userId: resetUser.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return resetUser;
    });

    this.logger.log(`Password reset successful for user ${user.id}`);

    return { message: 'Password reset successful' };
  }

  private generateTokens(userId: string, phone: string, role: string): AuthTokensEntity {
    const payload = { sub: userId, phone, role };

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
    phone: string,
    role: string,
    response: Response,
    existingFamily?: string,
    transactionClient: any = this.prisma,
    setCookies = true,
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const tokenFamily = existingFamily || generateTokenFamily();

    // Generate access token (short-lived, in memory)
    const accessPayload = { sub: userId, phone, role };
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

    const decodedRefreshToken = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    if (!decodedRefreshToken?.exp) {
      throw new Error('Refresh token expiry is not configured');
    }
    const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000);

    // Hash refresh token for database storage
    const tokenHash = hashToken(refreshToken);

    // Save refresh token to database (with retry on hash collision - rare)
    let refreshTokenRecord;
    try {
      refreshTokenRecord = await transactionClient.refreshToken.create({
        data: {
          userId,
          tokenFamily,
          tokenHash,
          expiresAt: refreshTokenExpiresAt,
        },
      });
    } catch (error) {
      // If hash collision (extremely rare with jti), clean up and throw
      this.logger.error(`Token hash collision detected for user ${userId}`, error);
      throw new Error('Failed to generate unique token. Please try again.');
    }

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken();

    if (setCookies) {
      const cookieMaxAge = Math.max(refreshTokenExpiresAt.getTime() - Date.now(), 0);
      setRefreshTokenCookie(response, refreshToken, isProduction, cookieMaxAge);
      setCsrfTokenCookie(response, csrfToken, isProduction, cookieMaxAge);
    }

    return {
      accessToken,
      refreshToken,
      refreshTokenId: refreshTokenRecord.id,
      csrfToken,
      refreshTokenExpiresAt,
      expiresIn: this.configService.get('TOKEN_EXPIRES_IN'),
    };
  }

  /**
   * Logout user and revoke refresh tokens
   */
  async logout(refreshToken: string | undefined, response: Response) {
    // Clear cookies first
    clearAuthCookies(response);

    // If refresh token provided, revoke its entire family
    if (refreshToken) {
      try {
        // Decode token to get userId (don't verify as it might be expired)
        const decoded = this.jwtService.decode(refreshToken) as any;
        const userId = decoded?.sub;

        if (userId) {
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

            this.logger.log(`Logout: Revoked token family ${tokenRecord.tokenFamily} for user ${userId}`);
          }
        }
      } catch (error) {
        // Silent fail - user is logging out anyway
        this.logger.warn('Error revoking tokens during logout', error);
      }
    }

    return { message: 'Logged out successfully' };
  }
}
