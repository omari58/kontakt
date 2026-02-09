import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardsService } from '../cards/cards.service';
import { SettingsService } from '../settings/settings.service';
import { resolveCardTheme } from '../cards/theme.resolver';
import { Card, Visibility, AvatarShape, Theme } from '@prisma/client';

@Injectable()
export class RenderService {
  constructor(
    private readonly cardsService: CardsService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  async getCardViewData(slug: string) {
    const card = await this.cardsService.findBySlug(slug);

    if (card.visibility === Visibility.DISABLED) {
      throw new NotFoundException('Card not found');
    }

    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:4000';
    const cardUrl = `${baseUrl}/c/${card.slug}`;
    const vcfUrl = `${baseUrl}/api/cards/${card.slug}/vcf`;

    const noIndex = card.noIndex || card.visibility === Visibility.UNLISTED;

    const ogTitle = card.company ? `${card.name} - ${card.company}` : card.name;
    const ogDescription = this.buildDescription(card.jobTitle, card.company);
    const ogImage = card.avatarPath ? `${baseUrl}${card.avatarPath}` : null;

    const resolved = resolveCardTheme(card, this.settingsService.getAll());

    const avatarShapeClass = resolved.avatarShape === 'ROUNDED_SQUARE'
      ? 'rounded-square'
      : 'circle';

    const themeClass = resolved.theme === 'DARK' || resolved.theme === Theme.DARK
      ? 'theme-dark'
      : resolved.theme === 'AUTO' || resolved.theme === Theme.AUTO
        ? 'theme-auto'
        : 'theme-light';

    const cssVars = this.buildCssVars(resolved.bgColor, resolved.primaryColor, resolved.textColor);

    const jsonLd = this.buildJsonLd(card, cardUrl, ogImage);

    const nameInitial = card.name.charAt(0).toUpperCase();

    return {
      card: {
        ...card,
        bgImagePath: resolved.bgImagePath,
        avatarShapeClass,
        nameInitial,
      },
      og: {
        title: ogTitle,
        description: ogDescription,
        url: cardUrl,
        type: 'profile',
        image: ogImage,
      },
      noIndex,
      cardUrl,
      vcfUrl,
      themeClass,
      cssVars,
      jsonLd,
    };
  }

  private buildDescription(jobTitle: string | null, company: string | null): string {
    if (jobTitle && company) {
      return `${jobTitle} at ${company}`;
    }
    if (jobTitle) {
      return jobTitle;
    }
    if (company) {
      return company;
    }
    return '';
  }

  private buildCssVars(
    bgColor: string,
    primaryColor: string,
    textColor: string,
  ): string {
    return [
      `--bg-color: ${bgColor}`,
      `--primary-color: ${primaryColor}`,
      `--text-color: ${textColor}`,
    ].join('; ');
  }

  private buildJsonLd(
    card: Card,
    cardUrl: string,
    image: string | null,
  ): string {
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: card.name,
      url: cardUrl,
    };

    if (card.jobTitle) {
      jsonLd.jobTitle = card.jobTitle;
    }
    if (card.company) {
      jsonLd.worksFor = {
        '@type': 'Organization',
        name: card.company,
      };
    }
    if (image) {
      jsonLd.image = image;
    }
    const emails = card.emails as { email: string; label: string }[] | null;
    if (emails && Array.isArray(emails) && emails.length > 0) {
      jsonLd.email = emails[0].email;
    }
    const phones = card.phones as { number: string; label: string }[] | null;
    if (phones && Array.isArray(phones) && phones.length > 0) {
      jsonLd.telephone = phones[0].number;
    }

    return JSON.stringify(jsonLd);
  }
}
