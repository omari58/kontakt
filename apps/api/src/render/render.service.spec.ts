import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RenderService } from './render.service';
import { CardsService } from '../cards/cards.service';
import { SettingsService } from '../settings/settings.service';
import { Visibility, Theme, AvatarShape } from '@prisma/client';

describe('RenderService', () => {
  let service: RenderService;
  let cardsService: CardsService;
  let configService: ConfigService;

  const mockCard = {
    id: 'card-uuid-1',
    slug: 'john-doe',
    userId: 'user-uuid-1',
    name: 'John Doe',
    jobTitle: 'Software Engineer',
    company: 'Acme Corp',
    phones: [{ number: '+1234567890', label: 'Work' }],
    emails: [{ email: 'john@example.com', label: 'Work' }],
    address: { street: '123 Main St', city: 'Springfield', country: 'US', zip: '12345' },
    websites: [{ url: 'https://example.com' }],
    socialLinks: [{ platform: 'github', url: 'https://github.com/johndoe' }],
    bio: 'Hello, I am John.',
    avatarPath: '/uploads/avatar.jpg',
    bannerPath: '/uploads/banner.jpg',
    bgImagePath: null,
    bgColor: '#ffffff',
    primaryColor: '#0066cc',
    textColor: '#333333',
    avatarShape: AvatarShape.CIRCLE,
    theme: Theme.LIGHT,
    visibility: Visibility.PUBLIC,
    noIndex: false,
    obfuscate: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const minimalCard = {
    id: 'card-uuid-2',
    slug: 'jane-doe',
    userId: 'user-uuid-1',
    name: 'Jane Doe',
    jobTitle: null,
    company: null,
    phones: null,
    emails: null,
    address: null,
    websites: null,
    socialLinks: null,
    bio: null,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenderService,
        {
          provide: CardsService,
          useValue: {
            findBySlug: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:4000'),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getAll: jest.fn().mockReturnValue(
              new Map<string, string | null>([
                ['default_primary_color', '#0F172A'],
                ['default_secondary_color', '#3B82F6'],
                ['default_bg_color', '#FFFFFF'],
                ['default_theme', 'light'],
                ['default_avatar_shape', 'circle'],
                ['allow_user_color_override', 'true'],
                ['allow_user_background_image', 'true'],
              ]),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<RenderService>(RenderService);
    cardsService = module.get<CardsService>(CardsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCardViewData', () => {
    it('should return view data for a fully populated card', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(cardsService.findBySlug).toHaveBeenCalledWith('john-doe');
      expect(result.card).toBeDefined();
      expect(result.card.name).toBe('John Doe');
      expect(result.card.jobTitle).toBe('Software Engineer');
      expect(result.card.company).toBe('Acme Corp');
      expect(result.card.phones).toEqual([{ number: '+1234567890', label: 'Work' }]);
      expect(result.card.emails).toEqual([{ email: 'john@example.com', label: 'Work' }]);
      expect(result.card.socialLinks).toEqual([{ platform: 'github', url: 'https://github.com/johndoe' }]);
      expect(result.card.bio).toBe('Hello, I am John.');
    });

    it('should include correct OG meta tags', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.og).toBeDefined();
      expect(result.og.title).toBe('John Doe - Acme Corp');
      expect(result.og.description).toBe('Software Engineer at Acme Corp');
      expect(result.og.url).toContain('/c/john-doe');
      expect(result.og.type).toBe('profile');
    });

    it('should handle OG title without company', async () => {
      const cardNoCompany = { ...mockCard, company: null };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(cardNoCompany);

      const result = await service.getCardViewData('john-doe');

      expect(result.og.title).toBe('John Doe');
      expect(result.og.description).toBe('Software Engineer');
    });

    it('should handle OG description without jobTitle', async () => {
      const cardNoJob = { ...mockCard, jobTitle: null };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(cardNoJob);

      const result = await service.getCardViewData('john-doe');

      expect(result.og.description).toBe('Acme Corp');
    });

    it('should include OG image when avatar exists', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.og.image).toContain('/uploads/avatar.jpg');
    });

    it('should set noIndex true when card has noIndex flag', async () => {
      const noIndexCard = { ...mockCard, noIndex: true };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(noIndexCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.noIndex).toBe(true);
    });

    it('should set noIndex true when card visibility is UNLISTED', async () => {
      const unlistedCard = { ...mockCard, visibility: Visibility.UNLISTED };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(unlistedCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.noIndex).toBe(true);
    });

    it('should throw NotFoundException for DISABLED cards', async () => {
      const disabledCard = { ...mockCard, visibility: Visibility.DISABLED };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(disabledCard);

      await expect(service.getCardViewData('john-doe')).rejects.toThrow(NotFoundException);
    });

    it('should render UNLISTED cards normally (except noIndex)', async () => {
      const unlistedCard = { ...mockCard, visibility: Visibility.UNLISTED, noIndex: false };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(unlistedCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.card.name).toBe('John Doe');
      expect(result.noIndex).toBe(true);
    });

    it('should handle minimal card (name only)', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(minimalCard);

      const result = await service.getCardViewData('jane-doe');

      expect(result.card.name).toBe('Jane Doe');
      expect(result.card.phones).toBeNull();
      expect(result.card.emails).toBeNull();
      expect(result.card.socialLinks).toBeNull();
      expect(result.card.bio).toBeNull();
      expect(result.og.title).toBe('Jane Doe');
      expect(result.og.description).toBe('');
    });

    it('should propagate NotFoundException from CardsService', async () => {
      (cardsService.findBySlug as jest.Mock).mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(service.getCardViewData('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should include JSON-LD structured data', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.jsonLd).toBeDefined();
      const jsonLd = JSON.parse(result.jsonLd);
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Person');
      expect(jsonLd.name).toBe('John Doe');
      expect(jsonLd.jobTitle).toBe('Software Engineer');
      expect(jsonLd.worksFor.name).toBe('Acme Corp');
    });

    it('should include CSS variables from card colors', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.cssVars).toBeDefined();
      expect(result.cssVars).toContain('--bg-color: #ffffff');
      expect(result.cssVars).toContain('--primary-color: #0066cc');
      expect(result.cssVars).toContain('--text-color: #333333');
    });

    it('should include avatar shape class', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.card.avatarShapeClass).toBe('circle');
    });

    it('should use rounded-square avatar shape class', async () => {
      const roundedCard = { ...mockCard, avatarShape: AvatarShape.ROUNDED_SQUARE };
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(roundedCard);

      const result = await service.getCardViewData('jane-doe');

      expect(result.card.avatarShapeClass).toBe('rounded-square');
    });

    it('should include card URL for sharing', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.cardUrl).toContain('/c/john-doe');
    });

    it('should include vcf download URL', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.vcfUrl).toContain('/api/cards/john-doe/vcf');
    });

    it('should include theme class', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.getCardViewData('john-doe');

      expect(result.themeClass).toBe('theme-light');
    });

    it('should default to light theme when theme is null', async () => {
      (cardsService.findBySlug as jest.Mock).mockResolvedValue(minimalCard);

      const result = await service.getCardViewData('jane-doe');

      expect(result.themeClass).toBe('theme-light');
    });
  });
});
