<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  html: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="sig-preview">
    <label class="sig-preview__label">{{ t('signatures.editor.preview') }}</label>
    <div class="sig-preview__frame-wrap">
      <div class="sig-preview__content" v-html="html" />
    </div>
  </div>
</template>

<style scoped>
.sig-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sig-preview__label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
}

.sig-preview__frame-wrap {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
  overflow: hidden;
}

.sig-preview__content {
  padding: 16px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  color: #333333;
}
</style>
