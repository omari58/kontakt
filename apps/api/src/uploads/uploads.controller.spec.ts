import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('UploadsController', () => {
  let controller: UploadsController;
  let uploadsService: jest.Mocked<UploadsService>;
  let configService: jest.Mocked<ConfigService>;

  const userId = 'user-uuid-1';
  const cardId = 'card-uuid-1';
  const jwtPayload = { sub: userId, email: 'test@test.com', name: 'Test', role: 'USER' };

  beforeEach(() => {
    uploadsService = {
      upload: jest.fn().mockResolvedValue({ path: '/uploads/cards/card-uuid-1/avatar.webp' }),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue('5242880'),
    } as any;

    controller = new UploadsController(uploadsService, configService);
  });

  function makeFile(mimetype = 'image/jpeg'): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'avatar.jpg',
      encoding: '7bit',
      mimetype,
      size: 1024,
      buffer: Buffer.alloc(1024),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };
  }

  it('should call uploadsService.upload with correct params for avatar', async () => {
    const file = makeFile();
    const result = await controller.uploadImage(cardId, 'avatar', jwtPayload, file);

    expect(uploadsService.upload).toHaveBeenCalledWith(cardId, userId, 'avatar', file);
    expect(result).toEqual({ path: '/uploads/cards/card-uuid-1/avatar.webp' });
  });

  it('should call uploadsService.upload for banner', async () => {
    const file = makeFile();
    await controller.uploadImage(cardId, 'banner', jwtPayload, file);

    expect(uploadsService.upload).toHaveBeenCalledWith(cardId, userId, 'banner', file);
  });

  it('should call uploadsService.upload for background', async () => {
    const file = makeFile();
    await controller.uploadImage(cardId, 'background', jwtPayload, file);

    expect(uploadsService.upload).toHaveBeenCalledWith(cardId, userId, 'background', file);
  });

  it('should reject invalid image type', async () => {
    const file = makeFile();
    await expect(
      controller.uploadImage(cardId, 'invalid' as any, jwtPayload, file),
    ).rejects.toThrow(BadRequestException);
  });
});
