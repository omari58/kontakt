import { computed, type Ref } from 'vue';
import type { Card, SignatureConfig, SignatureLayout } from '@/types';

const APP_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
  (typeof window !== 'undefined' && window.location.origin) ||
  '';

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${APP_URL}${path}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function platformName(platform: string): string {
  const names: Record<string, string> = {
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    github: 'GitHub',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    mastodon: 'Mastodon',
    bluesky: 'Bluesky',
  };
  return names[platform.toLowerCase()] ?? platform.charAt(0).toUpperCase() + platform.slice(1);
}

function resolveAccentColor(config: SignatureConfig, card: Card): string {
  return config.accentColor || card.primaryColor || '#2563eb';
}

function filterByIndices<T>(items: T[] | null | undefined, selected: number[]): T[] {
  if (!items?.length) return [];
  if (!selected.length) return items;
  return selected.filter((i) => i < items.length).map((i) => items[i]!);
}

function buildCompactHtml(card: Card, config: SignatureConfig): string {
  const accent = resolveAccentColor(config, card);
  const fields = config.fields;
  const lines: string[] = [];

  lines.push(`<table cellpadding="0" cellspacing="0" border="0" style="max-width:500px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;">`);
  lines.push(`<tr>`);

  // Avatar cell
  if (fields.avatar && card.avatarPath) {
    const radius = (config.avatarShape ?? 'rounded-square') === 'circle' ? '50%' : '4px';
    lines.push(`<td style="vertical-align:top;padding-right:12px;">`);
    lines.push(`<img src="${escapeHtml(resolveUrl(card.avatarPath))}" width="48" height="48" alt="${escapeHtml(card.name)}" style="display:block;border-radius:${radius};" />`);
    lines.push(`</td>`);
  }

  // Info cell
  lines.push(`<td style="vertical-align:top;">`);

  // Line 1: Name | Job Title, Company
  const nameParts: string[] = [`<strong style="color:${escapeHtml(accent)};">${escapeHtml(card.name)}</strong>`];
  const titleParts: string[] = [];
  if (card.jobTitle) titleParts.push(escapeHtml(card.jobTitle));
  if (card.company) titleParts.push(escapeHtml(card.company));
  if (titleParts.length > 0) nameParts.push(titleParts.join(', '));
  lines.push(`<div>${nameParts.join(' | ')}</div>`);

  // Line 2: Pronouns
  if (fields.pronouns && card.pronouns) {
    lines.push(`<div style="font-size:12px;color:#666666;">${escapeHtml(card.pronouns)}</div>`);
  }

  // Line 3: Contact info
  const contactParts: string[] = [];
  if (fields.email) {
    for (const e of filterByIndices(card.emails, config.selectedEmails)) {
      contactParts.push(`<a href="mailto:${escapeHtml(e.email)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(e.email)}</a>`);
    }
  }
  if (fields.phone) {
    for (const p of filterByIndices(card.phones, config.selectedPhones)) {
      contactParts.push(`<a href="tel:${escapeHtml(p.number)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(p.number)}</a>`);
    }
  }
  if (fields.website) {
    for (const w of filterByIndices(card.websites, config.selectedWebsites)) {
      contactParts.push(`<a href="${escapeHtml(w.url)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(w.label || w.url)}</a>`);
    }
  }
  if (contactParts.length > 0) {
    if (config.contactColumns === 2) {
      lines.push(`<table cellpadding="0" cellspacing="0" border="0" style="font-size:12px;">`);
      for (let i = 0; i < contactParts.length; i += 2) {
        lines.push(`<tr>`);
        lines.push(`<td style="padding:1px 8px 1px 0;vertical-align:top;">${contactParts[i]}</td>`);
        lines.push(`<td style="padding:1px 0;vertical-align:top;">${contactParts[i + 1] ?? ''}</td>`);
        lines.push(`</tr>`);
      }
      lines.push(`</table>`);
    } else {
      lines.push(`<div style="font-size:12px;">${contactParts.join(' &middot; ')}</div>`);
    }
  }

  // Social icons + card link
  const actionParts: string[] = [];
  if (fields.socials && card.socialLinks?.length) {
    for (const link of card.socialLinks) {
      actionParts.push(
        `<a href="${escapeHtml(link.url)}" style="text-decoration:none;"><img src="${APP_URL}/public/assets/social/${escapeHtml(link.platform.toLowerCase())}.png" width="20" height="20" alt="${escapeHtml(platformName(link.platform))}" style="display:inline-block;vertical-align:middle;" /></a>`,
      );
    }
  }
  if (fields.cardLink) {
    actionParts.push(`<a href="${APP_URL}/c/${escapeHtml(card.slug)}" style="color:${escapeHtml(accent)};text-decoration:none;font-size:12px;">${escapeHtml(config.cardLinkText || 'View my card')}</a>`);
  }
  if (fields.calendar && card.calendarUrl) {
    actionParts.push(`<a href="${escapeHtml(card.calendarUrl)}" style="color:${escapeHtml(accent)};text-decoration:none;font-size:12px;">Book a meeting</a>`);
  }
  if (actionParts.length > 0) {
    lines.push(`<div style="margin-top:4px;">${actionParts.join(' ')}</div>`);
  }

  // Disclaimer
  if (fields.disclaimer && config.disclaimer) {
    lines.push(`<div style="margin-top:4px;font-size:10px;color:#999999;">${escapeHtml(config.disclaimer)}</div>`);
  }

  lines.push(`</td>`);
  lines.push(`</tr>`);
  lines.push(`</table>`);

  return lines.join('');
}

function buildClassicHtml(card: Card, config: SignatureConfig): string {
  const accent = resolveAccentColor(config, card);
  const fields = config.fields;
  const lines: string[] = [];

  lines.push(`<table cellpadding="0" cellspacing="0" border="0" style="max-width:500px;font-family:Georgia,serif;font-size:14px;color:#333333;">`);
  lines.push(`<tr>`);

  // Avatar cell
  if (fields.avatar && card.avatarPath) {
    const radius = (config.avatarShape ?? 'rounded-square') === 'circle' ? '50%' : '8px';
    lines.push(`<td style="vertical-align:top;padding-right:16px;">`);
    lines.push(`<img src="${escapeHtml(resolveUrl(card.avatarPath))}" width="80" height="80" alt="${escapeHtml(card.name)}" style="display:block;border-radius:${radius};" />`);
    lines.push(`</td>`);
  }

  // Info cell
  lines.push(`<td style="vertical-align:top;">`);

  // Name heading
  lines.push(`<div style="font-size:18px;font-weight:bold;color:${escapeHtml(accent)};">${escapeHtml(card.name)}</div>`);

  // Job title + company
  const titleParts: string[] = [];
  if (card.jobTitle) titleParts.push(escapeHtml(card.jobTitle));
  if (card.company) titleParts.push(escapeHtml(card.company));
  if (titleParts.length > 0) {
    lines.push(`<div style="font-size:13px;color:#555555;">${titleParts.join(' &middot; ')}</div>`);
  }

  // Pronouns
  if (fields.pronouns && card.pronouns) {
    lines.push(`<div style="font-size:12px;color:#777777;">${escapeHtml(card.pronouns)}</div>`);
  }

  // Horizontal rule
  lines.push(`<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0;"><tr><td style="border-top:1px solid ${escapeHtml(accent)};font-size:1px;line-height:1px;">&nbsp;</td></tr></table>`);

  // Contact details
  const contactItems: string[] = [];
  if (fields.email) {
    for (const e of filterByIndices(card.emails, config.selectedEmails)) {
      contactItems.push(`<a href="mailto:${escapeHtml(e.email)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(e.email)}</a>`);
    }
  }
  if (fields.phone) {
    for (const p of filterByIndices(card.phones, config.selectedPhones)) {
      contactItems.push(`<a href="tel:${escapeHtml(p.number)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(p.number)}</a>`);
    }
  }
  if (fields.website) {
    for (const w of filterByIndices(card.websites, config.selectedWebsites)) {
      contactItems.push(`<a href="${escapeHtml(w.url)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(w.label || w.url)}</a>`);
    }
  }
  if (contactItems.length > 0) {
    if (config.contactColumns === 2) {
      lines.push(`<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;">`);
      for (let i = 0; i < contactItems.length; i += 2) {
        lines.push(`<tr>`);
        lines.push(`<td style="padding:1px 8px 1px 0;vertical-align:top;">${contactItems[i]}</td>`);
        lines.push(`<td style="padding:1px 0;vertical-align:top;">${contactItems[i + 1] ?? ''}</td>`);
        lines.push(`</tr>`);
      }
      lines.push(`</table>`);
    } else {
      for (const item of contactItems) {
        lines.push(`<div style="font-size:13px;">${item}</div>`);
      }
    }
  }

  // Social icons row
  if (fields.socials && card.socialLinks?.length) {
    const icons = card.socialLinks.map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" style="text-decoration:none;"><img src="${APP_URL}/public/assets/social/${escapeHtml(link.platform.toLowerCase())}.png" width="20" height="20" alt="${escapeHtml(platformName(link.platform))}" style="display:inline-block;vertical-align:middle;margin-right:4px;" /></a>`,
    );
    lines.push(`<div style="margin-top:8px;">${icons.join('')}</div>`);
  }

  // Card link + calendar link
  const linkParts: string[] = [];
  if (fields.cardLink) {
    linkParts.push(`<a href="${APP_URL}/c/${escapeHtml(card.slug)}" style="color:${escapeHtml(accent)};text-decoration:none;font-size:12px;">${escapeHtml(config.cardLinkText || 'View my card')}</a>`);
  }
  if (fields.calendar && card.calendarUrl) {
    linkParts.push(`<a href="${escapeHtml(card.calendarUrl)}" style="color:${escapeHtml(accent)};text-decoration:none;font-size:12px;">Book a meeting</a>`);
  }
  if (linkParts.length > 0) {
    lines.push(`<div style="margin-top:4px;">${linkParts.join(' &middot; ')}</div>`);
  }

  // Disclaimer
  if (fields.disclaimer && config.disclaimer) {
    lines.push(`<div style="margin-top:8px;font-size:10px;color:#999999;">${escapeHtml(config.disclaimer)}</div>`);
  }

  lines.push(`</td>`);
  lines.push(`</tr>`);
  lines.push(`</table>`);

  return lines.join('');
}

function buildMinimalHtml(card: Card, config: SignatureConfig): string {
  const accent = resolveAccentColor(config, card);
  const fields = config.fields;
  const lines: string[] = [];

  lines.push(`<table cellpadding="0" cellspacing="0" border="0" style="max-width:500px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;">`);

  // Line 1: Name . Title at Company (pronouns)
  const parts: string[] = [`<strong>${escapeHtml(card.name)}</strong>`];
  const titleParts: string[] = [];
  if (card.jobTitle) titleParts.push(escapeHtml(card.jobTitle));
  if (card.company) titleParts.push('at ' + escapeHtml(card.company));
  if (titleParts.length > 0) parts.push(titleParts.join(' '));
  if (fields.pronouns && card.pronouns) parts.push(`(${escapeHtml(card.pronouns)})`);

  lines.push(`<tr><td>${parts.join(' &middot; ')}</td></tr>`);

  // Line 2: Contact details separated by middot
  const contactParts: string[] = [];
  if (fields.email) {
    for (const e of filterByIndices(card.emails, config.selectedEmails)) {
      contactParts.push(`<a href="mailto:${escapeHtml(e.email)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(e.email)}</a>`);
    }
  }
  if (fields.phone) {
    for (const p of filterByIndices(card.phones, config.selectedPhones)) {
      contactParts.push(`<a href="tel:${escapeHtml(p.number)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(p.number)}</a>`);
    }
  }
  if (fields.website) {
    for (const w of filterByIndices(card.websites, config.selectedWebsites)) {
      contactParts.push(`<a href="${escapeHtml(w.url)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(w.label || w.url)}</a>`);
    }
  }
  if (contactParts.length > 0) {
    lines.push(`<tr><td style="font-size:12px;">${contactParts.join(' &middot; ')}</td></tr>`);
  }

  // Social links as text
  if (fields.socials && card.socialLinks?.length) {
    const socialParts = card.socialLinks.map(
      (link) => `<a href="${escapeHtml(link.url)}" style="color:${escapeHtml(accent)};text-decoration:none;">${escapeHtml(platformName(link.platform))}</a>`,
    );
    lines.push(`<tr><td style="font-size:12px;">${socialParts.join(' &middot; ')}</td></tr>`);
  }

  // Card link + calendar as text links
  const linkParts: string[] = [];
  if (fields.cardLink) {
    linkParts.push(`<a href="${APP_URL}/c/${escapeHtml(card.slug)}" style="color:${escapeHtml(accent)};text-decoration:none;">View my card</a>`);
  }
  if (fields.calendar && card.calendarUrl) {
    linkParts.push(`<a href="${escapeHtml(card.calendarUrl)}" style="color:${escapeHtml(accent)};text-decoration:none;">Book a meeting</a>`);
  }
  if (linkParts.length > 0) {
    lines.push(`<tr><td style="font-size:12px;">${linkParts.join(' &middot; ')}</td></tr>`);
  }

  // Disclaimer
  if (fields.disclaimer && config.disclaimer) {
    lines.push(`<tr><td style="font-size:10px;color:#999999;padding-top:4px;">${escapeHtml(config.disclaimer)}</td></tr>`);
  }

  lines.push(`</table>`);

  return lines.join('');
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<a[^>]+href="([^"]*)"[^>]*>[^<]*<\/a>/g, (_, url) => url)
    .replace(/<img[^>]+alt="([^"]*)"[^>]*\/?>/g, (_, alt) => `[${alt}]`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|tr|td|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&middot;/g, '\u00B7')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function useSignatureHtml(
  card: Ref<Card>,
  config: Ref<SignatureConfig>,
  layout: Ref<SignatureLayout>,
) {
  const html = computed(() => {
    const c = card.value;
    const cfg = config.value;
    const l = layout.value;

    switch (l) {
      case 'COMPACT':
        return buildCompactHtml(c, cfg);
      case 'CLASSIC':
        return buildClassicHtml(c, cfg);
      case 'MINIMAL':
        return buildMinimalHtml(c, cfg);
      default:
        return buildClassicHtml(c, cfg);
    }
  });

  const plainText = computed(() => htmlToPlainText(html.value));

  return { html, plainText };
}
