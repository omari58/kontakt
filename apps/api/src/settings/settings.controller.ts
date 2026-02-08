import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Header,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SETTINGS_KEYS } from './settings.constants';

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const KNOWN_KEYS = new Set<string>(
  Object.values(SETTINGS_KEYS).map((s) => s.key),
);

const PUBLIC_SETTINGS_KEYS = [
  'org_name',
  'org_logo',
  'org_favicon',
  'default_primary_color',
  'default_secondary_color',
  'default_bg_color',
  'default_theme',
  'default_avatar_shape',
  'footer_text',
  'footer_link',
];

@Controller('settings')
export class SettingsController {
  private readonly uploadDir: string;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  @Get('public')
  @Header('Cache-Control', 'public, max-age=300')
  getPublicSettings(): Record<string, string | null> {
    const all = this.settingsService.getAll();
    const result: Record<string, string | null> = {};
    for (const key of PUBLIC_SETTINGS_KEYS) {
      if (all.has(key)) {
        result[key] = all.get(key)!;
      }
    }
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllSettings(): Record<string, string | null> {
    const all = this.settingsService.getAll();
    return Object.fromEntries(all);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateSettings(@Body() dto: UpdateSettingsDto): Promise<void> {
    const unknownKeys = dto.settings
      .map((s) => s.key)
      .filter((k) => !KNOWN_KEYS.has(k));
    if (unknownKeys.length > 0) {
      throw new BadRequestException(
        `Unknown setting keys: ${unknownKeys.join(', ')}`,
      );
    }
    await this.settingsService.bulkUpdate(dto.settings);
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    this.validateImageFile(file);

    const settingsDir = path.join(this.uploadDir, 'settings');
    await fs.mkdir(settingsDir, { recursive: true });

    const filename = 'logo.webp';
    const filePath = path.join(settingsDir, filename);
    const publicPath = `/uploads/settings/${filename}`;

    await sharp(file.buffer)
      .resize(200, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp()
      .toFile(filePath);

    await this.settingsService.update('org_logo', publicPath);

    return { path: publicPath };
  }

  @Post('favicon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    this.validateImageFile(file);

    const settingsDir = path.join(this.uploadDir, 'settings');
    await fs.mkdir(settingsDir, { recursive: true });

    const filename32 = 'favicon-32.png';
    const filename180 = 'favicon-180.png';
    const publicPath = `/uploads/settings/${filename32}`;

    await sharp(file.buffer)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(path.join(settingsDir, filename32));

    await sharp(file.buffer)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(path.join(settingsDir, filename180));

    await this.settingsService.update('org_favicon', publicPath);

    return { path: publicPath };
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WebP, SVG',
      );
    }
  }
}
