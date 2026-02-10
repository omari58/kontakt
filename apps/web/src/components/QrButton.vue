<script setup lang="ts">
import { QrCode } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

defineProps<{
  size?: number;
}>();

defineEmits<{
  click: [];
}>();

const { t } = useI18n();
</script>

<template>
  <button
    class="qr-btn"
    :title="t('qrModal.title')"
    @click="$emit('click')"
  >
    <QrCode :size="size ?? 14" />
  </button>
</template>

<style scoped>
.qr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

.qr-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.qr-btn:active {
  transform: scale(0.95);
}
</style>
