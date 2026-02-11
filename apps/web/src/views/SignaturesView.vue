<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSignatures } from '@/composables/useSignatures';
import { useCards } from '@/composables/useCards';
import { useToast } from '@/composables/useToast';
import { Plus, FileSignature, CreditCard } from 'lucide-vue-next';
import SignatureCard from '@/components/signatures/SignatureCard.vue';

const router = useRouter();
const { t } = useI18n();
const { signatures, loading: sigLoading, fetchMySignatures, deleteSignature } = useSignatures();
const { cards, loading: cardsLoading, fetchMyCards } = useCards();
const toast = useToast();

const pendingDeleteId = ref<string | null>(null);

onMounted(() => {
  fetchMySignatures();
  fetchMyCards();
});

function createSignature() {
  router.push({ name: 'signature-new' });
}

function editSignature(id: string) {
  router.push({ name: 'signature-edit', params: { id } });
}

function confirmDelete(id: string) {
  pendingDeleteId.value = id;
}

function cancelDelete() {
  pendingDeleteId.value = null;
}

async function executeDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await deleteSignature(pendingDeleteId.value);
    toast.show(t('success.signatureDeleted'), 'success');
  } catch {
    toast.show(t('errors.failedDelete', { type: 'signature' }), 'error');
  }
  pendingDeleteId.value = null;
}
</script>

<template>
  <div class="signatures">
    <div class="signatures__header">
      <h1 class="signatures__title">{{ $t('signatures.title') }}</h1>
      <button
        v-if="cards.length > 0"
        class="signatures__create-btn"
        @click="createSignature"
      >
        <Plus :size="16" />
        {{ $t('signatures.createNew') }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="sigLoading || cardsLoading" class="signatures__grid">
      <div v-for="n in 3" :key="n" class="signatures__skeleton">
        <div class="signatures__skeleton-avatar" />
        <div class="signatures__skeleton-lines">
          <div class="signatures__skeleton-line signatures__skeleton-line--wide" />
          <div class="signatures__skeleton-line" />
        </div>
      </div>
    </div>

    <!-- No cards state -->
    <div v-else-if="cards.length === 0" class="signatures__empty">
      <CreditCard :size="56" class="signatures__empty-icon" />
      <h2 class="signatures__empty-heading">{{ $t('signatures.noCards.title') }}</h2>
      <p class="signatures__empty-text">{{ $t('signatures.noCards.description') }}</p>
      <button class="signatures__create-btn" @click="router.push({ name: 'card-new' })">
        <Plus :size="16" />
        {{ $t('dashboard.createNew') }}
      </button>
    </div>

    <!-- Empty signatures state -->
    <div v-else-if="signatures.length === 0" class="signatures__empty">
      <FileSignature :size="56" class="signatures__empty-icon" />
      <h2 class="signatures__empty-heading">{{ $t('signatures.empty.title') }}</h2>
      <p class="signatures__empty-text">{{ $t('signatures.empty.description') }}</p>
      <button class="signatures__create-btn" @click="createSignature">
        <Plus :size="16" />
        {{ $t('signatures.createNew') }}
      </button>
    </div>

    <!-- Signatures grid -->
    <div v-else class="signatures__grid">
      <SignatureCard
        v-for="sig in signatures"
        :key="sig.id"
        :signature="sig"
        @edit="editSignature"
        @delete="confirmDelete"
      />
    </div>

    <!-- Delete confirmation dialog -->
    <Transition name="modal">
      <div v-if="pendingDeleteId" class="signatures__overlay" @click.self="cancelDelete">
        <div class="signatures__dialog">
          <h2 class="signatures__dialog-title">{{ $t('signatures.delete.confirm') }}</h2>
          <p class="signatures__dialog-text">{{ $t('signatures.delete.message') }}</p>
          <div class="signatures__dialog-actions">
            <button class="signatures__dialog-btn signatures__dialog-btn--ghost" @click="cancelDelete">
              {{ $t('common.cancel') }}
            </button>
            <button class="signatures__dialog-btn signatures__dialog-btn--danger" @click="executeDelete">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.signatures {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.signatures__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.signatures__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  line-height: var(--leading-tight);
}

.signatures__create-btn {
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

.signatures__create-btn:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-sm);
}

.signatures__create-btn:active {
  transform: scale(0.97);
}

.signatures__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

/* Skeleton loading */
.signatures__skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.signatures__skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-bg-muted);
  animation: shimmer 1.5s ease-in-out infinite;
}

.signatures__skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.signatures__skeleton-line {
  height: 12px;
  width: 60%;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s ease-in-out infinite;
}

.signatures__skeleton-line--wide {
  width: 80%;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Empty state */
.signatures__empty {
  text-align: center;
  padding: var(--space-16) var(--space-4);
}

.signatures__empty-icon {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.signatures__empty-heading {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.signatures__empty-text {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  font-size: var(--text-base);
}

/* Delete dialog */
.signatures__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.signatures__dialog {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-xl);
}

.signatures__dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-2);
  color: var(--color-text);
}

.signatures__dialog-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.signatures__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.signatures__dialog-btn--ghost {
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

.signatures__dialog-btn--ghost:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.signatures__dialog-btn--danger {
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

.signatures__dialog-btn--danger:hover {
  background: var(--color-error-700);
}

/* Modal transition */
.modal-enter-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.modal-enter-active .signatures__dialog {
  transition: transform var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}
.modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .signatures__dialog {
  opacity: 0;
  transform: scale(0.95);
}
.modal-leave-to {
  opacity: 0;
}
</style>
