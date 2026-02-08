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
  top: 1rem;
  right: 1rem;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 360px;
}

.toast {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  animation: slide-in 0.2s ease-out;
}

.toast--success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.toast--error {
  background: #fce4ec;
  color: #c62828;
  border: 1px solid #f8bbd0;
}

.toast--info {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
