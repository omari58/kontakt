<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import AppNav from './AppNav.vue';
import UserMenu from './UserMenu.vue';
import AppToast from './AppToast.vue';
import ThemeToggle from './ThemeToggle.vue';
import LocaleSwitcher from './LocaleSwitcher.vue';

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
      <button
        class="shell__hamburger"
        :class="{ 'shell__hamburger--open': mobileMenuOpen }"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
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
        <ThemeToggle />
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </aside>

    <!-- Mobile menu overlay -->
    <Transition name="overlay">
      <div v-if="mobileMenuOpen" class="shell__mobile-overlay" @click="closeMobileMenu">
        <div class="shell__mobile-menu" @click.stop>
          <AppNav @navigate="closeMobileMenu" />
          <div class="shell__mobile-bottom">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main content -->
    <main class="shell__main">
      <slot />
    </main>

    <AppToast />
  </div>
  <div v-else class="shell__loading">
    <span class="shell__loading-brand">Kontakt</span>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ===== Mobile header ===== */
.shell__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
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
  width: 18px;
  height: 1.5px;
  background: var(--color-text-secondary);
  border-radius: 1px;
  transition: transform var(--duration-slow) var(--ease-default),
              opacity var(--duration-slow) var(--ease-default);
  transform-origin: center;
}

.shell__hamburger--open .shell__hamburger-line:nth-child(1) {
  transform: translateY(5.5px) rotate(45deg);
}

.shell__hamburger--open .shell__hamburger-line:nth-child(2) {
  opacity: 0;
}

.shell__hamburger--open .shell__hamburger-line:nth-child(3) {
  transform: translateY(-5.5px) rotate(-45deg);
}

.shell__brand {
  font-weight: var(--font-bold);
  font-size: var(--text-md);
  letter-spacing: -0.01em;
  flex: 1;
  color: var(--color-text);
}

/* ===== Sidebar (hidden on mobile) ===== */
.shell__sidebar {
  display: none;
}

.shell__sidebar-brand {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  letter-spacing: -0.02em;
  padding: 0 var(--space-4) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
  color: var(--color-text);
}

.shell__sidebar-bottom {
  margin-top: auto;
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.shell__mobile-bottom {
  margin-top: auto;
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
}

/* ===== Mobile overlay ===== */
.shell__mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: var(--z-overlay);
}

.shell__mobile-menu {
  width: 260px;
  height: 100%;
  background: var(--color-surface);
  padding: var(--space-4) var(--space-2);
  transform: translateX(0);
  transition: transform var(--duration-slow) var(--ease-out);
}

/* Overlay transitions */
.overlay-enter-active {
  transition: opacity var(--duration-slow) var(--ease-out);
}
.overlay-enter-active .shell__mobile-menu {
  transition: transform var(--duration-slow) var(--ease-out);
}
.overlay-leave-active {
  transition: opacity var(--duration-normal) var(--ease-default);
}
.overlay-leave-active .shell__mobile-menu {
  transition: transform var(--duration-normal) var(--ease-default);
}
.overlay-enter-from {
  opacity: 0;
}
.overlay-enter-from .shell__mobile-menu {
  transform: translateX(-100%);
}
.overlay-leave-to {
  opacity: 0;
}
.overlay-leave-to .shell__mobile-menu {
  transform: translateX(-100%);
}

/* ===== Main content ===== */
.shell__main {
  flex: 1;
  min-width: 0;
}

/* ===== Loading state ===== */
.shell__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.shell__loading-brand {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  letter-spacing: -0.02em;
  color: var(--color-text-muted);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ===== Desktop layout (>= 768px) ===== */
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
    width: 240px;
    background: var(--color-bg-subtle);
    box-shadow: 1px 0 0 0 var(--color-border);
    padding: var(--space-4) var(--space-2);
    flex-shrink: 0;
    min-height: 100vh;
    position: sticky;
    top: 0;
    align-self: flex-start;
  }
}
</style>
