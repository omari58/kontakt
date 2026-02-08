import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { SETTINGS_KEYS } from './settings.constants';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockSettings = [
    { key: 'org_name', value: 'My Company' },
    { key: 'default_theme', value: 'dark' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: {
            setting: {
              findMany: jest.fn().mockResolvedValue(mockSettings),
              upsert: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should load all settings into cache on init', async () => {
      await service.onModuleInit();

      expect(prisma.setting.findMany).toHaveBeenCalled();
      expect(service.get('org_name')).toBe('My Company');
      expect(service.get('default_theme')).toBe('dark');
    });
  });

  describe('get', () => {
    it('should return cached value for existing key', async () => {
      await service.onModuleInit();

      expect(service.get('org_name')).toBe('My Company');
    });

    it('should return default value for missing key', async () => {
      await service.onModuleInit();

      expect(service.get('default_primary_color')).toBe(
        SETTINGS_KEYS.DEFAULT_PRIMARY_COLOR.default,
      );
    });

    it('should return null for unknown key with no default', () => {
      expect(service.get('nonexistent_key')).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all settings including defaults for missing keys', async () => {
      await service.onModuleInit();

      const all = service.getAll();

      expect(all.get('org_name')).toBe('My Company');
      expect(all.get('default_theme')).toBe('dark');
      expect(all.get('default_primary_color')).toBe(
        SETTINGS_KEYS.DEFAULT_PRIMARY_COLOR.default,
      );
    });
  });

  describe('update', () => {
    it('should write to DB and update cache', async () => {
      await service.onModuleInit();

      (prisma.setting.upsert as jest.Mock).mockResolvedValue({
        key: 'org_name',
        value: 'New Name',
      });

      await service.update('org_name', 'New Name');

      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'org_name' },
        update: { value: 'New Name' },
        create: { key: 'org_name', value: 'New Name' },
      });
      expect(service.get('org_name')).toBe('New Name');
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple settings in a transaction', async () => {
      await service.onModuleInit();

      const entries = [
        { key: 'org_name', value: 'Bulk Name' },
        { key: 'default_theme', value: 'light' },
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue([]);

      await service.bulkUpdate(entries);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Array),
      );
      const txArg = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(txArg).toHaveLength(2);
      expect(prisma.setting.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'org_name' },
        update: { value: 'Bulk Name' },
        create: { key: 'org_name', value: 'Bulk Name' },
      });
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'default_theme' },
        update: { value: 'light' },
        create: { key: 'default_theme', value: 'light' },
      });
      expect(service.get('org_name')).toBe('Bulk Name');
      expect(service.get('default_theme')).toBe('light');
    });
  });
});
