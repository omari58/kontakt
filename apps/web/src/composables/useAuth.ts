import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const store = useAuthStore();
  const { user, isAuthenticated, isAdmin } = storeToRefs(store);

  return {
    user,
    isAuthenticated,
    isAdmin,
    login: store.login,
    logout: store.logout,
    fetchUser: store.fetchUser,
  };
}
