import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Card, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { generateSlug } from './slug.util';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCardDto): Promise<Card> {
    const slug = await this.findUniqueSlug(generateSlug(dto.name));
    const { phones, emails, websites, socialLinks, address, ...rest } = dto;

    const data: Prisma.CardUncheckedCreateInput = {
      ...rest,
      userId,
      slug,
      phones: phones as unknown as Prisma.InputJsonValue,
      emails: emails as unknown as Prisma.InputJsonValue,
      websites: websites as unknown as Prisma.InputJsonValue,
      socialLinks: socialLinks as unknown as Prisma.InputJsonValue,
      address: address as unknown as Prisma.InputJsonValue,
    };

    try {
      return await this.prisma.card.create({ data });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictException('Slug is already taken. Please try again.');
      }
      throw error;
    }
  }

  async findAll(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ data: Card[]; total: number; page: number; limit: number }> {
    const { page, limit, search } = options;
    const where: Prisma.CardWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.card.count({ where }),
    ]);

    return { data: data as Card[], total, page, limit };
  }

  async findAllByUser(userId: string): Promise<Card[]> {
    return this.prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Card> {
    const card = await this.prisma.card.findUnique({ where: { id } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have access to this card');
    }
    return card;
  }

  async findBySlug(slug: string): Promise<Card> {
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card;
  }

  async update(id: string, userId: string, dto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id, userId);

    if (dto.slug) {
      await this.ensureSlugAvailable(dto.slug, card.id);
    }

    const { phones, emails, websites, socialLinks, address, ...rest } = dto;
    const data: Prisma.CardUncheckedUpdateInput = {
      ...rest,
      ...(phones !== undefined && { phones: phones as unknown as Prisma.InputJsonValue }),
      ...(emails !== undefined && { emails: emails as unknown as Prisma.InputJsonValue }),
      ...(websites !== undefined && { websites: websites as unknown as Prisma.InputJsonValue }),
      ...(socialLinks !== undefined && { socialLinks: socialLinks as unknown as Prisma.InputJsonValue }),
      ...(address !== undefined && { address: address as unknown as Prisma.InputJsonValue }),
    };

    return this.prisma.card.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.card.delete({ where: { id } });
  }

  private async findUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 2;

    while (await this.prisma.card.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    return slug;
  }

  private async ensureSlugAvailable(slug: string, currentCardId: string): Promise<void> {
    const existing = await this.prisma.card.findFirst({ where: { slug } });
    if (existing && existing.id !== currentCardId) {
      throw new ConflictException('Slug is already taken');
    }
  }
}
