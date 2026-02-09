<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import type { ThemePreference } from '@/composables/useTheme';
import { Sun, Moon, Monitor } from 'lucide-vue-next';

const { preference, setTheme } = useTheme();

const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
];
</script>

<template>
  <div class="theme-toggle">
    <button
      v-for="t in themes"
      :key="t.value"
      class="theme-toggle__btn"
      :class="{ 'theme-toggle__btn--active': preference === t.value }"
      :title="`${t.label} mode`"
      @click="setTheme(t.value)"
    >
      <component :is="t.icon" :size="14" />
      <span class="theme-toggle__label">{{ t.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  padding: 3px;
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
}

.theme-toggle__btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: 5px 0;
  border: none;
  border-radius: calc(var(--radius-lg) - 2px);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-muted);
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
}

.theme-toggle__btn:hover {
  color: var(--color-text-secondary);
}

.theme-toggle__btn--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
}

.theme-toggle__label {
  display: none;
}

@media (min-width: 768px) {
  .theme-toggle__label {
    display: inline;
  }
}
</style>
