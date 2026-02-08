import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

describe('QrController', () => {
  let controller: QrController;
  let qrService: QrService;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrController],
      providers: [
        {
          provide: QrService,
          useValue: {
            generateQr: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QrController>(QrController);
    qrService = module.get<QrService>(QrService);
    mockResponse = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQr', () => {
    it('should return PNG image with correct headers', async () => {
      const pngBuffer = Buffer.from('fake-png-data');
      (qrService.generateQr as jest.Mock).mockResolvedValue({
        data: pngBuffer,
        contentType: 'image/png',
      });

      await controller.getQr('john-doe', 'png', 300, mockResponse);

      expect(qrService.generateQr).toHaveBeenCalledWith('john-doe', 'png', 300);
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, immutable',
        }),
      );
      expect(mockResponse.send).toHaveBeenCalledWith(pngBuffer);
    });

    it('should return SVG with correct headers', async () => {
      const svgString = '<svg>...</svg>';
      (qrService.generateQr as jest.Mock).mockResolvedValue({
        data: svgString,
        contentType: 'image/svg+xml',
      });

      await controller.getQr('john-doe', 'svg', 300, mockResponse);

      expect(qrService.generateQr).toHaveBeenCalledWith('john-doe', 'svg', 300);
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400, immutable',
        }),
      );
      expect(mockResponse.send).toHaveBeenCalledWith(svgString);
    });

    it('should use default format (png) and size (300)', async () => {
      const pngBuffer = Buffer.from('fake-png');
      (qrService.generateQr as jest.Mock).mockResolvedValue({
        data: pngBuffer,
        contentType: 'image/png',
      });

      await controller.getQr('john-doe', 'png', 300, mockResponse);

      expect(qrService.generateQr).toHaveBeenCalledWith('john-doe', 'png', 300);
    });

    it('should propagate NotFoundException for invalid slug', async () => {
      (qrService.generateQr as jest.Mock).mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(
        controller.getQr('nonexistent', 'png', 300, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when size is below minimum (99)', async () => {
      await expect(
        controller.getQr('john-doe', 'png', 99, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when size exceeds maximum (1001)', async () => {
      await expect(
        controller.getQr('john-doe', 'png', 1001, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept size at lower boundary (100)', async () => {
      const pngBuffer = Buffer.from('fake-png');
      (qrService.generateQr as jest.Mock).mockResolvedValue({
        data: pngBuffer,
        contentType: 'image/png',
      });

      await controller.getQr('john-doe', 'png', 100, mockResponse);

      expect(qrService.generateQr).toHaveBeenCalledWith('john-doe', 'png', 100);
    });

    it('should accept size at upper boundary (1000)', async () => {
      const pngBuffer = Buffer.from('fake-png');
      (qrService.generateQr as jest.Mock).mockResolvedValue({
        data: pngBuffer,
        contentType: 'image/png',
      });

      await controller.getQr('john-doe', 'png', 1000, mockResponse);

      expect(qrService.generateQr).toHaveBeenCalledWith('john-doe', 'png', 1000);
    });

    it('should propagate BadRequestException for invalid format', async () => {
      (qrService.generateQr as jest.Mock).mockRejectedValue(
        new BadRequestException('Invalid format'),
      );

      await expect(
        controller.getQr('john-doe', 'gif', 300, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
