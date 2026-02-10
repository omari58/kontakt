import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/cards.service';
import * as sharp from 'sharp';
import { STORAGE_PROVIDER } from '../storage/storage.constants';
import { StorageProvider } from '../storage/storage.interface';
import { Card } from '@prisma/client';

export type ImageType = 'avatar' | 'banner' | 'background';

const IMAGE_CONFIGS: Record<ImageType, { width: number; height?: number; fit: keyof sharp.FitEnum }> = {
  avatar: { width: 400, height: 400, fit: 'cover' },
  banner: { width: 1200, fit: 'inside' },
  background: { width: 1920, fit: 'inside' },
};

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
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
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

    const card = await this.cardsService.findOne(cardId, userId);

    const key = `cards/${cardId}/${type}.webp`;
    const dbField = DB_FIELD_MAP[type];

    if (card[dbField]) {
      await this.storage.delete(key);
    }

    const config = IMAGE_CONFIGS[type];
    const resizeOptions: sharp.ResizeOptions = { fit: config.fit };
    if (config.fit !== 'cover') {
      resizeOptions.withoutEnlargement = true;
    }

    const buffer = await sharp(file.buffer)
      .resize(config.width, config.height, resizeOptions)
      .webp()
      .toBuffer();

    await this.storage.save(key, buffer);

    const publicPath = this.storage.getPublicUrl(key);

    await this.prisma.card.update({
      where: { id: cardId },
      data: { [dbField]: publicPath },
    });

    return { path: publicPath };
  }

  async deleteImage(cardId: string, userId: string, type: ImageType): Promise<void> {
    await this.cardsService.findOne(cardId, userId);
    const dbField = DB_FIELD_MAP[type];
    const key = `cards/${cardId}/${type}.webp`;
    await this.storage.delete(key);
    await this.prisma.card.update({ where: { id: cardId }, data: { [dbField]: null } });
  }
}
