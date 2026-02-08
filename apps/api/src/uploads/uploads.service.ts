import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/cards.service';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

export type ImageType = 'avatar' | 'banner' | 'background';

const IMAGE_CONFIGS: Record<ImageType, { width: number; height?: number; fit: keyof sharp.FitEnum }> = {
  avatar: { width: 400, height: 400, fit: 'cover' },
  banner: { width: 1200, fit: 'inside' },
  background: { width: 1920, fit: 'inside' },
};

import { Card } from '@prisma/client';

const DB_FIELD_MAP: Record<ImageType, keyof Pick<Card, 'avatarPath' | 'bannerPath' | 'bgImagePath'>> = {
  avatar: 'avatarPath',
  banner: 'bannerPath',
  background: 'bgImagePath',
};

@Injectable()
export class UploadsService {
  constructor(
    private readonly cardsService: CardsService,
    private readonly prisma: PrismaService,
    private readonly uploadDir: string,
  ) {}

  async upload(
    cardId: string,
    userId: string,
    type: ImageType,
    file: Express.Multer.File,
  ): Promise<{ path: string }> {
    if (!IMAGE_CONFIGS[type]) {
      throw new BadRequestException(`Invalid image type: ${type}. Allowed: avatar, banner, background`);
    }

    // Verify ownership (throws 404/403 if not authorized)
    const card = await this.cardsService.findOne(cardId, userId);

    const cardDir = path.join(this.uploadDir, 'cards', cardId);
    await fs.mkdir(cardDir, { recursive: true });

    const filename = `${type}.webp`;
    const filePath = path.join(cardDir, filename);
    const publicPath = `/uploads/cards/${cardId}/${filename}`;

    // Delete old image if it exists (construct path deterministically)
    const dbField = DB_FIELD_MAP[type];
    const oldPath = card[dbField];
    if (oldPath) {
      const oldFilePath = path.join(cardDir, `${type}.webp`);
      await this.deleteFileIfExists(oldFilePath);
    }

    // Process image with sharp
    const config = IMAGE_CONFIGS[type];
    const resizeOptions: sharp.ResizeOptions = { fit: config.fit };
    if (config.fit !== 'cover') {
      resizeOptions.withoutEnlargement = true;
    }

    await sharp(file.buffer)
      .resize(config.width, config.height, resizeOptions)
      .webp()
      .toFile(filePath);

    // Update card record
    await this.prisma.card.update({
      where: { id: cardId },
      data: { [dbField]: publicPath },
    });

    return { path: publicPath };
  }

  private async deleteFileIfExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist, nothing to delete
    }
  }
}
