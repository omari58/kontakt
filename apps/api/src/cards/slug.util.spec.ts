import { generateSlug, validateSlug } from './slug.util';

describe('generateSlug', () => {
  it('converts a simple name to a slug', () => {
    expect(generateSlug('John Doe')).toBe('john-doe');
  });

  it('converts multiple spaces to a single hyphen', () => {
    expect(generateSlug('John   Doe')).toBe('john-doe');
  });

  it('strips leading and trailing whitespace', () => {
    expect(generateSlug('  John Doe  ')).toBe('john-doe');
  });

  it('removes special characters', () => {
    expect(generateSlug('John @ Doe!')).toBe('john-doe');
  });

  it('handles unicode characters by transliterating common ones', () => {
    expect(generateSlug('Mar\u00eda Garc\u00eda')).toBe('maria-garcia');
  });

  it('transliterates German characters', () => {
    expect(generateSlug('M\u00fcller Stra\u00dfe')).toBe('muller-strasse');
  });

  it('transliterates Nordic characters', () => {
    expect(generateSlug('Bj\u00f6rk \u00d8stergaard')).toBe('bjork-ostergaard');
  });

  it('strips non-transliterable unicode', () => {
    const result = generateSlug('\u4f60\u597dtest');
    expect(result).toMatch(/^[a-z0-9-]+$/);
    expect(result).toBe('test');
  });

  it('collapses consecutive hyphens', () => {
    expect(generateSlug('John --- Doe')).toBe('john-doe');
  });

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('-John Doe-')).toBe('john-doe');
  });

  it('handles empty string by returning a fallback', () => {
    expect(generateSlug('')).toBe('card');
  });

  it('handles string with only special characters', () => {
    expect(generateSlug('!@#$%')).toBe('card');
  });

  it('truncates very long names to max 100 characters', () => {
    const longName = 'a'.repeat(200);
    const result = generateSlug(longName);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('does not end with a hyphen after truncation', () => {
    // Create a name that would have a hyphen at position 100 after slugification
    const name = ('abcdefghij '.repeat(10)).trim(); // 109 chars with spaces
    const result = generateSlug(name);
    expect(result).not.toMatch(/-$/);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('converts uppercase to lowercase', () => {
    expect(generateSlug('JOHN DOE')).toBe('john-doe');
  });

  it('handles numbers in the name', () => {
    expect(generateSlug('Agent 007')).toBe('agent-007');
  });

  it('handles mixed alphanumeric and special chars', () => {
    expect(generateSlug("John's Card #1")).toBe('john-s-card-1');
  });
});

describe('validateSlug', () => {
  it('accepts a valid slug', () => {
    expect(validateSlug('john-doe')).toBe(true);
  });

  it('accepts a slug with numbers', () => {
    expect(validateSlug('john-doe-2')).toBe(true);
  });

  it('accepts a two-character slug', () => {
    expect(validateSlug('ab')).toBe(true);
  });

  it('accepts a 100-character slug', () => {
    expect(validateSlug('a'.repeat(100))).toBe(true);
  });

  it('rejects a single character slug', () => {
    expect(validateSlug('a')).toBe(false);
  });

  it('rejects a slug longer than 100 characters', () => {
    expect(validateSlug('a'.repeat(101))).toBe(false);
  });

  it('rejects slugs with uppercase letters', () => {
    expect(validateSlug('John-Doe')).toBe(false);
  });

  it('rejects slugs with special characters', () => {
    expect(validateSlug('john_doe')).toBe(false);
  });

  it('rejects slugs with leading hyphens', () => {
    expect(validateSlug('-john-doe')).toBe(false);
  });

  it('rejects slugs with trailing hyphens', () => {
    expect(validateSlug('john-doe-')).toBe(false);
  });

  it('rejects slugs with consecutive hyphens', () => {
    expect(validateSlug('john--doe')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateSlug('')).toBe(false);
  });

  it('rejects slugs with spaces', () => {
    expect(validateSlug('john doe')).toBe(false);
  });
});
