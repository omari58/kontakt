import {
  PipeTransform,
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Injectable()
export class FileValidationPipe implements PipeTransform<Express.Multer.File> {
  constructor(private readonly maxSize: number) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > this.maxSize) {
      throw new PayloadTooLargeException(
        `File too large: ${file.size} bytes. Max: ${this.maxSize} bytes`,
      );
    }

    return file;
  }
}
