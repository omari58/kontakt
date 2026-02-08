<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import AppNav from './AppNav.vue';
import UserMenu from './UserMenu.vue';
import AppToast from './AppToast.vue';

const { isAuthenticated } = useAuth();
const mobileMenuOpen = ref(false);

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}
</script>

<template>
  <div v-if="isAuthenticated" class="shell">
    <!-- Mobile header -->
    <header class="shell__header">
      <button class="shell__hamburger" @click="mobileMenuOpen = !mobileMenuOpen">
        <span class="shell__hamburger-line" />
        <span class="shell__hamburger-line" />
        <span class="shell__hamburger-line" />
      </button>
      <span class="shell__brand">Kontakt</span>
    </header>

    <UserMenu />

    <!-- Sidebar (desktop) -->
    <aside class="shell__sidebar">
      <div class="shell__sidebar-brand">Kontakt</div>
      <AppNav />
    </aside>

    <!-- Mobile menu overlay -->
    <div v-if="mobileMenuOpen" class="shell__mobile-overlay" @click="closeMobileMenu">
      <div class="shell__mobile-menu" @click.stop>
        <AppNav @navigate="closeMobileMenu" />
      </div>
    </div>

    <!-- Main content -->
    <main class="shell__main">
      <slot />
    </main>

    <AppToast />
  </div>
  <div v-else class="shell__loading">
    <p>Loading...</p>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* Sidebar - desktop only */
.shell__sidebar {
  width: 220px;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  padding: 1rem 0.5rem;
  flex-shrink: 0;
  display: none;
}

.shell__sidebar-brand {
  font-size: 1.125rem;
  font-weight: 700;
  padding: 0 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .shell__sidebar {
    display: block;
  }
  .shell__header {
    display: none;
  }
  .shell__main {
    /* Position user menu in top-right on desktop */
  }
}

/* Mobile header */
.shell__header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  z-index: 30;
  width: 100%;
}

.shell__hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.shell__hamburger-line {
  width: 20px;
  height: 2px;
  background: #333;
  border-radius: 1px;
}

.shell__brand {
  font-weight: 700;
  font-size: 1rem;
  flex: 1;
}

/* Mobile overlay */
.shell__mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

.shell__mobile-menu {
  width: 250px;
  height: 100%;
  background: #fff;
  padding: 1rem 0.5rem;
}

/* Main content */
.shell__main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 767px) {
  .shell {
    flex-direction: column;
  }
  .shell :deep(.user-menu) {
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    z-index: 31;
  }
}

@media (min-width: 768px) {
  .shell__main {
    position: relative;
  }

  /* Desktop user menu positioning handled by a wrapper */
  .shell :deep(.user-menu) {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 30;
  }
}

/* Loading state */
.shell__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #666;
}
</style>
