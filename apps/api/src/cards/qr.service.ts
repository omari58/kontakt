import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { CardsService } from './cards.service';

export interface QrResult {
  data: Buffer | string;
  contentType: string;
}

@Injectable()
export class QrService {
  private readonly appUrl: string;

  constructor(
    private readonly cardsService: CardsService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:4000';
  }

  async generateQr(
    slug: string,
    format: string,
    size: number,
  ): Promise<QrResult> {
    // Validate format
    if (format !== 'png' && format !== 'svg') {
      throw new BadRequestException(`Invalid format: ${format}. Must be png or svg.`);
    }

    // Verify card exists (throws NotFoundException if not found)
    await this.cardsService.findBySlug(slug);

    const url = `${this.appUrl}/c/${slug}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        width: size,
        margin: 1,
      });
      return { data: svg, contentType: 'image/svg+xml' };
    }

    const pngBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: size,
      margin: 1,
    });
    return { data: pngBuffer, contentType: 'image/png' };
  }
}
