export const SETTINGS_KEYS = {
  ORG_NAME: { key: 'org_name', default: 'Kontakt' },
  ORG_LOGO: { key: 'org_logo', default: null as string | null },
  ORG_FAVICON: { key: 'org_favicon', default: null as string | null },
  DEFAULT_PRIMARY_COLOR: { key: 'default_primary_color', default: '#0F172A' },
  DEFAULT_SECONDARY_COLOR: { key: 'default_secondary_color', default: '#3B82F6' },
  DEFAULT_BG_COLOR: { key: 'default_bg_color', default: '#FFFFFF' },
  DEFAULT_THEME: { key: 'default_theme', default: 'light' },
  DEFAULT_AVATAR_SHAPE: { key: 'default_avatar_shape', default: 'circle' },
  ALLOW_USER_COLOR_OVERRIDE: { key: 'allow_user_color_override', default: 'true' },
  ALLOW_USER_BACKGROUND_IMAGE: { key: 'allow_user_background_image', default: 'true' },
  DEFAULT_VISIBILITY: { key: 'default_visibility', default: 'public' },
  FOOTER_TEXT: { key: 'footer_text', default: null as string | null },
  FOOTER_LINK: { key: 'footer_link', default: null as string | null },
} as const;

export type SettingKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS]['key'];
