import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';
import i18n from '@/i18n';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Record<string, string | null>>({});
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const api = useApi();

  async function fetchSettings(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      settings.value = await api.get<Record<string, string | null>>('/api/settings');
    } catch (e) {
      error.value = e instanceof Error ? e.message : i18n.global.t('errors.failedLoadSettings');
    } finally {
      loading.value = false;
    }
  }

  async function saveSettings(changed: { key: string; value: string }[]): Promise<void> {
    if (changed.length === 0) return;
    saving.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      await api.put<void>('/api/settings', { settings: changed });
      for (const { key, value } of changed) {
        settings.value[key] = value;
      }
      successMessage.value = i18n.global.t('success.settingsSaved');
    } catch (e) {
      error.value = e instanceof Error ? e.message : i18n.global.t('errors.failedSaveSettings');
    } finally {
      saving.value = false;
    }
  }

  async function uploadFile(
    endpoint: 'logo' | 'favicon',
    file: File,
  ): Promise<string | null> {
    error.value = null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await api.upload<{ path: string }>(`/api/settings/${endpoint}`, formData);
      const settingKey = endpoint === 'logo' ? 'org_logo' : 'org_favicon';
      settings.value[settingKey] = result.path;
      return result.path;
    } catch (e) {
      error.value = e instanceof Error ? e.message : i18n.global.t('errors.uploadFailed');
      return null;
    }
  }

  function clearMessages(): void {
    error.value = null;
    successMessage.value = null;
  }

  return {
    settings,
    loading,
    saving,
    error,
    successMessage,
    fetchSettings,
    saveSettings,
    uploadFile,
    clearMessages,
  };
});
