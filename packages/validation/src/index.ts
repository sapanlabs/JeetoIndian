import { IsString, IsNotEmpty, Matches, Length, IsEmail, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone number must be a valid 10-digit Indian mobile number' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone number must be a valid 10-digit Indian mobile number' })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Password must be at least 8 characters' })
  password!: string;
}

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  preAuthToken!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '2FA TOTP code must be 6 digits' })
  totpCode!: string;
}

export class QuizAnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-D]$/, { message: 'Selected option key must be A, B, C, or D' })
  selectedOptionKey?: 'A' | 'B' | 'C' | 'D' | null;

  @IsInt()
  @Min(0)
  timeTakenMs!: number;
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers!: QuizAnswerItemDto[];

  @IsString()
  @IsNotEmpty()
  clientSubmittedAt!: string;
}
