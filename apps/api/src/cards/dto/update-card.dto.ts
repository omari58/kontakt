import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { CreateCardDto } from './create-card.dto';
import { validateSlug } from '../slug.util';

@ValidatorConstraint({ name: 'isValidSlug', async: false })
class IsValidSlugConstraint implements ValidatorConstraintInterface {
  validate(slug: string): boolean {
    return validateSlug(slug);
  }

  defaultMessage(): string {
    return 'slug must be 2-100 chars, lowercase alphanumeric + hyphens, no leading/trailing or consecutive hyphens';
  }
}

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsOptional()
  @IsString()
  @Validate(IsValidSlugConstraint)
  slug?: string;
}
