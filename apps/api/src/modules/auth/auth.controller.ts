import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, AdminLoginDto, VerifyTwoFactorDto } from '@jeeto/validation';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('participant/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit SMS OTP for phone login' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Rate limit throttled' })
  async sendParticipantOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendParticipantOtp(dto);
  }

  @Post('participant/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and issue JWT tokens' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  async verifyParticipantOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyParticipantOtp(dto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin/Sponsor portal email & password login' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('admin/verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete Admin 2FA verification' })
  async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    return this.authService.verifyTwoFactor(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired access token using refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
