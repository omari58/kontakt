import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { SignatureLayout } from '@prisma/client';

export class UpdateSignatureDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(SignatureLayout)
  layout?: SignatureLayout;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
