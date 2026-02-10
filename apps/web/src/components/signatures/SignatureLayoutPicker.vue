<script setup lang="ts">
import type { SignatureLayout } from '@/types';
import { useI18n } from 'vue-i18n';

defineProps<{
  modelValue: SignatureLayout;
}>();

const emit = defineEmits<{
  'update:modelValue': [layout: SignatureLayout];
}>();

const { t } = useI18n();

const layouts: { value: SignatureLayout; icon: string }[] = [
  { value: 'COMPACT', icon: '▪ ━━' },
  { value: 'CLASSIC', icon: '━━\n▪▪▪' },
  { value: 'MINIMAL', icon: '───' },
];
</script>

<template>
  <div class="layout-picker">
    <button
      v-for="layout in layouts"
      :key="layout.value"
      type="button"
      class="layout-picker__option"
      :class="{ 'layout-picker__option--active': modelValue === layout.value }"
      @click="emit('update:modelValue', layout.value)"
    >
      <span class="layout-picker__icon">{{ layout.icon }}</span>
      <span class="layout-picker__label">
        {{ t(`signatures.editor.layouts.${layout.value.toLowerCase()}`) }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.layout-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

@media (max-width: 480px) {
  .layout-picker {
    grid-template-columns: 1fr;
  }
}

.layout-picker__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
}

.layout-picker__option:hover {
  border-color: var(--color-border-hover);
}

.layout-picker__option--active {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 1px var(--color-primary-500);
}

.layout-picker__icon {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  white-space: pre;
  line-height: 1.3;
}

.layout-picker__option--active .layout-picker__icon {
  color: var(--color-primary-600);
}

.layout-picker__label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
}

.layout-picker__option--active .layout-picker__label {
  color: var(--color-primary-600);
}
</style>
