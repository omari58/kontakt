import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    oidcSub: 'oidc-sub-123',
    email: 'alice@example.com',
    name: 'Alice',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              upsert: jest.fn().mockResolvedValue(mockUser),
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertFromOidc', () => {
    it('should create a new user on first login', async () => {
      const result = await service.upsertFromOidc({
        sub: 'oidc-sub-123',
        email: 'alice@example.com',
        name: 'Alice',
        role: Role.USER,
      });

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { oidcSub: 'oidc-sub-123' },
        create: {
          oidcSub: 'oidc-sub-123',
          email: 'alice@example.com',
          name: 'Alice',
          role: Role.USER,
        },
        update: {
          email: 'alice@example.com',
          name: 'Alice',
          role: Role.USER,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should update email and name on subsequent login', async () => {
      const updatedUser = {
        ...mockUser,
        email: 'alice.new@example.com',
        name: 'Alice Updated',
      };
      (prisma.user.upsert as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.upsertFromOidc({
        sub: 'oidc-sub-123',
        email: 'alice.new@example.com',
        name: 'Alice Updated',
        role: Role.USER,
      });

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { oidcSub: 'oidc-sub-123' },
        create: {
          oidcSub: 'oidc-sub-123',
          email: 'alice.new@example.com',
          name: 'Alice Updated',
          role: Role.USER,
        },
        update: {
          email: 'alice.new@example.com',
          name: 'Alice Updated',
          role: Role.USER,
        },
      });
      expect(result.email).toBe('alice.new@example.com');
      expect(result.name).toBe('Alice Updated');
    });

    it('should update role on each login based on current claims', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      (prisma.user.upsert as jest.Mock).mockResolvedValue(adminUser);

      const result = await service.upsertFromOidc({
        sub: 'oidc-sub-123',
        email: 'alice@example.com',
        name: 'Alice',
        role: Role.ADMIN,
      });

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ role: Role.ADMIN }),
          update: expect.objectContaining({ role: Role.ADMIN }),
        }),
      );
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should match on oidcSub for upsert', async () => {
      await service.upsertFromOidc({
        sub: 'unique-oidc-sub-456',
        email: 'bob@example.com',
        name: 'Bob',
        role: Role.USER,
      });

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { oidcSub: 'unique-oidc-sub-456' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const result = await service.findById('user-uuid-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
