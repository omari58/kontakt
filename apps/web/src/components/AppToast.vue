<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast--${toast.type}`]"
      @click="dismiss(toast.id)"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  top: auto;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 360px;
}

.toast {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  border-left: 3px solid;
  font-size: var(--text-base);
  cursor: pointer;
  animation: slide-in 0.2s ease-out;
}

.toast--success {
  border-left-color: var(--color-success-500);
  color: var(--color-success-700);
}

.toast--error {
  border-left-color: var(--color-error-500);
  color: var(--color-error-700);
}

.toast--info {
  border-left-color: var(--color-info-500);
  color: var(--color-info-700);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
