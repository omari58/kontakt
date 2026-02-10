import { reactive, ref, computed, watch } from 'vue';
import { useApi, ApiError } from './useApi';
import i18n from '@/i18n';
import type { Card, Phone, Email, Website, Address, SocialLink, AvatarShape, Theme, Visibility } from '@/types';

export interface CardFormData {
  name: string;
  jobTitle: string;
  company: string;
  bio: string;
  phones: Phone[];
  emails: Email[];
  address: Address;
  websites: Website[];
  socialLinks: SocialLink[];
  bgColor: string;
  primaryColor: string;
  textColor: string;
  fontFamily: string;
  avatarShape: AvatarShape;
  theme: Theme;
  visibility: Visibility;
  noIndex: boolean;
  obfuscate: boolean;
  slug: string;
}

function createEmptyForm(): CardFormData {
  return {
    name: '',
    jobTitle: '',
    company: '',
    bio: '',
    phones: [],
    emails: [],
    address: { street: '', city: '', country: '', zip: '' },
    websites: [],
    socialLinks: [],
    bgColor: '#ffffff',
    primaryColor: '#0066cc',
    textColor: '#111111',
    fontFamily: '',
    avatarShape: 'CIRCLE',
    theme: 'AUTO',
    visibility: 'PUBLIC',
    noIndex: false,
    obfuscate: false,
    slug: '',
  };
}

const THEME_DEFAULTS = {
  LIGHT: { bgColor: '#ffffff', textColor: '#111111' },
  DARK:  { bgColor: '#1e1e1e', textColor: '#ffffff' },
  AUTO:  { bgColor: '#ffffff', textColor: '#111111' },
} as const;

function friendlyMessage(rawMessage: string, t: (key: string) => string): string {
  if (rawMessage.includes('must be an email')) return t('errors.fields.invalidEmail');
  if (rawMessage.includes('must be a URL address') || rawMessage.includes('must be an URL address'))
    return t('errors.fields.invalidUrl');
  if (rawMessage.includes('valid hex color')) return t('errors.fields.invalidColor');
  if (rawMessage.includes('should not be empty')) return t('errors.fields.required');
  if (rawMessage.includes('must be a string')) return t('errors.fields.invalidValue');
  if (rawMessage.includes('should not exist')) return t('errors.fields.unknownField');
  if (rawMessage.includes('File too large')) return t('errors.fields.fileTooLarge');
  if (rawMessage.includes('Invalid file type')) return t('errors.fields.invalidFileType');
  if (/slug must be/.test(rawMessage)) return t('errors.fields.invalidSlug');
  return rawMessage;
}

function normalizeFieldPath(apiPath: string): string {
  return apiPath.split('.')[0] ?? apiPath;
}

export function useCardForm(cardId?: string) {
  const api = useApi();
  const t = i18n.global.t;

  const form = reactive<CardFormData>(createEmptyForm());
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const fieldErrors = ref<Record<string, string[]>>({});
  const isDirty = ref(false);
  const savedSnapshot = ref('');

  const isEditMode = computed(() => !!cardId && cardId !== 'new');

  const avatarUrl = ref<string | null>(null);
  const bannerUrl = ref<string | null>(null);
  const backgroundUrl = ref<string | null>(null);

  function takeSnapshot() {
    savedSnapshot.value = JSON.stringify(form);
    isDirty.value = false;
  }

  watch(form, () => {
    if (savedSnapshot.value) {
      isDirty.value = JSON.stringify(form) !== savedSnapshot.value;
    }
    if (Object.keys(fieldErrors.value).length > 0) {
      fieldErrors.value = {};
      error.value = null;
    }
  }, { deep: true });

  // Auto-adjust bgColor/textColor when theme changes, but only if they
  // still match the previous theme's defaults (preserve manual overrides)
  watch(
    () => form.theme,
    (newTheme, oldTheme) => {
      if (!oldTheme || !newTheme) return;
      const oldD = THEME_DEFAULTS[oldTheme as keyof typeof THEME_DEFAULTS];
      const newD = THEME_DEFAULTS[newTheme as keyof typeof THEME_DEFAULTS];
      if (!oldD || !newD) return;
      if (form.bgColor.toLowerCase() === oldD.bgColor) form.bgColor = newD.bgColor;
      if (form.textColor.toLowerCase() === oldD.textColor) form.textColor = newD.textColor;
    },
  );

  async function loadCard() {
    if (!cardId) return;
    loading.value = true;
    error.value = null;
    try {
      const card = await api.get<Card>(`/api/cards/${cardId}`);
      form.name = card.name;
      form.jobTitle = card.jobTitle ?? '';
      form.company = card.company ?? '';
      form.bio = card.bio ?? '';
      form.phones = card.phones ?? [];
      form.emails = card.emails ?? [];
      form.address = card.address ?? { street: '', city: '', country: '', zip: '' };
      form.websites = card.websites ?? [];
      form.socialLinks = card.socialLinks ?? [];
      form.bgColor = card.bgColor ?? '#ffffff';
      form.primaryColor = card.primaryColor ?? '#0066cc';
      form.textColor = card.textColor ?? '#111111';
      form.fontFamily = card.fontFamily ?? '';
      form.avatarShape = card.avatarShape ?? 'CIRCLE';
      form.theme = card.theme ?? 'LIGHT';
      form.visibility = card.visibility;
      form.noIndex = card.noIndex;
      form.obfuscate = card.obfuscate;
      form.slug = card.slug;

      avatarUrl.value = card.avatarPath;
      bannerUrl.value = card.bannerPath;
      backgroundUrl.value = card.bgImagePath;

      takeSnapshot();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : t('errors.failedLoadCard');
    } finally {
      loading.value = false;
    }
  }

  function buildPayload() {
    const payload: Record<string, unknown> = { name: form.name };

    if (form.jobTitle) payload.jobTitle = form.jobTitle;
    if (form.company) payload.company = form.company;
    if (form.bio) payload.bio = form.bio;
    if (form.phones.length) payload.phones = form.phones;
    if (form.emails.length) payload.emails = form.emails;
    if (form.address.street || form.address.city || form.address.country || form.address.zip) {
      payload.address = form.address;
    }
    if (form.websites.length) payload.websites = form.websites;
    if (form.socialLinks.length) payload.socialLinks = form.socialLinks;
    if (form.bgColor) payload.bgColor = form.bgColor;
    if (form.primaryColor) payload.primaryColor = form.primaryColor;
    if (form.textColor) payload.textColor = form.textColor;
    if (form.fontFamily) payload.fontFamily = form.fontFamily;
    payload.avatarShape = form.avatarShape;
    payload.theme = form.theme;
    payload.visibility = form.visibility;
    payload.noIndex = form.noIndex;
    payload.obfuscate = form.obfuscate;
    if (isEditMode.value && form.slug) payload.slug = form.slug;

    return payload;
  }

  function setFieldErrors(apiFieldErrors: Record<string, string[]>) {
    const normalized: Record<string, string[]> = {};
    for (const [path, msgs] of Object.entries(apiFieldErrors)) {
      const key = normalizeFieldPath(path);
      if (!normalized[key]) normalized[key] = [];
      normalized[key].push(...msgs.map((m) => friendlyMessage(m, t)));
    }
    fieldErrors.value = normalized;
  }

  function getFieldError(field: string): string | null {
    const errors = fieldErrors.value[field];
    return errors && errors.length > 0 ? (errors[0] ?? null) : null;
  }

  function hasFieldError(field: string): boolean {
    return !!fieldErrors.value[field]?.length;
  }

  async function saveCard(): Promise<string | null> {
    saving.value = true;
    error.value = null;
    fieldErrors.value = {};
    try {
      if (isEditMode.value) {
        await api.put<Card>(`/api/cards/${cardId}`, buildPayload());
        takeSnapshot();
        return cardId!;
      } else {
        const card = await api.post<Card>('/api/cards', buildPayload());
        takeSnapshot();
        return card.id;
      }
    } catch (e: unknown) {
      if (e instanceof ApiError && e.hasFieldErrors) {
        setFieldErrors(e.fieldErrors);
        error.value = t('errors.fixValidation');
      } else {
        error.value = e instanceof Error ? e.message : t('errors.failedSaveCard');
      }
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function uploadImage(
    cardIdForUpload: string,
    type: 'avatar' | 'banner' | 'background',
    file: File,
  ): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    const result = await api.upload<{ path: string }>(
      `/api/cards/${cardIdForUpload}/upload/${type}`,
      formData,
    );
    if (type === 'avatar') avatarUrl.value = result.path;
    else if (type === 'banner') bannerUrl.value = result.path;
    else backgroundUrl.value = result.path;
    return result.path;
  }

  async function deleteImage(
    cardIdForDelete: string,
    type: 'avatar' | 'banner' | 'background',
  ): Promise<void> {
    await api.del(`/api/cards/${cardIdForDelete}/${type}`);
    if (type === 'avatar') avatarUrl.value = null;
    else if (type === 'banner') bannerUrl.value = null;
    else backgroundUrl.value = null;
  }

  function resetStyles() {
    const defaults = THEME_DEFAULTS[form.theme as keyof typeof THEME_DEFAULTS] ?? THEME_DEFAULTS.LIGHT;
    form.bgColor = defaults.bgColor;
    form.primaryColor = '#0066cc';
    form.textColor = defaults.textColor;
    form.fontFamily = '';
    form.avatarShape = 'CIRCLE';
  }

  // Phone helpers
  function addPhone() { form.phones.push({ number: '', label: '' }); }
  function removePhone(index: number) { form.phones.splice(index, 1); }

  // Email helpers
  function addEmail() { form.emails.push({ email: '', label: '' }); }
  function removeEmail(index: number) { form.emails.splice(index, 1); }

  // Website helpers
  function addWebsite() { form.websites.push({ url: '', label: '' }); }
  function removeWebsite(index: number) { form.websites.splice(index, 1); }

  // Social link helpers
  function addSocialLink() { form.socialLinks.push({ platform: 'linkedin', url: '' }); }
  function removeSocialLink(index: number) { form.socialLinks.splice(index, 1); }

  return {
    form,
    loading,
    saving,
    error,
    fieldErrors,
    getFieldError,
    hasFieldError,
    isDirty,
    isEditMode,
    avatarUrl,
    bannerUrl,
    backgroundUrl,
    loadCard,
    saveCard,
    uploadImage,
    deleteImage,
    addPhone,
    removePhone,
    addEmail,
    removeEmail,
    addWebsite,
    removeWebsite,
    addSocialLink,
    removeSocialLink,
    resetStyles,
  };
}
