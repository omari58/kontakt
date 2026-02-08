interface VCardInput {
  name: string;
  jobTitle: string | null;
  company: string | null;
  phones: { number: string; label: string }[] | null;
  emails: { email: string; label: string }[] | null;
  address: { street?: string; city?: string; country?: string; zip?: string } | null;
  websites: string[] | null;
  socialLinks: { platform: string; url: string }[] | null;
  bio: string | null;
  avatarPath: string | null;
}

export class VCardBuilder {
  static build(card: VCardInput, avatarBase64?: string): string {
    const lines: string[] = [];

    lines.push('BEGIN:VCARD');
    lines.push('VERSION:4.0');
    lines.push(`FN:${escape(card.name)}`);
    lines.push(`N:${buildStructuredName(card.name)}`);

    if (card.jobTitle) {
      lines.push(`TITLE:${escape(card.jobTitle)}`);
    }

    if (card.company) {
      lines.push(`ORG:${escape(card.company)}`);
    }

    if (card.phones) {
      for (const phone of card.phones) {
        lines.push(`TEL;TYPE=${phone.label}:${phone.number}`);
      }
    }

    if (card.emails) {
      for (const email of card.emails) {
        lines.push(`EMAIL;TYPE=${email.label}:${email.email}`);
      }
    }

    if (card.address) {
      const street = card.address.street || '';
      const city = card.address.city || '';
      const zip = card.address.zip || '';
      const country = card.address.country || '';
      // ADR: PO Box;Extended;Street;City;Region;Postal Code;Country
      lines.push(`ADR;TYPE=work:;;${escape(street)};${escape(city)};;${escape(zip)};${escape(country)}`);
    }

    if (card.websites) {
      for (const url of card.websites) {
        lines.push(`URL:${url}`);
      }
    }

    if (card.socialLinks) {
      for (const link of card.socialLinks) {
        lines.push(`X-SOCIALPROFILE;TYPE=${link.platform}:${link.url}`);
      }
    }

    if (card.bio) {
      lines.push(`NOTE:${escape(card.bio)}`);
    }

    if (avatarBase64 && card.avatarPath) {
      lines.push(`PHOTO:data:image/jpeg;base64,${avatarBase64}`);
    }

    lines.push('END:VCARD');

    return lines.join('\r\n') + '\r\n';
  }
}

function escape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function buildStructuredName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return `${parts[0]};;;;`;
  }

  const lastName = parts[parts.length - 1];
  const firstName = parts[0];
  const middleNames = parts.slice(1, -1).join(' ');

  return `${lastName};${firstName};${middleNames};;`;
}
