import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { QrService } from './qr.service';

@Controller('cards')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get(':slug/qr')
  async getQr(
    @Param('slug') slug: string,
    @Query('format', new DefaultValuePipe('png')) format: string,
    @Query('size', new DefaultValuePipe(300), ParseIntPipe) size: number,
    @Res() res: Response,
  ): Promise<void> {
    if (size < 100 || size > 1000) {
      throw new BadRequestException('Size must be between 100 and 1000');
    }

    const result = await this.qrService.generateQr(slug, format, size);

    res.set({
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    });
    res.send(result.data);
  }
}
