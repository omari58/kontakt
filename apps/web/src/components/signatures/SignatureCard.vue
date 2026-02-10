<script setup lang="ts">
import { computed } from 'vue';
import type { Signature } from '@/types';
import { Pencil, Trash2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  signature: Signature;
}>();

const emit = defineEmits<{
  edit: [id: string];
  delete: [id: string];
}>();

const { t } = useI18n();

const layoutLabel = computed(() => {
  const key = props.signature.layout.toLowerCase();
  return t(`signatures.editor.layouts.${key}`);
});
</script>

<template>
  <div class="signature-card">
    <div class="signature-card__body" @click="emit('edit', signature.id)">
      <img
        v-if="signature.card.avatarPath"
        :src="signature.card.avatarPath"
        :alt="signature.card.name"
        class="signature-card__avatar"
      />
      <div v-else class="signature-card__avatar signature-card__avatar--placeholder">
        {{ signature.card.name.charAt(0).toUpperCase() }}
      </div>
      <div class="signature-card__info">
        <h3 class="signature-card__name">{{ signature.name }}</h3>
        <p class="signature-card__meta">
          {{ layoutLabel }} &middot; {{ signature.card.name }}
        </p>
      </div>
    </div>
    <div class="signature-card__actions">
      <button
        class="signature-card__btn"
        :title="t('common.change')"
        @click="emit('edit', signature.id)"
      >
        <Pencil :size="14" />
      </button>
      <button
        class="signature-card__btn signature-card__btn--delete"
        :title="t('common.delete')"
        @click="emit('delete', signature.id)"
      >
        <Trash2 :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.signature-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  transition: box-shadow var(--duration-normal) var(--ease-default),
              border-color var(--duration-normal) var(--ease-default);
}

.signature-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}

.signature-card__body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.signature-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-card__avatar--placeholder {
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  color: #fff;
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}

.signature-card__info {
  min-width: 0;
}

.signature-card__name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signature-card__meta {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signature-card__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.signature-card__btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

.signature-card__btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.signature-card__btn:active {
  transform: scale(0.95);
}

.signature-card__btn--delete:hover {
  color: var(--color-error-500);
  background: var(--color-error-50);
}
</style>
