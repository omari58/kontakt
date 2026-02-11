import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loaded = ref(false);

  const isAuthenticated = computed(() => user.value !== null);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function fetchUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/me', { credentials: 'include' });
      if (!response.ok) {
        user.value = null;
        return null;
      }
      user.value = await response.json() as User;
      return user.value;
    } catch {
      user.value = null;
      return null;
    } finally {
      loaded.value = true;
    }
  }

  function login(): void {
    window.location.href = '/api/auth/login';
  }

  function logout(): void {
    user.value = null;
    window.location.href = '/api/auth/logout';
  }

  return {
    user,
    loaded,
    isAuthenticated,
    isAdmin,
    fetchUser,
    login,
    logout,
  };
});
