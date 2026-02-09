<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'
import { Globe } from 'lucide-vue-next'

const { locale } = useI18n()

const localeLabels: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
}

function setLocale(newLocale: SupportedLocale) {
  locale.value = newLocale
  localStorage.setItem('kontakt-locale', newLocale)
  document.documentElement.lang = newLocale
}
</script>

<template>
  <div class="locale-switcher">
    <Globe :size="14" class="locale-switcher__icon" />
    <select
      :value="locale"
      class="locale-switcher__select"
      @change="setLocale(($event.target as HTMLSelectElement).value as SupportedLocale)"
    >
      <option
        v-for="loc in SUPPORTED_LOCALES"
        :key="loc"
        :value="loc"
      >
        {{ localeLabels[loc] }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.locale-switcher {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
}

.locale-switcher__icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.locale-switcher__select {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-1) 0;
}

.locale-switcher__select:focus {
  outline: none;
}
</style>
