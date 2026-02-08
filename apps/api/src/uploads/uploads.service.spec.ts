import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CardsService } from '../cards/cards.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as sharp from 'sharp';

jest.mock('fs/promises');
jest.mock('sharp');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockSharp = sharp as unknown as jest.Mock;

describe('UploadsService', () => {
  let service: UploadsService;
  let cardsService: jest.Mocked<CardsService>;
  let prisma: { card: { update: jest.Mock } };

  const userId = 'user-uuid-1';
  const cardId = 'card-uuid-1';
  const uploadDir = '/tmp/test-uploads';

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

    service = new UploadsService(
      cardsService,
      prisma as unknown as PrismaService,
      uploadDir,
    );

    // Mock sharp chain
    const sharpInstance = {
      resize: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue({}),
    };
    mockSharp.mockReturnValue(sharpInstance);

    // Mock fs
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.access.mockRejectedValue(new Error('ENOENT'));
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
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockSharp).toHaveBeenCalledWith(file.buffer);
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
      mockFs.access.mockResolvedValue(undefined); // file exists

      const file = makeFile();
      await service.upload(cardId, userId, 'avatar', file);

      expect(mockFs.unlink).toHaveBeenCalled();
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
