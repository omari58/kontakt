import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsUploadService } from './settings-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('SettingsController', () => {
  let controller: SettingsController;
  let settingsService: jest.Mocked<SettingsService>;
  let settingsUploadService: jest.Mocked<SettingsUploadService>;

  beforeEach(async () => {
    settingsService = {
      get: jest.fn(),
      getAll: jest.fn().mockReturnValue(
        new Map([
          ['org_name', 'Test Org'],
          ['default_theme', 'light'],
        ]),
      ),
      update: jest.fn(),
      bulkUpdate: jest.fn(),
      onModuleInit: jest.fn(),
    } as any;

    settingsUploadService = {
      uploadLogo: jest.fn().mockResolvedValue({ path: '/uploads/settings/logo.webp' }),
      uploadFavicon: jest.fn().mockResolvedValue({ path: '/uploads/settings/favicon-32.png' }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: settingsService },
        { provide: SettingsUploadService, useValue: settingsUploadService },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('1d') } },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /settings (getAllSettings)', () => {
    it('should return all settings as an object', () => {
      const result = controller.getAllSettings();

      expect(settingsService.getAll).toHaveBeenCalled();
      expect(result).toEqual({
        org_name: 'Test Org',
        default_theme: 'light',
      });
    });
  });

  describe('PUT /settings (updateSettings)', () => {
    it('should bulk update settings', async () => {
      const dto = {
        settings: [
          { key: 'org_name', value: 'New Name' },
          { key: 'default_theme', value: 'dark' },
        ],
      };

      await controller.updateSettings(dto);

      expect(settingsService.bulkUpdate).toHaveBeenCalledWith(dto.settings);
    });

    it('should reject unknown setting keys with 400', async () => {
      const dto = {
        settings: [{ key: 'unknown_key', value: 'some value' }],
      };

      await expect(controller.updateSettings(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(settingsService.bulkUpdate).not.toHaveBeenCalled();
    });
  });

  describe('guard metadata', () => {
    it('should have ADMIN role metadata on admin endpoints', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>('roles', SettingsController.prototype.getAllSettings);
      expect(roles).toContain('ADMIN');
    });

    it('should NOT have role metadata on public endpoint', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>('roles', SettingsController.prototype.getPublicSettings);
      expect(roles).toBeUndefined();
    });
  });

  describe('POST /settings/logo (uploadLogo)', () => {
    it('should delegate to settingsUploadService', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'logo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await controller.uploadLogo(mockFile);

      expect(settingsUploadService.uploadLogo).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({ path: '/uploads/settings/logo.webp' });
    });
  });

  describe('GET /settings/public (getPublicSettings)', () => {
    it('should return only whitelisted public settings', () => {
      settingsService.getAll.mockReturnValue(
        new Map([
          ['org_name', 'Test Org'],
          ['org_logo', '/uploads/settings/logo.webp'],
          ['org_favicon', '/uploads/settings/favicon-32.png'],
          ['default_primary_color', '#0F172A'],
          ['default_secondary_color', '#3B82F6'],
          ['default_bg_color', '#FFFFFF'],
          ['default_theme', 'light'],
          ['default_avatar_shape', 'circle'],
          ['allow_user_color_override', 'true'],
          ['allow_user_background_image', 'true'],
          ['default_visibility', 'public'],
          ['footer_text', 'Powered by Kontakt'],
          ['footer_link', 'https://kontakt.dev'],
        ]),
      );

      const result = controller.getPublicSettings();

      expect(result).toEqual({
        org_name: 'Test Org',
        org_logo: '/uploads/settings/logo.webp',
        org_favicon: '/uploads/settings/favicon-32.png',
        default_primary_color: '#0F172A',
        default_secondary_color: '#3B82F6',
        default_bg_color: '#FFFFFF',
        default_theme: 'light',
        default_avatar_shape: 'circle',
        footer_text: 'Powered by Kontakt',
        footer_link: 'https://kontakt.dev',
      });
    });

    it('should NOT expose admin-only settings', () => {
      settingsService.getAll.mockReturnValue(
        new Map([
          ['org_name', 'Test Org'],
          ['allow_user_color_override', 'true'],
          ['allow_user_background_image', 'true'],
          ['default_visibility', 'public'],
        ]),
      );

      const result = controller.getPublicSettings();

      expect(result).not.toHaveProperty('allow_user_color_override');
      expect(result).not.toHaveProperty('allow_user_background_image');
      expect(result).not.toHaveProperty('default_visibility');
    });
  });

  describe('POST /settings/favicon (uploadFavicon)', () => {
    it('should delegate to settingsUploadService', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'favicon.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await controller.uploadFavicon(mockFile);

      expect(settingsUploadService.uploadFavicon).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({ path: '/uploads/settings/favicon-32.png' });
    });
  });
});
