import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/dto/auth.dto';
import { UploadsService, ImageType } from './uploads.service';
import { FileValidationPipe } from './file-validation.pipe';
import { ConfigService } from '@nestjs/config';

const VALID_IMAGE_TYPES: ImageType[] = ['avatar', 'banner', 'background'];

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  private readonly maxFileSize: number;

  constructor(
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = parseInt(
      this.configService.get<string>('MAX_FILE_SIZE', '5242880'),
      10,
    );
  }

  @Post(':id/upload/:type')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') cardId: string,
    @Param('type') type: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    if (!VALID_IMAGE_TYPES.includes(type as ImageType)) {
      throw new BadRequestException(
        `Invalid image type: ${type}. Allowed: ${VALID_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Validate file
    const pipe = new FileValidationPipe(this.maxFileSize);
    pipe.transform(file);

    return this.uploadsService.upload(cardId, user.sub, type as ImageType, file);
  }
}
