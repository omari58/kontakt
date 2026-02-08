import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/dto/auth.dto';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';

jest.mock('sharp');
jest.mock('fs/promises');

const mockAdmin: JwtPayload = {
  sub: 'admin-uuid-1',
  email: 'admin@test.com',
  name: 'Admin',
  role: 'ADMIN',
};

describe('SettingsController', () => {
  let controller: SettingsController;
  let settingsService: jest.Mocked<SettingsService>;

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: settingsService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('./uploads') } },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: JwtService, useValue: { verify: jest.fn() } },
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
  });

  describe('POST /settings/logo (uploadLogo)', () => {
    it('should process and store logo image', async () => {
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

      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({}),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.uploadLogo(mockFile);

      expect(sharp).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(200, undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(mockSharpInstance.webp).toHaveBeenCalled();
      expect(settingsService.update).toHaveBeenCalledWith(
        'org_logo',
        expect.stringContaining('/uploads/settings/logo.webp'),
      );
      expect(result).toHaveProperty('path');
    });

    it('should reject non-image files', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'doc.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(controller.uploadLogo(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST /settings/favicon (uploadFavicon)', () => {
    it('should process and store favicon images', async () => {
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

      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({}),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.uploadFavicon(mockFile);

      expect(sharp).toHaveBeenCalledWith(mockFile.buffer);
      // Should create both sizes
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(32, 32, { fit: 'cover' });
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(180, 180, { fit: 'cover' });
      expect(mockSharpInstance.png).toHaveBeenCalled();
      expect(settingsService.update).toHaveBeenCalledWith(
        'org_favicon',
        expect.stringContaining('/uploads/settings/favicon-32.png'),
      );
      expect(result).toHaveProperty('path');
    });
  });
});
