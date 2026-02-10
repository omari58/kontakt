import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { SignatureLayout } from '@prisma/client';

export class CreateSignatureDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @IsOptional()
  @IsEnum(SignatureLayout)
  layout?: SignatureLayout;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
