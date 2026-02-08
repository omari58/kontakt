import { Card } from '@prisma/client';

export class CardResponseDto {
  id!: string;
  slug!: string;
  userId!: string;
  name!: string;
  jobTitle!: string | null;
  company!: string | null;
  phones!: unknown;
  emails!: unknown;
  address!: unknown;
  websites!: unknown;
  socialLinks!: unknown;
  bio!: string | null;
  avatarPath!: string | null;
  bannerPath!: string | null;
  bgImagePath!: string | null;
  bgColor!: string | null;
  primaryColor!: string | null;
  textColor!: string | null;
  avatarShape!: string | null;
  theme!: string | null;
  visibility!: string;
  noIndex!: boolean;
  obfuscate!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromCard(card: Card): CardResponseDto {
    const dto = new CardResponseDto();
    dto.id = card.id;
    dto.slug = card.slug;
    dto.userId = card.userId;
    dto.name = card.name;
    dto.jobTitle = card.jobTitle;
    dto.company = card.company;
    dto.phones = card.phones;
    dto.emails = card.emails;
    dto.address = card.address;
    dto.websites = card.websites;
    dto.socialLinks = card.socialLinks;
    dto.bio = card.bio;
    dto.avatarPath = card.avatarPath;
    dto.bannerPath = card.bannerPath;
    dto.bgImagePath = card.bgImagePath;
    dto.bgColor = card.bgColor;
    dto.primaryColor = card.primaryColor;
    dto.textColor = card.textColor;
    dto.avatarShape = card.avatarShape;
    dto.theme = card.theme;
    dto.visibility = card.visibility;
    dto.noIndex = card.noIndex;
    dto.obfuscate = card.obfuscate;
    dto.createdAt = card.createdAt;
    dto.updatedAt = card.updatedAt;
    return dto;
  }
}
