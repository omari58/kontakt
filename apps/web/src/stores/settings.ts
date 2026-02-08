import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

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
      error.value = e instanceof Error ? e.message : 'Failed to load settings';
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
      successMessage.value = 'Settings saved successfully';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save settings';
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
      const response = await fetch(`/api/settings/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => 'Upload failed');
        throw new Error(text);
      }
      const result = (await response.json()) as { path: string };
      const settingKey = endpoint === 'logo' ? 'org_logo' : 'org_favicon';
      settings.value[settingKey] = result.path;
      return result.path;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed';
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
