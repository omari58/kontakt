<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
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
      <input
        v-model="search"
        type="text"
        placeholder="Search by name or company..."
        class="admin-cards__search"
        @input="onSearchInput"
      />
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
  padding: 2rem 1rem;
}

.admin-cards__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.admin-cards__toolbar {
  margin-bottom: 1rem;
}

.admin-cards__search {
  width: 100%;
  max-width: 400px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.admin-cards__search:focus {
  outline: none;
  border-color: #1a1a1a;
}

.admin-cards__loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.admin-cards__table {
  width: 100%;
  border-collapse: collapse;
}

.admin-cards__table th {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.admin-cards__table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.875rem;
}

.admin-cards__row {
  cursor: pointer;
}

.admin-cards__row:hover {
  background: #f8f8f8;
}

.admin-cards__slug {
  font-family: monospace;
  font-size: 0.8125rem;
  color: #666;
}

.admin-cards__badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.admin-cards__badge--public {
  background: #e8f5e9;
  color: #2e7d32;
}

.admin-cards__badge--unlisted {
  background: #fff3e0;
  color: #e65100;
}

.admin-cards__badge--disabled {
  background: #f5f5f5;
  color: #999;
}

.admin-cards__empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.admin-cards__pagination {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.admin-cards__page-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #fff;
  font-size: 0.8125rem;
  cursor: pointer;
}

.admin-cards__page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.admin-cards__page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-cards__page-btn--active {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
}

@media (max-width: 768px) {
  .admin-cards__table {
    display: block;
    overflow-x: auto;
  }
}
</style>
