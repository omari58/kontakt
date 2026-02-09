import { reactive, ref, computed, watch } from 'vue';
import { useApi } from './useApi';
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
    theme: 'LIGHT',
    visibility: 'PUBLIC',
    noIndex: false,
    obfuscate: false,
    slug: '',
  };
}

export function useCardForm(cardId?: string) {
  const api = useApi();

  const form = reactive<CardFormData>(createEmptyForm());
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
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
  }, { deep: true });

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
      error.value = e instanceof Error ? e.message : 'Failed to load card';
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

  async function saveCard(): Promise<string | null> {
    saving.value = true;
    error.value = null;
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
      error.value = e instanceof Error ? e.message : 'Failed to save card';
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
    try {
      const response = await fetch(`/api/cards/${cardIdForUpload}/upload/${type}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to upload ${type}: ${response.status} ${text}`);
      }
      const result = await response.json() as { path: string };
      if (type === 'avatar') {
        avatarUrl.value = result.path;
      } else if (type === 'banner') {
        bannerUrl.value = result.path;
      } else {
        backgroundUrl.value = result.path;
      }
      return result.path;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : `Failed to upload ${type}`;
      return null;
    }
  }

  async function deleteImage(
    cardIdForDelete: string,
    type: 'avatar' | 'banner' | 'background',
  ): Promise<void> {
    try {
      await api.del(`/api/cards/${cardIdForDelete}/${type}`);
      if (type === 'avatar') avatarUrl.value = null;
      else if (type === 'banner') bannerUrl.value = null;
      else backgroundUrl.value = null;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : `Failed to delete ${type}`;
    }
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
  };
}
