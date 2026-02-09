import { ref, computed, watchEffect } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kontakt-admin-theme';

const preference = ref<ThemePreference>(
  (localStorage.getItem(STORAGE_KEY) as ThemePreference) || 'system',
);

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const prefersDark = ref(mediaQuery.matches);

function handleMediaChange(e: MediaQueryListEvent) {
  prefersDark.value = e.matches;
}
mediaQuery.addEventListener('change', handleMediaChange);

const currentTheme = computed<'light' | 'dark'>(() => {
  if (preference.value === 'system') {
    return prefersDark.value ? 'dark' : 'light';
  }
  return preference.value;
});

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', currentTheme.value);
});

export function useTheme() {
  function setTheme(theme: ThemePreference) {
    preference.value = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }

  return { preference, currentTheme, setTheme };
}
