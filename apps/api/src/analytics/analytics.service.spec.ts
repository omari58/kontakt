import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventType } from '@prisma/client';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockCard = {
    id: 'card-uuid-1',
    slug: 'john-doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            card: {
              findUnique: jest.fn(),
            },
            analyticsEvent: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordView', () => {
    it('should create an analytics event for a valid slug', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
      (prisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-uuid-1',
        cardId: 'card-uuid-1',
        type: EventType.VIEW,
        ipHash: 'some-hash',
        createdAt: new Date(),
      });

      await service.recordView('john-doe', '192.168.1.1');

      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { slug: 'john-doe' },
        select: { id: true },
      });
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          cardId: 'card-uuid-1',
          type: EventType.VIEW,
          ipHash: expect.any(String),
        },
      });
    });

    it('should silently return for non-existent slug', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.recordView('nonexistent', '192.168.1.1')).resolves.toBeUndefined();

      expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
    });

    it('should deduplicate views within the rate limit window', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
      (prisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-event',
        createdAt: new Date(),
      });

      await service.recordView('john-doe', '192.168.1.1');

      expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
    });

    it('should generate deterministic IP hash for same IP', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
      (prisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.analyticsEvent.create as jest.Mock).mockResolvedValue({});

      await service.recordView('john-doe', '192.168.1.1');
      const firstCallData = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0].data;

      jest.clearAllMocks();
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
      (prisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.analyticsEvent.create as jest.Mock).mockResolvedValue({});

      await service.recordView('john-doe', '192.168.1.1');
      const secondCallData = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0].data;

      expect(firstCallData.ipHash).toBe(secondCallData.ipHash);
    });

    it('should generate different hashes for different IPs', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
      (prisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.analyticsEvent.create as jest.Mock).mockResolvedValue({});

      await service.recordView('john-doe', '192.168.1.1');
      const firstHash = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0].data.ipHash;

      jest.clearAllMocks();
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
      (prisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.analyticsEvent.create as jest.Mock).mockResolvedValue({});

      await service.recordView('john-doe', '10.0.0.1');
      const secondHash = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0].data.ipHash;

      expect(firstHash).not.toBe(secondHash);
    });

    it('should silently handle database errors', async () => {
      (prisma.card.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.recordView('john-doe', '192.168.1.1')).resolves.toBeUndefined();
    });
  });
});
