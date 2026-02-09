<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { LogOut } from 'lucide-vue-next';

const { user, logout } = useAuth();
</script>

<template>
  <div class="user-menu">
    <div class="user-menu__avatar">
      {{ user?.name?.charAt(0)?.toUpperCase() || '?' }}
    </div>
    <div class="user-menu__info">
      <p class="user-menu__name">{{ user?.name }}</p>
      <p class="user-menu__email">{{ user?.email }}</p>
    </div>
    <button class="user-menu__logout" title="Log out" @click="logout">
      <LogOut :size="14" />
    </button>
  </div>
</template>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-1);
}

.user-menu__avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  color: #fff;
  font-weight: var(--font-semibold);
  font-size: var(--text-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-menu__info {
  flex: 1;
  min-width: 0;
}

.user-menu__name {
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__email {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: color var(--duration-fast) var(--ease-default),
              background var(--duration-fast) var(--ease-default);
}

.user-menu__logout:hover {
  background: var(--color-error-50);
  color: var(--color-error-500);
}
</style>
