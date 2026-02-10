import { Injectable, Logger, Inject } from '@nestjs/common';
import { CardsService } from '../cards/cards.service';
import { VCardBuilder } from './vcard.builder';
import { STORAGE_PROVIDER } from '../storage/storage.constants';
import { StorageProvider } from '../storage/storage.interface';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly cardsService: CardsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async generateVCard(slug: string): Promise<{ vcf: string; filename: string }> {
    const card = await this.cardsService.findBySlug(slug);

    let avatarBase64: string | undefined;
    if (card.avatarPath) {
      const key = this.storage.extractKey(card.avatarPath);
      const buffer = await this.storage.read(key);
      if (buffer) {
        avatarBase64 = buffer.toString('base64');
      }
    }

    const vcfInput = {
      name: card.name,
      jobTitle: card.jobTitle,
      company: card.company,
      phones: card.phones as { number: string; label: string }[] | null,
      emails: card.emails as { email: string; label: string }[] | null,
      address: card.address as { street?: string; city?: string; country?: string; zip?: string } | null,
      websites: card.websites as { url: string; label?: string }[] | null,
      socialLinks: card.socialLinks as { platform: string; url: string }[] | null,
      bio: card.bio,
      avatarPath: card.avatarPath,
    };

    const vcf = VCardBuilder.build(vcfInput, avatarBase64);

    return { vcf, filename: card.name };
  }
}
