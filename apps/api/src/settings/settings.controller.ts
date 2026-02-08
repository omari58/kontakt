import {
  Controller,
  Get,
  Put,
  Post,
  Body,
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

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SettingsController {
  private readonly uploadDir: string;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  @Get()
  getAllSettings(): Record<string, string | null> {
    const all = this.settingsService.getAll();
    return Object.fromEntries(all);
  }

  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto): Promise<void> {
    await this.settingsService.bulkUpdate(dto.settings);
  }

  @Post('logo')
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
