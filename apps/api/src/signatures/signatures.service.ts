import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { UpdateSignatureDto } from './dto/update-signature.dto';
import { SignatureWithCard } from './dto/signature-response.dto';

const includeCard = { card: true } as const;

@Injectable()
export class SignaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSignatureDto): Promise<SignatureWithCard> {
    const card = await this.prisma.card.findFirst({
      where: { id: dto.cardId, userId },
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const { cardId, config, ...rest } = dto;
    const result = await this.prisma.signature.create({
      data: {
        ...rest,
        cardId,
        userId,
        ...(config !== undefined && { config: config as unknown as Prisma.InputJsonValue }),
      },
      include: includeCard,
    });
    return result as SignatureWithCard;
  }

  async findAllByUser(userId: string): Promise<SignatureWithCard[]> {
    const results = await this.prisma.signature.findMany({
      where: { userId },
      include: includeCard,
      orderBy: { createdAt: 'desc' },
    });
    return results as SignatureWithCard[];
  }

  async findOne(id: string, userId: string): Promise<SignatureWithCard> {
    const signature = await this.prisma.signature.findFirst({
      where: { id, userId },
      include: includeCard,
    });
    if (!signature) {
      throw new NotFoundException('Signature not found');
    }
    return signature as SignatureWithCard;
  }

  async update(id: string, userId: string, dto: UpdateSignatureDto): Promise<SignatureWithCard> {
    await this.findOne(id, userId);

    const { config, ...rest } = dto;
    const result = await this.prisma.signature.update({
      where: { id },
      data: {
        ...rest,
        ...(config !== undefined && { config: config as unknown as Prisma.InputJsonValue }),
      },
      include: includeCard,
    });
    return result as SignatureWithCard;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.signature.delete({ where: { id } });
  }
}
