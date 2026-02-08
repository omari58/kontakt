import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            recordView: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('recordView', () => {
    it('should call recordView and return nothing (204)', async () => {
      (analyticsService.recordView as jest.Mock).mockResolvedValue(undefined);

      const mockReq = { ip: '192.168.1.1' };

      await controller.recordView('john-doe', mockReq as any);

      expect(analyticsService.recordView).toHaveBeenCalledWith('john-doe', '192.168.1.1');
    });

    it('should handle undefined IP gracefully', async () => {
      (analyticsService.recordView as jest.Mock).mockResolvedValue(undefined);

      const mockReq = { ip: undefined };

      await controller.recordView('john-doe', mockReq as any);

      expect(analyticsService.recordView).toHaveBeenCalledWith('john-doe', 'unknown');
    });
  });
});
