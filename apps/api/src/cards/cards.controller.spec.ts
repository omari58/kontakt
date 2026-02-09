import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CardsController, MyCardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardResponseDto } from './dto/card-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Visibility } from '@prisma/client';
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

const mockServiceValue = {
  create: jest.fn().mockResolvedValue(mockCard),
  findAllByUser: jest.fn().mockResolvedValue([mockCard]),
  findOne: jest.fn().mockResolvedValue(mockCard),
  findBySlug: jest.fn().mockResolvedValue(mockCard),
  update: jest.fn().mockResolvedValue(mockCard),
  delete: jest.fn().mockResolvedValue(undefined),
};

const guardProviders = [
  JwtAuthGuard,
  { provide: JwtService, useValue: { verify: jest.fn() } },
  { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('24h') } },
];

describe('MyCardsController', () => {
  let controller: MyCardsController;
  let service: CardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyCardsController],
      providers: [{ provide: CardsService, useValue: mockServiceValue }, ...guardProviders],
    }).compile();

    controller = module.get<MyCardsController>(MyCardsController);
    service = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMyCards', () => {
    it('should return CardResponseDto array for the current user', async () => {
      const result = await controller.findMyCards(mockUser);

      expect(service.findAllByUser).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CardResponseDto);
      expect(result[0].id).toBe(mockCard.id);
    });
  });
});

describe('CardsController', () => {
  let controller: CardsController;
  let service: CardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [{ provide: CardsService, useValue: mockServiceValue }, ...guardProviders],
    }).compile();

    controller = module.get<CardsController>(CardsController);
    service = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a card and return a CardResponseDto', async () => {
      const dto = { name: 'John Doe' };
      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result).toBeInstanceOf(CardResponseDto);
      expect(result.id).toBe(mockCard.id);
      expect(result.name).toBe(mockCard.name);
    });
  });

  describe('findOne', () => {
    it('should return a CardResponseDto by ID', async () => {
      const result = await controller.findOne('card-uuid-1', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('card-uuid-1', 'user-uuid-1', false);
      expect(result).toBeInstanceOf(CardResponseDto);
      expect(result.id).toBe(mockCard.id);
    });

    it('should propagate NotFoundException from service', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ForbiddenException from service', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(new ForbiddenException());

      await expect(controller.findOne('card-uuid-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a CardResponseDto by slug (public)', async () => {
      const result = await controller.findBySlug('john-doe');

      expect(service.findBySlug).toHaveBeenCalledWith('john-doe');
      expect(result).toBeInstanceOf(CardResponseDto);
      expect(result.slug).toBe('john-doe');
    });

    it('should propagate NotFoundException for unknown slug', async () => {
      (service.findBySlug as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(controller.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a card and return a CardResponseDto', async () => {
      const dto = { name: 'Updated Name' };
      const updatedCard = { ...mockCard, name: 'Updated Name' };
      (service.update as jest.Mock).mockResolvedValue(updatedCard);

      const result = await controller.update('card-uuid-1', mockUser, dto);

      expect(service.update).toHaveBeenCalledWith('card-uuid-1', 'user-uuid-1', dto, false);
      expect(result).toBeInstanceOf(CardResponseDto);
      expect(result.name).toBe('Updated Name');
    });

    it('should propagate ConflictException for slug conflicts', async () => {
      (service.update as jest.Mock).mockRejectedValue(new ConflictException());

      await expect(
        controller.update('card-uuid-1', mockUser, { slug: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a card', async () => {
      await controller.remove('card-uuid-1', mockUser);

      expect(service.delete).toHaveBeenCalledWith('card-uuid-1', 'user-uuid-1', false);
    });
  });
});
