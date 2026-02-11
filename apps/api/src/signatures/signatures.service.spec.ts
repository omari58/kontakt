import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignatureLayout, Visibility } from '@prisma/client';

describe('SignaturesService', () => {
  let service: SignaturesService;
  let prisma: PrismaService;

  const userId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';

  const mockCard = {
    id: 'card-uuid-1',
    slug: 'john-doe',
    userId,
    name: 'John Doe',
    jobTitle: null,
    company: null,
    phones: null,
    emails: null,
    address: null,
    websites: null,
    socialLinks: null,
    bio: null,
    pronouns: null,
    calendarUrl: null,
    calendarText: null,
    avatarPath: '/uploads/avatar.webp',
    bannerPath: null,
    bgImagePath: null,
    bgColor: null,
    primaryColor: null,
    textColor: null,
    fontFamily: null,
    avatarShape: null,
    theme: null,
    visibility: Visibility.PUBLIC,
    noIndex: false,
    obfuscate: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockSignature = {
    id: 'sig-cuid-1',
    name: 'Work Signature',
    cardId: 'card-uuid-1',
    userId,
    layout: SignatureLayout.CLASSIC,
    config: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    card: mockCard,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignaturesService,
        {
          provide: PrismaService,
          useValue: {
            card: {
              findFirst: jest.fn().mockResolvedValue(mockCard),
            },
            signature: {
              create: jest.fn().mockResolvedValue(mockSignature),
              findMany: jest.fn().mockResolvedValue([mockSignature]),
              findFirst: jest.fn().mockResolvedValue(mockSignature),
              update: jest.fn().mockResolvedValue(mockSignature),
              delete: jest.fn().mockResolvedValue(mockSignature),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SignaturesService>(SignaturesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a signature with valid card', async () => {
      const dto = { name: 'Work Signature', cardId: 'card-uuid-1' };
      const result = await service.create(userId, dto);

      expect(prisma.card.findFirst).toHaveBeenCalledWith({
        where: { id: 'card-uuid-1', userId },
      });
      expect(prisma.signature.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Work Signature',
          cardId: 'card-uuid-1',
          userId,
        }),
        include: { card: true },
      });
      expect(result).toEqual(mockSignature);
    });

    it('should throw NotFoundException for non-existent card', async () => {
      (prisma.card.findFirst as jest.Mock).mockResolvedValue(null);

      const dto = { name: 'Test', cardId: 'nonexistent' };
      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for card owned by another user', async () => {
      (prisma.card.findFirst as jest.Mock).mockResolvedValue(null);

      const dto = { name: 'Test', cardId: 'card-uuid-1' };
      await expect(service.create(otherUserId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByUser', () => {
    it('should return all signatures for the user', async () => {
      const result = await service.findAllByUser(userId);

      expect(prisma.signature.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { card: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockSignature]);
    });
  });

  describe('findOne', () => {
    it('should return a signature with card summary', async () => {
      const result = await service.findOne('sig-cuid-1', userId);

      expect(prisma.signature.findFirst).toHaveBeenCalledWith({
        where: { id: 'sig-cuid-1', userId },
        include: { card: true },
      });
      expect(result).toEqual(mockSignature);
      expect(result.card).toBeDefined();
    });

    it('should throw NotFoundException for another user\'s signature', async () => {
      (prisma.signature.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('sig-cuid-1', otherUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update signature name, layout, and config', async () => {
      const updatedSig = {
        ...mockSignature,
        name: 'Updated Sig',
        layout: SignatureLayout.COMPACT,
        config: { showAvatar: true },
      };
      (prisma.signature.update as jest.Mock).mockResolvedValue(updatedSig);

      const dto = {
        name: 'Updated Sig',
        layout: SignatureLayout.COMPACT,
        config: { showAvatar: true },
      };
      const result = await service.update('sig-cuid-1', userId, dto);

      expect(prisma.signature.findFirst).toHaveBeenCalledWith({
        where: { id: 'sig-cuid-1', userId },
        include: { card: true },
      });
      expect(prisma.signature.update).toHaveBeenCalledWith({
        where: { id: 'sig-cuid-1' },
        data: expect.objectContaining({
          name: 'Updated Sig',
          layout: SignatureLayout.COMPACT,
          config: { showAvatar: true },
        }),
        include: { card: true },
      });
      expect(result.name).toBe('Updated Sig');
    });
  });

  describe('remove', () => {
    it('should delete a signature', async () => {
      await service.remove('sig-cuid-1', userId);

      expect(prisma.signature.findFirst).toHaveBeenCalledWith({
        where: { id: 'sig-cuid-1', userId },
        include: { card: true },
      });
      expect(prisma.signature.delete).toHaveBeenCalledWith({
        where: { id: 'sig-cuid-1' },
      });
    });

    it('should throw NotFoundException for non-existent signature', async () => {
      (prisma.signature.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
