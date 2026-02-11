import { Card } from '@prisma/client';
import { PhoneDto, EmailDto, AddressDto, SocialLinkDto } from './create-card.dto';

export class CardResponseDto {
  id!: string;
  slug!: string;
  userId!: string;
  name!: string;
  jobTitle!: string | null;
  company!: string | null;
  phones!: PhoneDto[] | null;
  emails!: EmailDto[] | null;
  address!: AddressDto | null;
  websites!: string[] | null;
  socialLinks!: SocialLinkDto[] | null;
  bio!: string | null;
  pronouns!: string | null;
  calendarUrl!: string | null;
  calendarText!: string | null;
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

  static fromCard(card: Card & Record<string, unknown>): CardResponseDto {
    const { user, events, ...cardFields } = card as Card & { user?: unknown; events?: unknown };
    const dto = new CardResponseDto();
    Object.assign(dto, cardFields);
    return dto;
  }
}
