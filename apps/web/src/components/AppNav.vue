<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';

const { isAdmin } = useAuth();

defineEmits<{
  navigate: [];
}>();
</script>

<template>
  <nav class="app-nav">
    <router-link to="/" class="app-nav__link" @click="$emit('navigate')">
      Dashboard
    </router-link>
    <template v-if="isAdmin">
      <router-link to="/admin/cards" class="app-nav__link" @click="$emit('navigate')">
        All Cards
      </router-link>
      <router-link to="/admin/settings" class="app-nav__link" @click="$emit('navigate')">
        Settings
      </router-link>
    </template>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.app-nav__link {
  display: block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #333;
  font-size: 0.875rem;
  border-radius: 6px;
}

.app-nav__link:hover {
  background: #f0f0f0;
}

.app-nav__link.router-link-exact-active {
  background: #e8e8e8;
  font-weight: 600;
}
</style>
