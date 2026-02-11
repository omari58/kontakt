import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Signature } from '@/types';
import { useApi } from '@/composables/useApi';
import i18n from '@/i18n';

export const useSignaturesStore = defineStore('signatures', () => {
  const signatures = ref<Signature[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = useApi();

  async function fetchMySignatures(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      signatures.value = await api.get<Signature[]>('/api/me/signatures');
    } catch (e) {
      error.value = e instanceof Error ? e.message : i18n.global.t('errors.failedLoadSignatures');
    } finally {
      loading.value = false;
    }
  }

  async function deleteSignature(id: string): Promise<void> {
    await api.del(`/api/me/signatures/${id}`);
    signatures.value = signatures.value.filter((s) => s.id !== id);
  }

  return {
    signatures,
    loading,
    error,
    fetchMySignatures,
    deleteSignature,
  };
});
