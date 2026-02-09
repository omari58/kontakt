export interface ResolvedTheme {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  theme: string;
  avatarShape: string;
  bgImagePath: string | null;
}

interface CardThemeInput {
  primaryColor: string | null;
  bgColor: string | null;
  textColor: string | null;
  theme: string | null;
  avatarShape: string | null;
  bgImagePath: string | null;
}

export function resolveCardTheme(
  card: CardThemeInput,
  settings: Map<string, string | null>,
): ResolvedTheme {
  const allowColorOverride = settings.get('allow_user_color_override') === 'true';
  const allowBgImage = settings.get('allow_user_background_image') === 'true';

  // Resolve theme first so we can pick the right bgColor default
  const theme = resolveValue(
    card.theme,
    settings.get('default_theme') ?? 'auto',
    allowColorOverride,
  );

  const isDarkTheme = theme.toUpperCase() === 'DARK';
  const defaultBgColor = isDarkTheme ? '#1e1e1e' : (settings.get('default_bg_color') ?? '#FFFFFF');

  const primaryColor = resolveValue(
    card.primaryColor,
    settings.get('default_primary_color') ?? '#0F172A',
    allowColorOverride,
  );

  const bgColor = resolveValue(
    card.bgColor,
    defaultBgColor,
    allowColorOverride,
  );

  const avatarShape = resolveValue(
    card.avatarShape,
    settings.get('default_avatar_shape') ?? 'circle',
    allowColorOverride,
  );

  const textColor = resolveTextColor(card.textColor, bgColor, allowColorOverride);

  const bgImagePath = allowBgImage ? (card.bgImagePath ?? null) : null;

  return {
    primaryColor,
    bgColor,
    textColor,
    theme,
    avatarShape,
    bgImagePath,
  };
}

function resolveValue(
  cardValue: string | null,
  defaultValue: string,
  allowOverride: boolean,
): string {
  if (allowOverride && cardValue != null) {
    return cardValue;
  }
  return defaultValue;
}

function resolveTextColor(
  cardTextColor: string | null,
  effectiveBgColor: string,
  allowOverride: boolean,
): string {
  if (allowOverride && cardTextColor != null) {
    return cardTextColor;
  }
  return autoTextColor(effectiveBgColor);
}

function autoTextColor(hexColor: string): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
