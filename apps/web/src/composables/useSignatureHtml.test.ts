import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useSignatureHtml } from './useSignatureHtml';
import type { Card, SignatureConfig, SignatureLayout } from '@/types';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    slug: 'john-doe',
    userId: 'user-1',
    name: 'John Doe',
    jobTitle: 'Engineer',
    company: 'Acme Corp',
    phones: [{ number: '+1234567890', label: 'work' }],
    emails: [{ email: 'john@acme.com', label: 'work' }],
    address: null,
    websites: [{ url: 'https://acme.com', label: 'Acme' }],
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
      { platform: 'twitter', url: 'https://twitter.com/johndoe' },
    ],
    bio: null,
    pronouns: 'he/him',
    calendarUrl: 'https://cal.com/johndoe',
    avatarPath: '/uploads/avatars/john.jpg',
    bannerPath: null,
    bgImagePath: null,
    bgColor: null,
    primaryColor: '#0066cc',
    textColor: null,
    fontFamily: null,
    avatarShape: null,
    theme: null,
    visibility: 'PUBLIC',
    noIndex: false,
    obfuscate: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeConfig(overrides: Partial<SignatureConfig> = {}): SignatureConfig {
  return {
    fields: {
      phone: true,
      email: true,
      website: true,
      socials: true,
      pronouns: true,
      calendar: true,
      disclaimer: true,
      cardLink: true,
    },
    disclaimer: 'Confidential',
    accentColor: '#2563eb',
    ...overrides,
  };
}

describe('useSignatureHtml', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { origin: 'https://kontakt.example.com' });
  });

  describe('compact layout', () => {
    it('generates valid table HTML with avatar and inline info', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('<table');
      expect(html.value).toContain('</table>');
      expect(html.value).toContain('<img');
      expect(html.value).toContain('John Doe');
      expect(html.value).toContain('Engineer');
      expect(html.value).toContain('john@acme.com');
      expect(html.value).toContain('+1234567890');
    });
  });

  describe('classic layout', () => {
    it('includes horizontal rule and stacked fields', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      // Horizontal rule via table border trick
      expect(html.value).toContain('border-top:1px solid');
      // Stacked fields - each on own line (separate divs)
      expect(html.value).toContain('john@acme.com');
      expect(html.value).toContain('+1234567890');
      // Name as heading
      expect(html.value).toContain('font-size:18px');
      expect(html.value).toContain('John Doe');
    });
  });

  describe('minimal layout', () => {
    it('has no <img> tags', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('MINIMAL');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).not.toContain('<img');
      expect(html.value).toContain('John Doe');
      expect(html.value).toContain('<table');
    });

    it('uses text labels for social links', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('MINIMAL');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('LinkedIn');
      expect(html.value).toContain('Twitter');
      expect(html.value).not.toContain('.png');
    });
  });

  describe('field toggles', () => {
    it('omits fields when toggles are disabled', () => {
      const card = ref(makeCard());
      const config = ref(
        makeConfig({
          fields: {
            phone: false,
            email: false,
            website: false,
            socials: false,
            pronouns: false,
            calendar: false,
            disclaimer: false,
            cardLink: false,
          },
        }),
      );
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).not.toContain('john@acme.com');
      expect(html.value).not.toContain('+1234567890');
      expect(html.value).not.toContain('https://acme.com');
      expect(html.value).not.toContain('linkedin');
      expect(html.value).not.toContain('he/him');
      expect(html.value).not.toContain('cal.com');
      expect(html.value).not.toContain('Confidential');
      expect(html.value).not.toContain('/c/john-doe');
      // Name should still be present
      expect(html.value).toContain('John Doe');
    });
  });

  describe('missing card data', () => {
    it('omits phone even if toggle is on when card has no phone', () => {
      const card = ref(makeCard({ phones: null }));
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).not.toContain('tel:');
      expect(html.value).toContain('john@acme.com');
    });

    it('omits pronouns when card has no pronouns even if toggle is on', () => {
      const card = ref(makeCard({ pronouns: null }));
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).not.toContain('he/him');
    });
  });

  describe('accent color fallback', () => {
    it('uses config.accentColor when set', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig({ accentColor: '#ff0000' }));
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('#ff0000');
    });

    it('falls back to card.primaryColor when accentColor is empty', () => {
      const card = ref(makeCard({ primaryColor: '#00ff00' }));
      const config = ref(makeConfig({ accentColor: '' }));
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('#00ff00');
    });

    it('falls back to default #2563eb when both are empty', () => {
      const card = ref(makeCard({ primaryColor: null }));
      const config = ref(makeConfig({ accentColor: '' }));
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('#2563eb');
    });
  });

  describe('social icons', () => {
    it('uses <img> tags in compact layout', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('/assets/social/linkedin.png');
      expect(html.value).toContain('width="20"');
      expect(html.value).toContain('height="20"');
    });

    it('uses <img> tags in classic layout', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('/assets/social/linkedin.png');
    });

    it('uses text labels in minimal layout', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('MINIMAL');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('>LinkedIn</a>');
      expect(html.value).toContain('>Twitter</a>');
      expect(html.value).not.toContain('.png');
    });
  });

  describe('card link', () => {
    it('points to correct /c/{slug} URL', () => {
      const card = ref(makeCard({ slug: 'my-card' }));
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toContain('/c/my-card');
    });
  });

  describe('absolute image URLs', () => {
    it('avatar URL is absolute', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      // Should not have just /uploads, should have the full URL
      expect(html.value).toMatch(/src="[^"]*\/uploads\/avatars\/john\.jpg"/);
    });

    it('social icon URLs are absolute', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('COMPACT');

      const { html } = useSignatureHtml(card, config, layout);

      expect(html.value).toMatch(/src="[^"]*\/assets\/social\/linkedin\.png"/);
    });
  });

  describe('no <style> blocks', () => {
    it('output contains no <style> tags', () => {
      const layouts: SignatureLayout[] = ['COMPACT', 'CLASSIC', 'MINIMAL'];
      for (const l of layouts) {
        const card = ref(makeCard());
        const config = ref(makeConfig());
        const layout = ref<SignatureLayout>(l);

        const { html } = useSignatureHtml(card, config, layout);

        expect(html.value).not.toContain('<style');
      }
    });
  });

  describe('XSS protection', () => {
    it('escapes adversarial input in card fields', () => {
      const card = ref(
        makeCard({
          name: '<script>alert("xss")</script>',
          jobTitle: 'Engineer\' onclick="hack()"',
          company: '<img src=x onerror=alert(1)>',
          emails: [{ email: 'a"onmouseover="alert(1)@example.com', label: 'work' }],
        }),
      );
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { html } = useSignatureHtml(card, config, layout);

      // Raw HTML tags must be escaped
      expect(html.value).not.toContain('<script>');
      expect(html.value).not.toContain('<img src=x');
      expect(html.value).toContain('&lt;script&gt;');
      expect(html.value).toContain('&lt;img src=x onerror=alert(1)&gt;');
      // Single quotes must be escaped
      expect(html.value).toContain('&#39;');
      // Quotes in attribute contexts must be escaped
      expect(html.value).toContain('&quot;onmouseover=&quot;');
      expect(html.value).not.toMatch(/onclick="hack\(\)"/);
      expect(html.value).not.toMatch(/onmouseover="alert\(1\)"/);

    });
  });

  describe('plain text output', () => {
    it('strips HTML and preserves info', () => {
      const card = ref(makeCard());
      const config = ref(makeConfig());
      const layout = ref<SignatureLayout>('CLASSIC');

      const { plainText } = useSignatureHtml(card, config, layout);

      expect(plainText.value).toContain('John Doe');
      expect(plainText.value).toContain('john@acme.com');
      expect(plainText.value).not.toContain('<');
      expect(plainText.value).not.toContain('>');
    });
  });
});
