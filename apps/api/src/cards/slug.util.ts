const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin extended - accented vowels
  '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a', '\u00e4': 'a', '\u00e5': 'a',
  '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e',
  '\u00ec': 'i', '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
  '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o', '\u00f6': 'o', '\u00f8': 'o',
  '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u',
  '\u00fd': 'y', '\u00ff': 'y',
  // Consonants
  '\u00f1': 'n', '\u00e7': 'c', '\u00df': 'ss',
  '\u0161': 's', '\u017e': 'z', '\u010d': 'c', '\u0159': 'r', '\u0165': 't',
  '\u0111': 'd', '\u0142': 'l', '\u011f': 'g',
  // Ligatures
  '\u00e6': 'ae', '\u0153': 'oe',
  // Uppercase versions (in case toLowerCase hasn't been applied yet)
  '\u00c0': 'a', '\u00c1': 'a', '\u00c2': 'a', '\u00c3': 'a', '\u00c4': 'a', '\u00c5': 'a',
  '\u00c8': 'e', '\u00c9': 'e', '\u00ca': 'e', '\u00cb': 'e',
  '\u00cc': 'i', '\u00cd': 'i', '\u00ce': 'i', '\u00cf': 'i',
  '\u00d2': 'o', '\u00d3': 'o', '\u00d4': 'o', '\u00d5': 'o', '\u00d6': 'o', '\u00d8': 'o',
  '\u00d9': 'u', '\u00da': 'u', '\u00db': 'u', '\u00dc': 'u',
  '\u00dd': 'y',
  '\u00d1': 'n', '\u00c7': 'c',
  '\u0160': 's', '\u017d': 'z', '\u010c': 'c', '\u0158': 'r', '\u0164': 't',
  '\u0110': 'd', '\u0141': 'l', '\u011e': 'g',
  '\u00c6': 'ae', '\u0152': 'oe',
};

const MAX_SLUG_LENGTH = 100;
const FALLBACK_SLUG = 'card';

function transliterate(str: string): string {
  return str
    .split('')
    .map((char) => TRANSLITERATION_MAP[char] ?? char)
    .join('');
}

/**
 * Generate a URL-safe slug from a name.
 * - Transliterates common unicode characters
 * - Lowercases, replaces non-alphanumeric with hyphens
 * - Collapses consecutive hyphens, strips leading/trailing hyphens
 * - Truncates to 100 chars max
 * - Falls back to 'card' if result is empty
 */
export function generateSlug(name: string): string {
  let slug = name.trim().toLowerCase();

  // Transliterate unicode characters
  slug = transliterate(slug);

  // Replace non-alphanumeric characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Truncate to max length
  if (slug.length > MAX_SLUG_LENGTH) {
    slug = slug.slice(0, MAX_SLUG_LENGTH);
    // Remove trailing hyphen after truncation
    slug = slug.replace(/-+$/, '');
  }

  // Fallback if empty
  if (!slug) {
    return FALLBACK_SLUG;
  }

  return slug;
}

/**
 * Validate a user-provided slug.
 * Rules:
 * - 2-100 characters
 * - Lowercase alphanumeric and hyphens only
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 */
export function validateSlug(slug: string): boolean {
  if (slug.length < 2 || slug.length > MAX_SLUG_LENGTH) {
    return false;
  }
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && !slug.includes('--');
}
