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
      <UserMenu />
    </header>

    <!-- Sidebar (desktop) -->
    <aside class="shell__sidebar">
      <div class="shell__sidebar-brand">Kontakt</div>
      <AppNav />
      <div class="shell__sidebar-bottom">
        <UserMenu />
      </div>
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
/* ============ Base layout ============ */
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ============ Mobile header ============ */
.shell__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 30;
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

/* ============ Sidebar (hidden on mobile) ============ */
.shell__sidebar {
  display: none;
}

.shell__sidebar-brand {
  font-size: 1.125rem;
  font-weight: 700;
  padding: 0 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0.75rem;
}

.shell__sidebar-bottom {
  margin-top: auto;
  padding: 0.75rem;
  border-top: 1px solid #e0e0e0;
}

/* ============ Mobile overlay ============ */
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

/* ============ Main content ============ */
.shell__main {
  flex: 1;
  min-width: 0;
}

/* ============ Loading state ============ */
.shell__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #666;
}

/* ============ Desktop layout (>= 768px) ============ */
@media (min-width: 768px) {
  .shell {
    flex-direction: row;
  }

  .shell__header {
    display: none;
  }

  .shell__sidebar {
    display: flex;
    flex-direction: column;
    width: 220px;
    background: #fafafa;
    border-right: 1px solid #e0e0e0;
    padding: 1rem 0.5rem;
    flex-shrink: 0;
    min-height: 100vh;
    position: sticky;
    top: 0;
    align-self: flex-start;
  }
}
</style>
