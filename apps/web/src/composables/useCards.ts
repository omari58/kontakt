import { storeToRefs } from 'pinia';
import { useCardsStore } from '@/stores/cards';

export function useCards() {
  const store = useCardsStore();
  const { cards, loading } = storeToRefs(store);

  return {
    cards,
    loading,
    fetchMyCards: store.fetchMyCards,
    deleteCard: store.deleteCard,
  };
}
