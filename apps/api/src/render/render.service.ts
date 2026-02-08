import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardsService } from '../cards/cards.service';
import { Visibility, AvatarShape, Theme } from '@prisma/client';

@Injectable()
export class RenderService {
  constructor(
    private readonly cardsService: CardsService,
    private readonly configService: ConfigService,
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

    const avatarShapeClass = card.avatarShape === AvatarShape.ROUNDED_SQUARE
      ? 'rounded-square'
      : 'circle';

    const themeClass = card.theme === Theme.DARK
      ? 'theme-dark'
      : card.theme === Theme.AUTO
        ? 'theme-auto'
        : 'theme-light';

    const cssVars = this.buildCssVars(card.bgColor, card.primaryColor, card.textColor);

    const jsonLd = this.buildJsonLd(card, cardUrl, ogImage);

    const nameInitial = card.name.charAt(0).toUpperCase();

    return {
      card: {
        ...card,
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
    bgColor: string | null,
    primaryColor: string | null,
    textColor: string | null,
  ): string {
    const vars: string[] = [];
    if (bgColor) vars.push(`--bg-color: ${bgColor}`);
    if (primaryColor) vars.push(`--primary-color: ${primaryColor}`);
    if (textColor) vars.push(`--text-color: ${textColor}`);
    return vars.join('; ');
  }

  private buildJsonLd(
    card: Record<string, any>,
    cardUrl: string,
    image: string | null,
  ): string {
    const jsonLd: Record<string, any> = {
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
    if (card.emails && Array.isArray(card.emails) && card.emails.length > 0) {
      jsonLd.email = card.emails[0].email;
    }
    if (card.phones && Array.isArray(card.phones) && card.phones.length > 0) {
      jsonLd.telephone = card.phones[0].number;
    }

    return JSON.stringify(jsonLd);
  }
}
