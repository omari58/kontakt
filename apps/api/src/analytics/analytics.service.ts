import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType } from '@prisma/client';
import { createHash } from 'crypto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordView(slug: string, ip: string): Promise<void> {
    try {
      const card = await this.prisma.card.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!card) {
        return;
      }

      const ipHash = this.hashIp(ip);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentView = await this.prisma.analyticsEvent.findFirst({
        where: {
          cardId: card.id,
          type: EventType.VIEW,
          ipHash,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (recentView) {
        return;
      }

      await this.prisma.analyticsEvent.create({
        data: {
          cardId: card.id,
          type: EventType.VIEW,
          ipHash,
        },
      });
    } catch {
      // Silently fail — fire-and-forget
    }
  }

  private hashIp(ip: string): string {
    const dailySalt = new Date().toISOString().split('T')[0];
    return createHash('sha256').update(`${ip}:${dailySalt}`).digest('hex');
  }
}
