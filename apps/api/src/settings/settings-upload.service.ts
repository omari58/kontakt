import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import { STORAGE_PROVIDER } from '../storage/storage.constants';
import { StorageProvider } from '../storage/storage.interface';
import { SettingsService } from './settings.service';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class SettingsUploadService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly settingsService: SettingsService,
  ) {}

  async uploadLogo(file: Express.Multer.File): Promise<{ path: string }> {
    this.validateImageFile(file);

    const key = 'settings/logo.webp';
    const buffer = await sharp(file.buffer)
      .resize(200, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp()
      .toBuffer();

    await this.storage.save(key, buffer);
    const publicPath = this.storage.getPublicUrl(key);
    await this.settingsService.update('org_logo', publicPath);

    return { path: publicPath };
  }

  async uploadFavicon(file: Express.Multer.File): Promise<{ path: string }> {
    this.validateImageFile(file);

    const key32 = 'settings/favicon-32.png';
    const key180 = 'settings/favicon-180.png';

    const buffer32 = await sharp(file.buffer)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toBuffer();

    const buffer180 = await sharp(file.buffer)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toBuffer();

    await Promise.all([
      this.storage.save(key32, buffer32),
      this.storage.save(key180, buffer180),
    ]);

    const publicPath = this.storage.getPublicUrl(key32);
    await this.settingsService.update('org_favicon', publicPath);

    return { path: publicPath };
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WebP',
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Max: ${MAX_FILE_SIZE} bytes`);
    }
  }
}
