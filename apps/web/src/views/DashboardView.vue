<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCards } from '@/composables/useCards';
import { Plus, CreditCard } from 'lucide-vue-next';
import CardListItem from '@/components/CardListItem.vue';

const router = useRouter();
const { cards, loading, fetchMyCards, deleteCard } = useCards();

const pendingDeleteId = ref<string | null>(null);

onMounted(() => {
  fetchMyCards();
});

function createCard() {
  router.push({ name: 'card-new' });
}

function editCard(id: string) {
  router.push({ name: 'card-edit', params: { id } });
}

function confirmDelete(id: string) {
  pendingDeleteId.value = id;
}

function cancelDelete() {
  pendingDeleteId.value = null;
}

async function executeDelete() {
  if (!pendingDeleteId.value) return;
  await deleteCard(pendingDeleteId.value);
  pendingDeleteId.value = null;
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">My Cards</h1>
        <p class="dashboard__subtitle">Manage and share your digital business cards</p>
      </div>
      <button class="dashboard__create-btn" @click="createCard">
        <Plus :size="16" />
        Create New Card
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="dashboard__grid">
      <div v-for="n in 3" :key="n" class="dashboard__skeleton">
        <div class="dashboard__skeleton-avatar" />
        <div class="dashboard__skeleton-lines">
          <div class="dashboard__skeleton-line dashboard__skeleton-line--wide" />
          <div class="dashboard__skeleton-line" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="cards.length === 0" class="dashboard__empty">
      <CreditCard :size="56" class="dashboard__empty-icon" />
      <h2 class="dashboard__empty-heading">No cards yet</h2>
      <p class="dashboard__empty-text">Create your first digital business card to get started.</p>
      <button class="dashboard__create-btn" @click="createCard">
        <Plus :size="16" />
        Create Your First Card
      </button>
    </div>

    <!-- Card grid -->
    <div v-else class="dashboard__grid">
      <CardListItem
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @edit="editCard"
        @delete="confirmDelete"
      />
    </div>

    <!-- Delete confirmation dialog -->
    <Transition name="modal">
      <div v-if="pendingDeleteId" class="dashboard__overlay" @click.self="cancelDelete">
        <div class="dashboard__dialog">
          <h2 class="dashboard__dialog-title">Delete Card</h2>
          <p class="dashboard__dialog-text">Are you sure you want to delete this card? This action cannot be undone.</p>
          <div class="dashboard__dialog-actions">
            <button class="dashboard__dialog-btn dashboard__dialog-btn--ghost" @click="cancelDelete">Cancel</button>
            <button class="dashboard__dialog-btn dashboard__dialog-btn--danger" @click="executeDelete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.dashboard__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  line-height: var(--leading-tight);
}

.dashboard__subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

.dashboard__create-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  background: var(--color-primary-600);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
  white-space: nowrap;
}

.dashboard__create-btn:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-sm);
}

.dashboard__create-btn:active {
  transform: scale(0.97);
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 280px));
  gap: var(--space-4);
}

/* Skeleton loading */
.dashboard__skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.dashboard__skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-bg-muted);
  animation: shimmer 1.5s ease-in-out infinite;
}

.dashboard__skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dashboard__skeleton-line {
  height: 12px;
  width: 60%;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s ease-in-out infinite;
}

.dashboard__skeleton-line--wide {
  width: 80%;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Empty state */
.dashboard__empty {
  text-align: center;
  padding: var(--space-16) var(--space-4);
}

.dashboard__empty-icon {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.dashboard__empty-heading {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.dashboard__empty-text {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  font-size: var(--text-base);
}

/* Delete dialog */
.dashboard__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.dashboard__dialog {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-xl);
}

.dashboard__dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-2);
  color: var(--color-text);
}

.dashboard__dialog-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.dashboard__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.dashboard__dialog-btn--ghost {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  transition: background var(--duration-fast) var(--ease-default);
}

.dashboard__dialog-btn--ghost:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.dashboard__dialog-btn--danger {
  padding: var(--space-2) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-error-500);
  color: #fff;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: background var(--duration-fast) var(--ease-default);
}

.dashboard__dialog-btn--danger:hover {
  background: var(--color-error-700);
}

/* Modal transition */
.modal-enter-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.modal-enter-active .dashboard__dialog {
  transition: transform var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}
.modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .dashboard__dialog {
  opacity: 0;
  transform: scale(0.95);
}
.modal-leave-to {
  opacity: 0;
}
</style>
