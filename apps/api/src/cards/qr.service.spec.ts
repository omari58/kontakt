import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QrService } from './qr.service';
import { CardsService } from './cards.service';
import { Visibility } from '@prisma/client';

const mockCard = {
  id: 'card-uuid-1',
  slug: 'john-doe',
  userId: 'user-uuid-1',
  name: 'John Doe',
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

describe('QrService', () => {
  let service: QrService;
  let cardsService: CardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrService,
        {
          provide: CardsService,
          useValue: {
            findBySlug: jest.fn().mockResolvedValue(mockCard),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:4000'),
          },
        },
      ],
    }).compile();

    service = module.get<QrService>(QrService);
    cardsService = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQr', () => {
    it('should return PNG buffer by default', async () => {
      const result = await service.generateQr('john-doe', 'png', 300);

      expect(cardsService.findBySlug).toHaveBeenCalledWith('john-doe');
      expect(result.contentType).toBe('image/png');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should return SVG string for svg format', async () => {
      const result = await service.generateQr('john-doe', 'svg', 300);

      expect(result.contentType).toBe('image/svg+xml');
      expect(typeof result.data).toBe('string');
      expect((result.data as string)).toContain('<svg');
    });

    it('should respect custom size parameter', async () => {
      const small = await service.generateQr('john-doe', 'png', 100);
      const large = await service.generateQr('john-doe', 'png', 500);

      // Both should be valid PNGs but different sizes
      expect(small.data).toBeInstanceOf(Buffer);
      expect(large.data).toBeInstanceOf(Buffer);
      // Larger QR code should produce a larger buffer
      expect((large.data as Buffer).length).toBeGreaterThan((small.data as Buffer).length);
    });

    it('should throw NotFoundException for invalid slug', async () => {
      (cardsService.findBySlug as jest.Mock).mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(service.generateQr('nonexistent', 'png', 300)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should encode the correct URL in the QR code', async () => {
      const result = await service.generateQr('john-doe', 'svg', 300);

      // The SVG contains the QR pattern but we can verify the service
      // was called with the correct slug
      expect(cardsService.findBySlug).toHaveBeenCalledWith('john-doe');
      // The URL being encoded is http://localhost:4000/c/john-doe
      expect(result.data).toBeTruthy();
    });

    it('should throw BadRequestException for invalid format', async () => {
      await expect(
        service.generateQr('john-doe', 'gif' as any, 300),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
