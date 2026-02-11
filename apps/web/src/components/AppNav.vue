<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { FileSignature, CreditCard, Settings } from 'lucide-vue-next';

const { isAdmin } = useAuth();

defineEmits<{
  navigate: [];
}>();
</script>

<template>
  <nav class="app-nav">
    <router-link to="/" class="app-nav__link" @click="$emit('navigate')">
      <CreditCard :size="16" class="app-nav__icon" />
      {{ $t('nav.dashboard') }}
    </router-link>
    <router-link to="/signatures" class="app-nav__link" @click="$emit('navigate')">
      <FileSignature :size="16" class="app-nav__icon" />
      {{ $t('nav.signatures') }}
    </router-link>
    <template v-if="isAdmin">
      <router-link to="/admin/cards" class="app-nav__link" @click="$emit('navigate')">
        <CreditCard :size="16" class="app-nav__icon" />
        {{ $t('nav.allCards') }}
      </router-link>
      <router-link to="/admin/settings" class="app-nav__link" @click="$emit('navigate')">
        <Settings :size="16" class="app-nav__icon" />
        {{ $t('nav.settings') }}
      </router-link>
    </template>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-nav__link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  transition: color var(--duration-fast) var(--ease-default);
}

.app-nav__link:hover {
  color: var(--color-text);
}

.app-nav__link.router-link-exact-active {
  background: var(--color-bg-muted);
  color: var(--color-text);
  font-weight: var(--font-semibold);
}

.app-nav__icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.app-nav__link.router-link-exact-active .app-nav__icon {
  opacity: 1;
}
</style>
