import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardsService } from '../cards/cards.service';
import { VCardBuilder } from './vcard.builder';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class ContactsService {
  constructor(
    private readonly cardsService: CardsService,
    private readonly configService: ConfigService,
  ) {}

  async generateVCard(slug: string): Promise<{ vcf: string; filename: string }> {
    const card = await this.cardsService.findBySlug(slug);

    let avatarBase64: string | undefined;
    if (card.avatarPath) {
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
      const avatarFullPath = join(process.cwd(), uploadDir, card.avatarPath);
      try {
        await fs.promises.access(avatarFullPath);
        const buffer = await fs.promises.readFile(avatarFullPath);
        avatarBase64 = buffer.toString('base64');
      } catch {
        // File does not exist on disk, skip avatar
      }
    }

    const vcfInput = {
      name: card.name,
      jobTitle: card.jobTitle,
      company: card.company,
      phones: card.phones as { number: string; label: string }[] | null,
      emails: card.emails as { email: string; label: string }[] | null,
      address: card.address as { street?: string; city?: string; country?: string; zip?: string } | null,
      websites: card.websites as string[] | null,
      socialLinks: card.socialLinks as { platform: string; url: string }[] | null,
      bio: card.bio,
      avatarPath: card.avatarPath,
    };

    const vcf = VCardBuilder.build(vcfInput, avatarBase64);
    const filename = `${card.name}.vcf`;

    return { vcf, filename };
  }
}
