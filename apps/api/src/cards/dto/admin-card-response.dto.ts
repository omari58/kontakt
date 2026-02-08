import { Card } from '@prisma/client';
import { CardResponseDto } from './card-response.dto';

export class AdminCardResponseDto extends CardResponseDto {
  user!: { name: string; email: string };

  static fromCardWithUser(
    card: Card & { user: { name: string; email: string } } & Record<string, unknown>,
  ): AdminCardResponseDto {
    const { user, events, ...cardFields } = card as Card & {
      user: { name: string; email: string };
      events?: unknown;
    };
    const dto = new AdminCardResponseDto();
    Object.assign(dto, cardFields);
    dto.user = user;
    return dto;
  }
}
