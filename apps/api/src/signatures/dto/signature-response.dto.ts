import { Signature, Card } from '@prisma/client';

export interface CardSummary {
  id: string;
  name: string;
  slug: string;
  avatarPath: string | null;
}

export type SignatureWithCard = Signature & { card: Card };

export class SignatureResponseDto {
  id!: string;
  name!: string;
  cardId!: string;
  userId!: string;
  layout!: string;
  config!: Record<string, unknown>;
  card!: CardSummary;
  createdAt!: Date;
  updatedAt!: Date;

  static fromSignature(signature: SignatureWithCard): SignatureResponseDto {
    const dto = new SignatureResponseDto();
    dto.id = signature.id;
    dto.name = signature.name;
    dto.cardId = signature.cardId;
    dto.userId = signature.userId;
    dto.layout = signature.layout;
    dto.config = signature.config as Record<string, unknown>;
    dto.card = {
      id: signature.card.id,
      name: signature.card.name,
      slug: signature.card.slug,
      avatarPath: signature.card.avatarPath,
    };
    dto.createdAt = signature.createdAt;
    dto.updatedAt = signature.updatedAt;
    return dto;
  }
}
