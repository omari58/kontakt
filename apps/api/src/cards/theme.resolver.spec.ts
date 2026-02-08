import { resolveCardTheme, ResolvedTheme } from './theme.resolver';

describe('resolveCardTheme', () => {
  const defaultSettings = new Map<string, string | null>([
    ['default_primary_color', '#0F172A'],
    ['default_secondary_color', '#3B82F6'],
    ['default_bg_color', '#FFFFFF'],
    ['default_theme', 'light'],
    ['default_avatar_shape', 'circle'],
    ['allow_user_color_override', 'true'],
    ['allow_user_background_image', 'true'],
  ]);

  const cardWithOverrides = {
    primaryColor: '#FF0000',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    theme: 'DARK',
    avatarShape: 'ROUNDED_SQUARE',
    bgImagePath: '/uploads/cards/card-1/background.webp',
  };

  const cardWithoutOverrides = {
    primaryColor: null,
    bgColor: null,
    textColor: null,
    theme: null,
    avatarShape: null,
    bgImagePath: null,
  };

  describe('when overrides are allowed', () => {
    it('should use card values when card has overrides', () => {
      const result = resolveCardTheme(cardWithOverrides, defaultSettings);

      expect(result.primaryColor).toBe('#FF0000');
      expect(result.bgColor).toBe('#000000');
      expect(result.textColor).toBe('#FFFFFF');
      expect(result.theme).toBe('DARK');
      expect(result.avatarShape).toBe('ROUNDED_SQUARE');
      expect(result.bgImagePath).toBe('/uploads/cards/card-1/background.webp');
    });

    it('should use instance defaults when card has no overrides', () => {
      const result = resolveCardTheme(cardWithoutOverrides, defaultSettings);

      expect(result.primaryColor).toBe('#0F172A');
      expect(result.bgColor).toBe('#FFFFFF');
      expect(result.theme).toBe('light');
      expect(result.avatarShape).toBe('circle');
    });
  });

  describe('when overrides are disallowed', () => {
    const noOverrideSettings = new Map<string, string | null>([
      ['default_primary_color', '#0F172A'],
      ['default_secondary_color', '#3B82F6'],
      ['default_bg_color', '#FFFFFF'],
      ['default_theme', 'light'],
      ['default_avatar_shape', 'circle'],
      ['allow_user_color_override', 'false'],
      ['allow_user_background_image', 'false'],
    ]);

    it('should use instance defaults even when card has overrides', () => {
      const result = resolveCardTheme(cardWithOverrides, noOverrideSettings);

      expect(result.primaryColor).toBe('#0F172A');
      expect(result.bgColor).toBe('#FFFFFF');
      expect(result.theme).toBe('light');
      expect(result.avatarShape).toBe('circle');
    });

    it('should strip bgImagePath when background images are not allowed', () => {
      const result = resolveCardTheme(cardWithOverrides, noOverrideSettings);

      expect(result.bgImagePath).toBeNull();
    });
  });

  describe('textColor auto-calculation', () => {
    it('should auto-calculate white text for dark backgrounds', () => {
      const card = { ...cardWithoutOverrides, bgColor: '#000000' };
      const settings = new Map(defaultSettings);
      settings.set('default_bg_color', '#000000');

      const result = resolveCardTheme(card, settings);

      expect(result.textColor).toBe('#FFFFFF');
    });

    it('should auto-calculate dark text for light backgrounds', () => {
      const card = { ...cardWithoutOverrides, bgColor: '#FFFFFF' };
      const settings = new Map(defaultSettings);
      settings.set('default_bg_color', '#FFFFFF');

      const result = resolveCardTheme(card, settings);

      expect(result.textColor).toBe('#000000');
    });

    it('should use explicit text color when provided', () => {
      const card = { ...cardWithoutOverrides, textColor: '#ABCDEF' };

      const result = resolveCardTheme(card, defaultSettings);

      expect(result.textColor).toBe('#ABCDEF');
    });
  });

  describe('background image', () => {
    it('should keep bgImagePath when allowed', () => {
      const card = {
        ...cardWithoutOverrides,
        bgImagePath: '/uploads/cards/card-1/background.webp',
      };

      const result = resolveCardTheme(card, defaultSettings);

      expect(result.bgImagePath).toBe('/uploads/cards/card-1/background.webp');
    });

    it('should strip bgImagePath when not allowed', () => {
      const settings = new Map(defaultSettings);
      settings.set('allow_user_background_image', 'false');

      const card = {
        ...cardWithoutOverrides,
        bgImagePath: '/uploads/cards/card-1/background.webp',
      };

      const result = resolveCardTheme(card, settings);

      expect(result.bgImagePath).toBeNull();
    });
  });
});
