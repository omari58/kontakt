import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';

describe('RenderController', () => {
  let controller: RenderController;
  let renderService: RenderService;

  const mockViewData = {
    card: {
      id: 'card-uuid-1',
      slug: 'john-doe',
      name: 'John Doe',
      jobTitle: 'Software Engineer',
      company: 'Acme Corp',
      avatarShapeClass: 'circle',
    },
    og: {
      title: 'John Doe - Acme Corp',
      description: 'Software Engineer at Acme Corp',
      url: 'http://localhost:4000/c/john-doe',
      type: 'profile',
      image: 'http://localhost:4000/uploads/avatar.jpg',
    },
    noIndex: false,
    cardUrl: 'http://localhost:4000/c/john-doe',
    vcfUrl: 'http://localhost:4000/c/john-doe/vcf',
    themeClass: 'theme-light',
    cssVars: '--bg-color: #ffffff; --primary-color: #0066cc; --text-color: #333333',
    jsonLd: '{"@context":"https://schema.org","@type":"Person","name":"John Doe"}',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RenderController],
      providers: [
        {
          provide: RenderService,
          useValue: {
            getCardViewData: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RenderController>(RenderController);
    renderService = module.get<RenderService>(RenderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('renderCard', () => {
    it('should return view data for valid slug', async () => {
      (renderService.getCardViewData as jest.Mock).mockResolvedValue(mockViewData);

      const result = await controller.renderCard('john-doe');

      expect(renderService.getCardViewData).toHaveBeenCalledWith('john-doe');
      expect(result).toEqual(mockViewData);
    });

    it('should propagate NotFoundException for disabled/not-found card', async () => {
      (renderService.getCardViewData as jest.Mock).mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.renderCard('disabled-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('renderCard404', () => {
    it('should return the card-404 view data', () => {
      const result = controller.renderCard404();

      expect(result).toEqual({ title: 'Card Not Found' });
    });
  });
});
