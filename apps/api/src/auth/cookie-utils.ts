import { CookieOptions } from 'express';

/**
 * Parses a duration string (e.g., '24h', '7d', '60m', '3600s') to milliseconds.
 * Falls back to 24 hours if the format is unrecognized.
 */
export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)\s*([smhd])$/);
  if (!match) {
    return 24 * 60 * 60 * 1000; // default 24h
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export function sessionCookieOptions(maxAge: number, isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
  };
}

export function clearSessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  };
}
