export type Role = 'USER' | 'ADMIN';
export type AvatarShape = 'CIRCLE' | 'ROUNDED_SQUARE';
export type Theme = 'LIGHT' | 'DARK' | 'AUTO';
export type Visibility = 'PUBLIC' | 'UNLISTED' | 'DISABLED';

export interface User {
  id: string;
  oidcSub: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Phone {
  number: string;
  label?: string;
}

export interface Email {
  email: string;
  label?: string;
}

export interface Address {
  street?: string;
  city?: string;
  country?: string;
  zip?: string;
}

export interface Website {
  url: string;
  label?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Card {
  id: string;
  slug: string;
  userId: string;
  name: string;
  jobTitle: string | null;
  company: string | null;
  phones: Phone[] | null;
  emails: Email[] | null;
  address: Address | null;
  websites: Website[] | null;
  socialLinks: SocialLink[] | null;
  bio: string | null;
  pronouns: string | null;
  calendarUrl: string | null;
  avatarPath: string | null;
  bannerPath: string | null;
  bgImagePath: string | null;
  bgColor: string | null;
  primaryColor: string | null;
  textColor: string | null;
  fontFamily: string | null;
  avatarShape: AvatarShape | null;
  theme: Theme | null;
  visibility: Visibility;
  noIndex: boolean;
  obfuscate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCard extends Card {
  user: { name: string; email: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface UpdateSettingsPayload {
  settings: Setting[];
}

export type SignatureLayout = 'COMPACT' | 'CLASSIC' | 'MINIMAL';

export interface SignatureFieldToggles {
  avatar: boolean;
  phone: boolean;
  email: boolean;
  website: boolean;
  socials: boolean;
  pronouns: boolean;
  calendar: boolean;
  disclaimer: boolean;
  cardLink: boolean;
}

export interface SignatureConfig {
  fields: SignatureFieldToggles;
  disclaimer: string;
  accentColor: string;
  contactColumns: 1 | 2;
  cardLinkText: string;
}

export interface Signature {
  id: string;
  name: string;
  cardId: string;
  card: { id: string; name: string; slug: string; avatarPath: string | null };
  userId: string;
  layout: SignatureLayout;
  config: SignatureConfig;
  createdAt: string;
  updatedAt: string;
}
