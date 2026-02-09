import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardsService } from '../cards/cards.service';
import { SettingsService } from '../settings/settings.service';
import { resolveCardTheme } from '../cards/theme.resolver';
import { Card, Visibility, AvatarShape, Theme } from '@prisma/client';

const FONT_MAP: Record<string, { family: string; url: string }> = {
  'dm-serif':  { family: "'DM Serif Display', Georgia, serif", url: 'DM+Serif+Display' },
  'playfair':  { family: "'Playfair Display', Georgia, serif", url: 'Playfair+Display:wght@400;700' },
  'inter':     { family: "'Inter', -apple-system, sans-serif", url: 'Inter:wght@400;500;600;700' },
  'poppins':   { family: "'Poppins', -apple-system, sans-serif", url: 'Poppins:wght@400;500;600' },
  'cormorant': { family: "'Cormorant Garamond', Georgia, serif", url: 'Cormorant+Garamond:wght@400;600' },
  'sora':      { family: "'Sora', -apple-system, sans-serif", url: 'Sora:wght@400;500;600' },
  'fraunces':  { family: "'Fraunces', Georgia, serif", url: 'Fraunces:wght@400;700' },
  'bricolage': { family: "'Bricolage Grotesque', -apple-system, sans-serif", url: 'Bricolage+Grotesque:wght@400;600;700' },
};

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

    const allSettings = this.settingsService.getAll();
    const resolved = resolveCardTheme(card, allSettings);

    const footerText = allSettings.get('footer_text') || null;
    const footerLink = allSettings.get('footer_link') || null;
    const favicon = allSettings.get('org_favicon') || null;
    const orgLogo = allSettings.get('org_logo') || null;

    const avatarShapeClass = resolved.avatarShape === 'ROUNDED_SQUARE'
      ? 'rounded-square'
      : 'circle';

    const themeClass = resolved.theme === 'DARK' || resolved.theme === Theme.DARK
      ? 'theme-dark'
      : resolved.theme === 'AUTO' || resolved.theme === Theme.AUTO
        ? 'theme-auto'
        : 'theme-light';

    const fontId = card.fontFamily || '';
    const fontEntry = fontId ? FONT_MAP[fontId] : null;
    const fontDisplay = fontEntry ? fontEntry.family : "'DM Serif Display', Georgia, 'Times New Roman', serif";
    const fontUrl = fontEntry ? `https://fonts.googleapis.com/css2?family=${fontEntry.url}&display=swap` : null;

    const cssVars = this.buildCssVars(resolved.bgColor, resolved.primaryColor, resolved.textColor, fontDisplay, resolved.theme);

    const obfuscate = card.obfuscate;

    const jsonLd = this.buildJsonLd(card, cardUrl, ogImage, obfuscate);

    const nameInitial = card.name.charAt(0).toUpperCase();

    // When obfuscating, enrich phone/email arrays with encoded + masked fields
    const phones = obfuscate
      ? (card.phones as { number: string; label: string }[] | null)?.map(p => ({
          ...p,
          encodedHref: Buffer.from(`tel:${p.number}`).toString('base64'),
          encodedValue: Buffer.from(p.number).toString('base64'),
          masked: this.maskPhone(p.number),
        })) ?? null
      : card.phones;

    const emails = obfuscate
      ? (card.emails as { email: string; label: string }[] | null)?.map(e => ({
          ...e,
          encodedHref: Buffer.from(`mailto:${e.email}`).toString('base64'),
          encodedValue: Buffer.from(e.email).toString('base64'),
          masked: this.maskEmail(e.email),
        })) ?? null
      : card.emails;

    return {
      card: {
        ...card,
        phones,
        emails,
        bgImagePath: resolved.bgImagePath,
        avatarShapeClass,
        nameInitial,
      },
      obfuscate,
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
      fontUrl,
      jsonLd,
      footerText,
      footerLink,
      favicon,
      orgLogo,
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
    fontDisplay: string,
    theme: string,
  ): string {
    const vars = [
      `--bg-color: ${bgColor}`,
      `--primary-color: ${primaryColor}`,
      `--text-color: ${textColor}`,
      `--font-display: ${fontDisplay}`,
    ];

    // For AUTO mode, provide dark-variant values that CSS media queries can switch to
    if (theme.toUpperCase() === 'AUTO') {
      vars.push('--bg-color-dark: #1e1e1e');
      vars.push('--text-color-dark: #ffffff');
    }

    return vars.join('; ');
  }

  private buildJsonLd(
    card: Card,
    cardUrl: string,
    image: string | null,
    obfuscate: boolean,
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
    if (!obfuscate) {
      const emails = card.emails as { email: string; label: string }[] | null;
      if (emails && Array.isArray(emails) && emails.length > 0) {
        jsonLd.email = emails[0].email;
      }
      const phones = card.phones as { number: string; label: string }[] | null;
      if (phones && Array.isArray(phones) && phones.length > 0) {
        jsonLd.telephone = phones[0].number;
      }
    }

    return JSON.stringify(jsonLd);
  }

  private maskPhone(number: string): string {
    if (number.length <= 4) return '\u2022\u2022\u2022\u2022\u2022\u2022';
    return number.slice(0, 4) + '\u2022'.repeat(Math.min(number.length - 4, 6));
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '\u2022\u2022\u2022@\u2022\u2022\u2022';
    return parts[0][0] + '\u2022\u2022\u2022@' + parts[1];
  }
}
