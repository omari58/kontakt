import { storeToRefs } from 'pinia';
import { useSignaturesStore } from '@/stores/signatures';

export function useSignatures() {
  const store = useSignaturesStore();
  const { signatures, loading, error } = storeToRefs(store);

  return {
    signatures,
    loading,
    error,
    fetchMySignatures: store.fetchMySignatures,
    deleteSignature: store.deleteSignature,
  };
}
