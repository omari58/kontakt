import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CardsService } from '../cards/cards.service';
import { STORAGE_PROVIDER } from '../storage/storage.constants';
import { StorageProvider } from '../storage/storage.interface';
import { Visibility } from '@prisma/client';

describe('ContactsService', () => {
  let service: ContactsService;
  let cardsService: CardsService;
  let storage: jest.Mocked<StorageProvider>;

  const mockCard = {
    id: 'card-uuid-1',
    slug: 'john-doe',
    userId: 'user-uuid-1',
    name: 'John Doe',
    jobTitle: 'Software Engineer',
    company: 'Acme Corp',
    phones: [{ number: '+1-555-0100', label: 'work' }],
    emails: [{ email: 'john@acme.com', label: 'work' }],
    address: { street: '123 Main St', city: 'Springfield', country: 'US', zip: '62701' },
    websites: [{ url: 'https://johndoe.com' }],
    socialLinks: [{ platform: 'twitter', url: 'https://twitter.com/johndoe' }],
    bio: 'A passionate developer',
    avatarPath: null,
    bannerPath: null,
    bgImagePath: null,
    bgColor: null,
    primaryColor: null,
    textColor: null,
    avatarShape: null,
    theme: null,
    visibility: Visibility.PUBLIC,
    noIndex: false,
    obfuscate: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    storage = {
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue(null),
      getPublicUrl: jest.fn((key: string) => `/uploads/${key}`),
      extractKey: jest.fn((url: string) => url.replace(/^\/uploads\//, '')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: CardsService,
          useValue: {
            findBySlug: jest.fn(),
          },
        },
        {
          provide: STORAGE_PROVIDER,
          useValue: storage,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    cardsService = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateVCard', () => {
    it('should generate a vCard for a valid slug', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.generateVCard('john-doe');

      expect(cardsService.findBySlug).toHaveBeenCalledWith('john-doe');
      expect(result.vcf).toContain('BEGIN:VCARD');
      expect(result.vcf).toContain('FN:John Doe');
      expect(result.vcf).toContain('TITLE:Software Engineer');
      expect(result.vcf).toContain('ORG:Acme Corp');
      expect(result.vcf).toContain('TEL;TYPE=work:+1-555-0100');
      expect(result.vcf).toContain('END:VCARD');
      expect(result.filename).toBe('John Doe');
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      (cardsService.findBySlug as jest.Mock).mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(service.generateVCard('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should embed avatar as base64 when avatarPath exists', async () => {
      const cardWithAvatar = { ...mockCard, avatarPath: '/uploads/cards/card-uuid-1/avatar.webp' };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(cardWithAvatar);

      const mockBuffer = Buffer.from('fake-image-data');
      storage.read.mockResolvedValue(mockBuffer);

      const result = await service.generateVCard('john-doe');

      expect(storage.read).toHaveBeenCalledWith('cards/card-uuid-1/avatar.webp');
      expect(result.vcf).toContain('PHOTO:data:image/webp;base64,');
      expect(result.vcf).toContain(mockBuffer.toString('base64'));
    });

    it('should skip avatar when file does not exist on disk', async () => {
      const cardWithAvatar = { ...mockCard, avatarPath: '/uploads/cards/card-uuid-1/missing.webp' };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(cardWithAvatar);
      storage.read.mockResolvedValue(null);

      const result = await service.generateVCard('john-doe');

      expect(result.vcf).not.toContain('PHOTO');
    });

    it('should generate vCard for minimal card (name only)', async () => {
      const minimalCard = {
        ...mockCard,
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(minimalCard);

      const result = await service.generateVCard('john-doe');

      expect(result.vcf).toContain('BEGIN:VCARD');
      expect(result.vcf).toContain('FN:John Doe');
      expect(result.vcf).toContain('END:VCARD');
      expect(result.vcf).not.toContain('TITLE');
      expect(result.vcf).not.toContain('ORG');
      expect(result.vcf).not.toContain('TEL');
      expect(result.filename).toBe('John Doe');
    });
  });
});
