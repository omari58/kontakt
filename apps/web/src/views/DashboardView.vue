<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCards } from '@/composables/useCards';
import CardListItem from '@/components/CardListItem.vue';

const router = useRouter();
const { cards, loading, fetchMyCards, deleteCard } = useCards();

const pendingDeleteId = ref<string | null>(null);

onMounted(() => {
  fetchMyCards();
});

function createCard() {
  router.push({ name: 'card-edit', params: { id: 'new' } });
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
      <h1 class="dashboard__title">My Cards</h1>
      <button class="dashboard__create-btn" @click="createCard">
        + Create New Card
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
      <p class="dashboard__empty-text">You don't have any cards yet.</p>
      <button class="dashboard__create-btn" @click="createCard">
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
    <div v-if="pendingDeleteId" class="dashboard__overlay" @click.self="cancelDelete">
      <div class="dashboard__dialog">
        <h2 class="dashboard__dialog-title">Delete Card</h2>
        <p>Are you sure you want to delete this card? This action cannot be undone.</p>
        <div class="dashboard__dialog-actions">
          <button class="dashboard__dialog-btn" @click="cancelDelete">Cancel</button>
          <button class="dashboard__dialog-btn dashboard__dialog-btn--danger" @click="executeDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard__title {
  font-size: 1.5rem;
  font-weight: 700;
}

.dashboard__create-btn {
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.dashboard__create-btn:hover {
  background: #333;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .dashboard__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .dashboard__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Skeleton loading */
.dashboard__skeleton {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.dashboard__skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e0e0e0;
  animation: pulse 1.5s ease-in-out infinite;
}

.dashboard__skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dashboard__skeleton-line {
  height: 12px;
  width: 60%;
  background: #e0e0e0;
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

.dashboard__skeleton-line--wide {
  width: 80%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Empty state */
.dashboard__empty {
  text-align: center;
  padding: 4rem 1rem;
}

.dashboard__empty-text {
  color: #666;
  margin-bottom: 1rem;
}

/* Delete dialog */
.dashboard__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dashboard__dialog {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}

.dashboard__dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.dashboard__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.dashboard__dialog-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}

.dashboard__dialog-btn:hover {
  background: #f5f5f5;
}

.dashboard__dialog-btn--danger {
  background: #d32f2f;
  color: #fff;
  border-color: #d32f2f;
}

.dashboard__dialog-btn--danger:hover {
  background: #b71c1c;
}
</style>
