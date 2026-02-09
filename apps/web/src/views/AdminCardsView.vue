<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { Search } from 'lucide-vue-next';
import type { AdminCard, PaginatedResponse } from '@/types';

const router = useRouter();
const api = useApi();

const cards = ref<AdminCard[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const search = ref('');
const loading = ref(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

async function fetchCards() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: String(limit.value),
    });
    if (search.value) {
      params.set('search', search.value);
    }
    const result = await api.get<PaginatedResponse<AdminCard>>(
      `/api/admin/cards?${params}`,
    );
    cards.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    fetchCards();
  }, 300);
}

function goToPage(p: number) {
  page.value = p;
  fetchCards();
}

function editCard(id: string) {
  router.push({ name: 'card-edit', params: { id } });
}

const totalPages = ref(0);
watch([total, limit], () => {
  totalPages.value = Math.ceil(total.value / limit.value);
});

onMounted(() => {
  fetchCards();
});
</script>

<template>
  <div class="admin-cards">
    <h1 class="admin-cards__title">All Cards</h1>

    <div class="admin-cards__toolbar">
      <div class="admin-cards__search-wrap">
        <Search :size="16" class="admin-cards__search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or company..."
          class="admin-cards__search"
          @input="onSearchInput"
        />
      </div>
    </div>

    <div v-if="loading" class="admin-cards__loading">Loading...</div>

    <table v-else class="admin-cards__table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Owner</th>
          <th>Company</th>
          <th>Slug</th>
          <th>Visibility</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="card in cards"
          :key="card.id"
          class="admin-cards__row"
          @click="editCard(card.id)"
        >
          <td>{{ card.name }}</td>
          <td>{{ card.user.name }}</td>
          <td>{{ card.company || '-' }}</td>
          <td class="admin-cards__slug">/c/{{ card.slug }}</td>
          <td>
            <span :class="['admin-cards__badge', `admin-cards__badge--${card.visibility.toLowerCase()}`]">
              {{ card.visibility }}
            </span>
          </td>
          <td>{{ new Date(card.createdAt).toLocaleDateString() }}</td>
        </tr>
        <tr v-if="cards.length === 0">
          <td colspan="6" class="admin-cards__empty">No cards found.</td>
        </tr>
      </tbody>
    </table>

    <div v-if="totalPages > 1" class="admin-cards__pagination">
      <button
        class="admin-cards__page-btn"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        Previous
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['admin-cards__page-btn', { 'admin-cards__page-btn--active': p === page }]"
        @click="goToPage(p)"
      >
        {{ p }}
      </button>
      <button
        class="admin-cards__page-btn"
        :disabled="page >= totalPages"
        @click="goToPage(page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
.admin-cards {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.admin-cards__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

.admin-cards__toolbar {
  margin-bottom: var(--space-4);
}

.admin-cards__search-wrap {
  position: relative;
  max-width: 400px;
}

.admin-cards__search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.admin-cards__search {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  padding-left: 2.25rem;
  background: var(--color-bg-subtle);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
}

.admin-cards__search:focus {
  outline: none;
  border-color: var(--color-border);
  background: var(--color-surface);
}

.admin-cards__loading {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}

.admin-cards__table {
  width: 100%;
  border-collapse: collapse;
}

.admin-cards__table th {
  text-align: left;
  padding: var(--space-3);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: var(--font-semibold);
  border-bottom: 1px solid var(--color-border);
}

.admin-cards__table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-base);
}

.admin-cards__row {
  cursor: pointer;
}

.admin-cards__row:hover {
  background: var(--color-bg-subtle);
}

.admin-cards__slug {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.admin-cards__badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.admin-cards__badge--public {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.admin-cards__badge--unlisted {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.admin-cards__badge--disabled {
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
}

.admin-cards__empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}

.admin-cards__pagination {
  display: flex;
  gap: var(--space-1);
  justify-content: center;
  margin-top: var(--space-6);
}

.admin-cards__page-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  cursor: pointer;
}

.admin-cards__page-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
}

.admin-cards__page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-cards__page-btn--active {
  background: var(--color-text);
  color: var(--color-bg);
  border-color: var(--color-text);
}

@media (max-width: 768px) {
  .admin-cards__table {
    display: block;
    overflow-x: auto;
  }
}
</style>
