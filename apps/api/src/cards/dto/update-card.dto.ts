import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches } from 'class-validator';
import { CreateCardDto } from './create-card.dto';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/;

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsOptional()
  @IsString()
  @Matches(SLUG_REGEX, {
    message: 'slug must be 2-100 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens',
  })
  slug?: string;
}
