import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Card } from '@/types';
import { useApi } from '@/composables/useApi';

export const useCardsStore = defineStore('cards', () => {
  const cards = ref<Card[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = useApi();

  async function fetchMyCards(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      cards.value = await api.get<Card[]>('/api/me/cards');
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load cards';
    } finally {
      loading.value = false;
    }
  }

  async function deleteCard(id: string): Promise<void> {
    await api.del(`/api/cards/${id}`);
    cards.value = cards.value.filter((c) => c.id !== id);
  }

  return {
    cards,
    loading,
    error,
    fetchMyCards,
    deleteCard,
  };
});
