import { VerificationRequestStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ProcessVerificationDto {
  @IsEnum(VerificationRequestStatus)
  status: VerificationRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminComment?: string;
}
