import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { SignatureResponseDto } from './dto/signature-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SignatureLayout, Visibility } from '@prisma/client';
import { JwtPayload } from '../auth/dto/auth.dto';

const mockUser: JwtPayload = {
  sub: 'user-uuid-1',
  email: 'john@example.com',
  name: 'John Doe',
  role: 'USER',
};

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
  pronouns: null,
  calendarUrl: null,
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
  userId: 'user-uuid-1',
  layout: SignatureLayout.CLASSIC,
  config: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  card: mockCard,
};

const mockServiceValue = {
  create: jest.fn().mockResolvedValue(mockSignature),
  findAllByUser: jest.fn().mockResolvedValue([mockSignature]),
  findOne: jest.fn().mockResolvedValue(mockSignature),
  update: jest.fn().mockResolvedValue(mockSignature),
  remove: jest.fn().mockResolvedValue(undefined),
};

const guardProviders = [
  JwtAuthGuard,
  { provide: JwtService, useValue: { verify: jest.fn() } },
  { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('24h') } },
];

describe('SignaturesController', () => {
  let controller: SignaturesController;
  let service: SignaturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignaturesController],
      providers: [
        { provide: SignaturesService, useValue: mockServiceValue },
        ...guardProviders,
      ],
    }).compile();

    controller = module.get<SignaturesController>(SignaturesController);
    service = module.get<SignaturesService>(SignaturesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a signature and return a SignatureResponseDto', async () => {
      const dto = { name: 'Work Signature', cardId: 'card-uuid-1' };
      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result).toBeInstanceOf(SignatureResponseDto);
      expect(result.id).toBe(mockSignature.id);
      expect(result.card.id).toBe(mockCard.id);
    });
  });

  describe('findAll', () => {
    it('should return SignatureResponseDto array for the current user', async () => {
      const result = await controller.findAll(mockUser);

      expect(service.findAllByUser).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SignatureResponseDto);
    });
  });

  describe('findOne', () => {
    it('should return a SignatureResponseDto by ID', async () => {
      const result = await controller.findOne('sig-cuid-1', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('sig-cuid-1', 'user-uuid-1');
      expect(result).toBeInstanceOf(SignatureResponseDto);
      expect(result.id).toBe(mockSignature.id);
    });

    it('should propagate NotFoundException from service', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a signature and return a SignatureResponseDto', async () => {
      const updatedSig = { ...mockSignature, name: 'Updated' };
      (service.update as jest.Mock).mockResolvedValue(updatedSig);

      const dto = { name: 'Updated' };
      const result = await controller.update('sig-cuid-1', mockUser, dto);

      expect(service.update).toHaveBeenCalledWith('sig-cuid-1', 'user-uuid-1', dto);
      expect(result).toBeInstanceOf(SignatureResponseDto);
    });
  });

  describe('remove', () => {
    it('should delete a signature', async () => {
      await controller.remove('sig-cuid-1', mockUser);

      expect(service.remove).toHaveBeenCalledWith('sig-cuid-1', 'user-uuid-1');
    });
  });
});
