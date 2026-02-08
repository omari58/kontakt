import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { Visibility, AvatarShape, Theme } from '@prisma/client';

describe('CardsService', () => {
  let service: CardsService;
  let prisma: PrismaService;

  const userId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';

  const mockCard = {
    id: 'card-uuid-1',
    slug: 'john-doe',
    userId,
    name: 'John Doe',
    jobTitle: 'Engineer',
    company: 'Acme',
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
        CardsService,
        {
          provide: PrismaService,
          useValue: {
            card: {
              create: jest.fn().mockResolvedValue(mockCard),
              findMany: jest.fn().mockResolvedValue([mockCard]),
              findUnique: jest.fn().mockResolvedValue(mockCard),
              findFirst: jest.fn().mockResolvedValue(null),
              update: jest.fn().mockResolvedValue(mockCard),
              delete: jest.fn().mockResolvedValue(mockCard),
              count: jest.fn().mockResolvedValue(1),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a card with auto-generated slug', async () => {
      const dto = { name: 'John Doe' };
      const result = await service.create(userId, dto);

      expect(prisma.card.findFirst).toHaveBeenCalled();
      expect(prisma.card.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'John Doe',
          userId,
          slug: 'john-doe',
          phones: undefined,
          emails: undefined,
          websites: undefined,
          socialLinks: undefined,
          address: undefined,
        }),
      });
      expect(result).toEqual(mockCard);
    });

    it('should generate unique slug when base slug is taken', async () => {
      // First findFirst returns existing card (slug taken), second returns null (slug-2 available)
      (prisma.card.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      const dto = { name: 'John Doe' };
      await service.create(userId, dto);

      expect(prisma.card.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'john-doe-2',
        }),
      });
    });

    it('should handle Prisma unique constraint violation on slug', async () => {
      const prismaError = new Error('Unique constraint failed') as any;
      prismaError.code = 'P2002';
      prismaError.meta = { target: ['slug'] };
      (prisma.card.create as jest.Mock).mockRejectedValue(prismaError);

      const dto = { name: 'John Doe' };
      await expect(service.create(userId, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllByUser', () => {
    it('should return all cards for a user', async () => {
      const result = await service.findAllByUser(userId);

      expect(prisma.card.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockCard]);
    });
  });

  describe('findAll', () => {
    it('should return paginated cards with total count', async () => {
      const cardWithUser = { ...mockCard, user: { name: 'John Doe', email: 'john@example.com' } };
      (prisma.card.findMany as jest.Mock).mockResolvedValue([cardWithUser]);
      (prisma.card.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(prisma.card.findMany).toHaveBeenCalledWith({
        where: {},
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.card.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({ data: [cardWithUser], total: 1, page: 1, limit: 20 });
    });

    it('should apply search filter across name, company, and email', async () => {
      (prisma.card.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.card.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'acme' });

      expect(prisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'acme', mode: 'insensitive' } },
              { company: { contains: 'acme', mode: 'insensitive' } },
              { user: { email: { contains: 'acme', mode: 'insensitive' } } },
            ],
          },
        }),
      );
    });

    it('should handle pagination offset correctly', async () => {
      (prisma.card.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.card.count as jest.Mock).mockResolvedValue(50);

      await service.findAll({ page: 3, limit: 10 });

      expect(prisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a card if owned by user', async () => {
      const result = await service.findOne('card-uuid-1', userId);

      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-uuid-1' },
      });
      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException for non-existent card', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent', userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if card belongs to different user', async () => {
      await expect(service.findOne('card-uuid-1', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a card by slug (no auth check)', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.findBySlug('john-doe');

      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { slug: 'john-doe' },
      });
      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update card fields if owned by user', async () => {
      const updatedCard = { ...mockCard, name: 'Jane Doe' };
      (prisma.card.update as jest.Mock).mockResolvedValue(updatedCard);

      const dto = { name: 'Jane Doe' };
      const result = await service.update('card-uuid-1', userId, dto);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-uuid-1' },
        data: expect.objectContaining({ name: 'Jane Doe' }),
      });
      expect(result.name).toBe('Jane Doe');
    });

    it('should throw NotFoundException for non-existent card on update', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('nonexistent', userId, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if updating card of different user', async () => {
      await expect(service.update('card-uuid-1', otherUserId, { name: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should validate slug uniqueness on update when slug is provided', async () => {
      // Another card already has the target slug
      (prisma.card.findFirst as jest.Mock).mockResolvedValue({ id: 'other-card-id' });

      await expect(
        service.update('card-uuid-1', userId, { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow keeping the same slug on update', async () => {
      // findFirst returns current card (same id) - not a conflict
      (prisma.card.findFirst as jest.Mock).mockResolvedValue({ id: 'card-uuid-1' });

      const updatedCard = { ...mockCard, slug: 'john-doe' };
      (prisma.card.update as jest.Mock).mockResolvedValue(updatedCard);

      const result = await service.update('card-uuid-1', userId, { slug: 'john-doe' });
      expect(result).toEqual(updatedCard);
    });
  });

  describe('delete', () => {
    it('should delete a card if owned by user', async () => {
      await service.delete('card-uuid-1', userId);

      expect(prisma.card.delete).toHaveBeenCalledWith({
        where: { id: 'card-uuid-1' },
      });
    });

    it('should throw NotFoundException for non-existent card on delete', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('nonexistent', userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if deleting card of different user', async () => {
      await expect(service.delete('card-uuid-1', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
