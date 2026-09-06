import { Injectable, BadRequestException, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { APP_CONFIG } from '@jeeto/config';
import { SendOtpDto, VerifyOtpDto, AdminLoginDto, VerifyTwoFactorDto } from '@jeeto/validation';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { IOtpProvider, DevelopmentOtpProvider, ProductionSmsProvider } from './otp-provider.interface';

@Injectable()
export class AuthService {
  private otpProvider: IOtpProvider;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
  ) {
    this.otpProvider = process.env.NODE_ENV === 'production'
      ? new ProductionSmsProvider()
      : new DevelopmentOtpProvider();
  }

  async sendParticipantOtp(dto: SendOtpDto) {
    const throttleKey = `otp_throttle:${dto.phone}`;
    const isThrottled = await this.redis.get(throttleKey);
    if (isThrottled) {
      throw new HttpException(
        `Please wait ${APP_CONFIG.auth.otpThrottleSeconds} seconds before requesting a new OTP`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Generate 6-digit OTP (deterministic 123456 in dev/test, random in prod)
    const otp = process.env.NODE_ENV === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';

    const otpKey = `otp:${dto.phone}`;
    await this.redis.set(otpKey, otp, APP_CONFIG.auth.otpExpirySeconds);
    await this.redis.set(throttleKey, '1', APP_CONFIG.auth.otpThrottleSeconds);

    // Dispatch via abstract OTP provider
    await this.otpProvider.sendSmsOtp(dto.phone, otp);

    return {
      message: 'OTP sent successfully',
      expiresInSeconds: APP_CONFIG.auth.otpExpirySeconds,
      ...(process.env.NODE_ENV !== 'production' && { devOtpHint: otp }),
    };
  }

  async verifyParticipantOtp(dto: VerifyOtpDto) {
    const otpKey = `otp:${dto.phone}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    // Invalidate OTP after single use
    await this.redis.del(otpKey);

    // Find or create participant user
    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      // Ensure 'PARTICIPANT' role exists
      let participantRole = await this.prisma.role.findUnique({ where: { name: 'PARTICIPANT' } });
      if (!participantRole) {
        participantRole = await this.prisma.role.create({
          data: { name: 'PARTICIPANT', description: 'End-user participant role' },
        });
      }

      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          isPhoneVerified: true,
          status: 'ACTIVE',
          roles: {
            create: { roleId: participantRole.id },
          },
          profile: {
            create: {
              displayName: `User_${dto.phone.slice(-4)}`,
            },
          },
        },
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      });
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const tokens = this.generateTokens(user.id, user.phone || undefined, undefined, roleNames);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.profile?.displayName,
        avatarUrl: user.profile?.avatarUrl,
        roles: roleNames,
      },
      ...tokens,
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isTwoFactorEnabled) {
      const preAuthToken = this.jwtService.sign(
        { sub: user.id, isPreAuth: true },
        { expiresIn: '5m' },
      );
      return {
        requiresTwoFactor: true,
        preAuthToken,
      };
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const tokens = this.generateTokens(user.id, undefined, user.email || undefined, roleNames);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        roles: roleNames,
      },
      ...tokens,
    };
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.preAuthToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA pre-authorization token');
    }

    if (!payload.isPreAuth) {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2FA Verification Logic
    if (user.twoFactorSecret) {
      // Validate TOTP code using configured TOTP secret via otplib
      const isValid = authenticator.verify({
        token: dto.totpCode,
        secret: user.twoFactorSecret,
      });
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA authentication code');
      }
    } else {
      // If no TOTP secret is configured:
      // In production mode, NEVER accept a hardcoded/default code.
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('2FA is not configured for this account');
      }

      // In development/test mode ONLY: allow test code if secret is missing
      if (dto.totpCode !== '123456') {
        throw new UnauthorizedException('Invalid 2FA authentication code');
      }
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const tokens = this.generateTokens(user.id, user.phone || undefined, user.email || undefined, roleNames);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        roles: roleNames,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { roles: { include: { role: true } } },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User session is invalid');
      }

      const roleNames = user.roles.map((r) => r.role.name);
      return this.generateTokens(user.id, user.phone || undefined, user.email || undefined, roleNames);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(userId: string, phone?: string, email?: string, roles: string[] = []) {
    const payload = { sub: userId, phone, email, roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }
}
