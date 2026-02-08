<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { user, logout } = useAuth();
const open = ref(false);

function toggle() {
  open.value = !open.value;
}

function handleLogout() {
  open.value = false;
  logout();
}
</script>

<template>
  <div class="user-menu">
    <button class="user-menu__trigger" @click="toggle">
      {{ user?.name?.charAt(0)?.toUpperCase() || '?' }}
    </button>
    <div v-if="open" class="user-menu__dropdown">
      <div class="user-menu__info">
        <p class="user-menu__name">{{ user?.name }}</p>
        <p class="user-menu__email">{{ user?.email }}</p>
      </div>
      <hr class="user-menu__divider" />
      <button class="user-menu__logout" @click="handleLogout">
        Log out
      </button>
    </div>
    <div v-if="open" class="user-menu__backdrop" @click="open = false" />
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu__trigger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e0e0e0;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-menu__trigger:hover {
  background: #d0d0d0;
}

.user-menu__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 50;
}

.user-menu__info {
  padding: 0.75rem 1rem;
}

.user-menu__name {
  font-weight: 600;
  font-size: 0.875rem;
}

.user-menu__email {
  font-size: 0.75rem;
  color: #666;
}

.user-menu__divider {
  border: none;
  border-top: 1px solid #e0e0e0;
}

.user-menu__logout {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  cursor: pointer;
  color: #d32f2f;
}

.user-menu__logout:hover {
  background: #fce4ec;
}

.user-menu__backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}
</style>
