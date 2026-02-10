import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CardsService } from '../cards/cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProvider } from '../storage/storage.interface';
import * as sharp from 'sharp';

jest.mock('sharp');

const mockSharp = sharp as unknown as jest.Mock;

describe('UploadsService', () => {
  let service: UploadsService;
  let cardsService: jest.Mocked<CardsService>;
  let prisma: { card: { update: jest.Mock } };
  let storage: jest.Mocked<StorageProvider>;

  const userId = 'user-uuid-1';
  const cardId = 'card-uuid-1';

  const mockCard = {
    id: cardId,
    userId,
    slug: 'test-card',
    name: 'Test Card',
    avatarPath: null,
    bannerPath: null,
    bgImagePath: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    cardsService = {
      findOne: jest.fn().mockResolvedValue(mockCard),
    } as any;

    prisma = {
      card: {
        update: jest.fn().mockResolvedValue({ ...mockCard, avatarPath: '/uploads/cards/card-uuid-1/avatar.webp' }),
      },
    };

    storage = {
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue(null),
      getPublicUrl: jest.fn((key: string) => `/uploads/${key}`),
      extractKey: jest.fn((url: string) => url.replace(/^\/uploads\//, '')),
    };

    service = new UploadsService(
      cardsService,
      prisma as unknown as PrismaService,
      storage,
    );

    // Mock sharp chain
    const sharpInstance = {
      resize: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(512)),
    };
    mockSharp.mockReturnValue(sharpInstance);
  });

  function makeFile(mimetype = 'image/jpeg'): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'avatar.jpg',
      encoding: '7bit',
      mimetype,
      size: 1024,
      buffer: Buffer.alloc(1024),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };
  }

  describe('upload', () => {
    it('should process and store an avatar image', async () => {
      const file = makeFile();
      const result = await service.upload(cardId, userId, 'avatar', file);

      expect(cardsService.findOne).toHaveBeenCalledWith(cardId, userId);
      expect(mockSharp).toHaveBeenCalledWith(file.buffer);
      expect(storage.save).toHaveBeenCalledWith(`cards/${cardId}/avatar.webp`, expect.any(Buffer));
      expect(result.path).toContain('avatar.webp');
      expect(prisma.card.update).toHaveBeenCalled();
    });

    it('should process and store a banner image', async () => {
      const file = makeFile();
      const result = await service.upload(cardId, userId, 'banner', file);

      expect(result.path).toContain('banner.webp');
    });

    it('should process and store a background image', async () => {
      const file = makeFile();
      const result = await service.upload(cardId, userId, 'background', file);

      expect(result.path).toContain('background.webp');
    });

    it('should apply correct dimensions for avatar (400x400 square)', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'avatar', file);

      const sharpInstance = mockSharp.mock.results[0].value;
      expect(sharpInstance.resize).toHaveBeenCalledWith(400, 400, { fit: 'cover' });
    });

    it('should apply correct dimensions for banner (max 1200 wide)', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'banner', file);

      const sharpInstance = mockSharp.mock.results[0].value;
      expect(sharpInstance.resize).toHaveBeenCalledWith(1200, undefined, { fit: 'inside', withoutEnlargement: true });
    });

    it('should apply correct dimensions for background (max 1920 wide)', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'background', file);

      const sharpInstance = mockSharp.mock.results[0].value;
      expect(sharpInstance.resize).toHaveBeenCalledWith(1920, undefined, { fit: 'inside', withoutEnlargement: true });
    });

    it('should convert to WebP format', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'avatar', file);

      const sharpInstance = mockSharp.mock.results[0].value;
      expect(sharpInstance.webp).toHaveBeenCalled();
    });

    it('should delete old image when replacing', async () => {
      const cardWithExisting = { ...mockCard, avatarPath: '/uploads/cards/card-uuid-1/avatar.webp' };
      cardsService.findOne.mockResolvedValue(cardWithExisting as any);

      const file = makeFile();
      await service.upload(cardId, userId, 'avatar', file);

      expect(storage.delete).toHaveBeenCalledWith(`cards/${cardId}/avatar.webp`);
    });

    it('should propagate NotFoundException from CardsService', async () => {
      cardsService.findOne.mockRejectedValue(new NotFoundException('Card not found'));

      const file = makeFile();
      await expect(service.upload(cardId, userId, 'avatar', file)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from CardsService', async () => {
      cardsService.findOne.mockRejectedValue(new ForbiddenException('You do not have access to this card'));

      const file = makeFile();
      await expect(service.upload('other-card', 'other-user', 'avatar', file)).rejects.toThrow(ForbiddenException);
    });

    it('should update the card record with the file path', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'avatar', file);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { avatarPath: expect.stringContaining('avatar.webp') },
      });
    });

    it('should update bannerPath for banner uploads', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'banner', file);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { bannerPath: expect.stringContaining('banner.webp') },
      });
    });

    it('should update bgImagePath for background uploads', async () => {
      const file = makeFile();
      await service.upload(cardId, userId, 'background', file);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { bgImagePath: expect.stringContaining('background.webp') },
      });
    });
  });
});
