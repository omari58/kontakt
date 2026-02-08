import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUrl,
  IsEmail,
  IsArray,
  ValidateNested,
  Matches,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AvatarShape, Theme, Visibility } from '@prisma/client';

const SOCIAL_PLATFORMS = [
  'github',
  'linkedin',
  'twitter',
  'x',
  'facebook',
  'instagram',
  'youtube',
  'tiktok',
  'snapchat',
  'whatsapp',
  'telegram',
  'signal',
  'discord',
  'slack',
  'reddit',
  'pinterest',
  'dribbble',
  'behance',
  'medium',
  'dev',
  'stackoverflow',
  'twitch',
  'spotify',
  'soundcloud',
  'bandcamp',
  'mastodon',
  'threads',
  'bluesky',
] as const;

export class PhoneDto {
  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class EmailDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class SocialLinkDto {
  @IsIn(SOCIAL_PLATFORMS)
  platform!: string;

  @IsUrl()
  url!: string;
}

export class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  zip?: string;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneDto)
  phones?: PhoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailDto)
  emails?: EmailDto[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  websites?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'bgColor must be a valid hex color (e.g. #fff or #ff0000)' })
  bgColor?: string;

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'primaryColor must be a valid hex color (e.g. #fff or #ff0000)' })
  primaryColor?: string;

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'textColor must be a valid hex color (e.g. #fff or #ff0000)' })
  textColor?: string;

  @IsOptional()
  @IsEnum(AvatarShape)
  avatarShape?: AvatarShape;

  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @IsOptional()
  @IsBoolean()
  obfuscate?: boolean;
}
