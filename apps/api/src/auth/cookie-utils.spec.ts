import { parseExpiryToMs, sessionCookieOptions, clearSessionCookieOptions } from './cookie-utils';

describe('cookie-utils', () => {
  describe('parseExpiryToMs', () => {
    it('should parse hours', () => {
      expect(parseExpiryToMs('24h')).toBe(24 * 60 * 60 * 1000);
      expect(parseExpiryToMs('1h')).toBe(60 * 60 * 1000);
    });

    it('should parse days', () => {
      expect(parseExpiryToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should parse minutes', () => {
      expect(parseExpiryToMs('30m')).toBe(30 * 60 * 1000);
    });

    it('should parse seconds', () => {
      expect(parseExpiryToMs('3600s')).toBe(3600 * 1000);
    });

    it('should default to 24h for unrecognized format', () => {
      expect(parseExpiryToMs('invalid')).toBe(24 * 60 * 60 * 1000);
      expect(parseExpiryToMs('')).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('sessionCookieOptions', () => {
    it('should return cookie options with given maxAge', () => {
      const opts = sessionCookieOptions(3600000, true);

      expect(opts.httpOnly).toBe(true);
      expect(opts.secure).toBe(true);
      expect(opts.sameSite).toBe('lax');
      expect(opts.maxAge).toBe(3600000);
    });

    it('should set secure false in non-production', () => {
      const opts = sessionCookieOptions(3600000, false);
      expect(opts.secure).toBe(false);
    });
  });

  describe('clearSessionCookieOptions', () => {
    it('should return options without maxAge for clearing', () => {
      const opts = clearSessionCookieOptions(true);

      expect(opts.httpOnly).toBe(true);
      expect(opts.secure).toBe(true);
      expect(opts.sameSite).toBe('lax');
      expect(opts).not.toHaveProperty('maxAge');
    });
  });
});
