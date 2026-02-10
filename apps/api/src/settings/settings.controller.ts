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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { SettingsUploadService } from './settings-upload.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SETTINGS_KEYS } from './settings.constants';

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
  constructor(
    private readonly settingsService: SettingsService,
    private readonly settingsUploadService: SettingsUploadService,
  ) {}

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
    return this.settingsUploadService.uploadLogo(file);
  }

  @Post('favicon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    return this.settingsUploadService.uploadFavicon(file);
  }
}
