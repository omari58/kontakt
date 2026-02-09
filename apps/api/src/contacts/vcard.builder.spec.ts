import { VCardBuilder } from './vcard.builder';

describe('VCardBuilder', () => {
  describe('build', () => {
    it('should generate a minimal vCard with name only', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('VERSION:4.0');
      expect(result).toContain('FN:John Doe');
      expect(result).toContain('N:Doe;John;;;');
      expect(result).toContain('END:VCARD');
    });

    it('should generate a full vCard with all fields', () => {
      const card = {
        name: 'John Michael Doe',
        jobTitle: 'Software Engineer',
        company: 'Acme Corp',
        phones: [
          { number: '+1-555-0100', label: 'work' },
          { number: '+1-555-0200', label: 'home' },
        ],
        emails: [
          { email: 'john@acme.com', label: 'work' },
          { email: 'john@personal.com', label: 'home' },
        ],
        address: {
          street: '123 Main St',
          city: 'Springfield',
          country: 'US',
          zip: '62701',
        },
        websites: [{ url: 'https://johndoe.com' }, { url: 'https://blog.johndoe.com' }],
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com/johndoe' },
          { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
        ],
        bio: 'A passionate developer',
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('VERSION:4.0');
      expect(result).toContain('FN:John Michael Doe');
      expect(result).toContain('N:Doe;John;Michael;;');
      expect(result).toContain('TITLE:Software Engineer');
      expect(result).toContain('ORG:Acme Corp');
      expect(result).toContain('TEL;TYPE=work:+1-555-0100');
      expect(result).toContain('TEL;TYPE=home:+1-555-0200');
      expect(result).toContain('EMAIL;TYPE=work:john@acme.com');
      expect(result).toContain('EMAIL;TYPE=home:john@personal.com');
      expect(result).toContain('ADR;TYPE=work:;;123 Main St;Springfield;;62701;US');
      expect(result).toContain('URL:https://johndoe.com');
      expect(result).toContain('URL:https://blog.johndoe.com');
      expect(result).toContain('X-SOCIALPROFILE;TYPE=twitter:https://twitter.com/johndoe');
      expect(result).toContain('X-SOCIALPROFILE;TYPE=linkedin:https://linkedin.com/in/johndoe');
      expect(result).toContain('NOTE:A passionate developer');
      expect(result).toContain('END:VCARD');
    });

    it('should escape special characters in vCard values', () => {
      const card = {
        name: 'John Doe',
        jobTitle: 'Engineer, Senior; Lead',
        company: 'Acme; Corp, Inc.',
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: 'Line 1\nLine 2\nLine 3',
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('TITLE:Engineer\\, Senior\\; Lead');
      expect(result).toContain('ORG:Acme\\; Corp\\, Inc.');
      expect(result).toContain('NOTE:Line 1\\nLine 2\\nLine 3');
    });

    it('should handle a single-word name', () => {
      const card = {
        name: 'Madonna',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('FN:Madonna');
      expect(result).toContain('N:Madonna;;;;');
    });

    it('should handle address with partial fields', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: { city: 'Springfield', country: 'US' },
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('ADR;TYPE=work:;;;Springfield;;;US');
    });

    it('should include zip code in ADR postal code position', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: { street: '123 Main St', city: 'Springfield', country: 'US', zip: '62701' },
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('ADR;TYPE=work:;;123 Main St;Springfield;;62701;US');
    });

    it('should embed avatar as base64 PHOTO when avatarBase64 is provided', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: 'avatars/test.jpg',
      };

      const avatarBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk';
      const result = VCardBuilder.build(card, avatarBase64);

      expect(result).toContain('PHOTO:data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk');
    });

    it('should not include PHOTO when no avatar data provided', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).not.toContain('PHOTO');
    });

    it('should use CRLF line endings per RFC 6350', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      // Every line should end with \r\n
      const lines = result.split('\r\n');
      expect(lines.length).toBeGreaterThan(3);
      // The last element after split on \r\n should be empty (trailing \r\n)
      expect(lines[lines.length - 1]).toBe('');
    });

    it('should escape special characters in structured name parts', () => {
      const card = {
        name: 'Jean-Pierre, De; La Fontaine',
        jobTitle: null,
        company: null,
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      // Name parts: ["Jean-Pierre,", "De;", "La", "Fontaine"]
      // lastName="Fontaine", firstName="Jean-Pierre," -> escaped "Jean-Pierre\,"
      // middle="De; La" -> escaped "De\; La"
      expect(result).toContain('N:Fontaine;Jean-Pierre\\,;De\\; La;;');
    });

    it('should escape backslashes in values', () => {
      const card = {
        name: 'John Doe',
        jobTitle: null,
        company: 'Back\\slash Corp',
        phones: null,
        emails: null,
        address: null,
        websites: null,
        socialLinks: null,
        bio: null,
        avatarPath: null,
      };

      const result = VCardBuilder.build(card);

      expect(result).toContain('ORG:Back\\\\slash Corp');
    });
  });
});
