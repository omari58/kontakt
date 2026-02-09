import { storeToRefs } from 'pinia';
import { useCardsStore } from '@/stores/cards';

export function useCards() {
  const store = useCardsStore();
  const { cards, loading, error } = storeToRefs(store);

  return {
    cards,
    loading,
    error,
    fetchMyCards: store.fetchMyCards,
    deleteCard: store.deleteCard,
  };
}
