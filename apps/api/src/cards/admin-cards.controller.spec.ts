import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AdminCardsController } from './admin-cards.controller';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Visibility } from '@prisma/client';

const mockCard = {
  id: 'card-uuid-1',
  slug: 'john-doe',
  userId: 'user-uuid-1',
  name: 'John Doe',
  jobTitle: null,
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
  user: { name: 'John Doe', email: 'john@example.com' },
};

const mockServiceValue = {
  findAll: jest.fn().mockResolvedValue({
    data: [mockCard],
    total: 1,
    page: 1,
    limit: 20,
  }),
};

const guardProviders = [
  JwtAuthGuard,
  RolesGuard,
  Reflector,
  { provide: JwtService, useValue: { verify: jest.fn() } },
  { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('24h') } },
];

describe('AdminCardsController', () => {
  let controller: AdminCardsController;
  let service: CardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCardsController],
      providers: [
        { provide: CardsService, useValue: mockServiceValue },
        ...guardProviders,
      ],
    }).compile();

    controller = module.get<AdminCardsController>(AdminCardsController);
    service = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated cards with defaults', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
      });
      expect(result).toEqual({
        data: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should pass pagination params', async () => {
      await controller.findAll(2, 10);

      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: undefined,
      });
    });

    it('should pass search param', async () => {
      await controller.findAll(1, 20, 'acme');

      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'acme',
      });
    });

    it('should preserve user info in admin card response', async () => {
      const result = await controller.findAll();

      expect(result.data[0]).toHaveProperty('user');
      expect(result.data[0].user).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });
});
