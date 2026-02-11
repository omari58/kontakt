<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, Loader2, Copy, Check } from 'lucide-vue-next';
import { useApi, ApiError } from '@/composables/useApi';
import { useCards } from '@/composables/useCards';
import { useSignatureHtml } from '@/composables/useSignatureHtml';
import { useToast } from '@/composables/useToast';
import SignatureLayoutPicker from '@/components/signatures/SignatureLayoutPicker.vue';
import SignatureFieldToggles from '@/components/signatures/SignatureFieldToggles.vue';
import SignaturePreview from '@/components/signatures/SignaturePreview.vue';
import type { Card, Signature, SignatureLayout, SignatureConfig, SignatureFieldToggles as FieldTogglesType, SignatureAvatarShape } from '@/types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const { show: showToast } = useToast();
const { cards, fetchMyCards } = useCards();

const sigId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => !!sigId.value);

const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const copied = ref(false);
const showFallback = ref(false);

// Form state
const name = ref('');
const selectedCardId = ref<string | null>(null);
const layout = ref<SignatureLayout>('CLASSIC');
const fields = ref<FieldTogglesType>({
  avatar: true,
  phone: true,
  email: true,
  website: true,
  socials: true,
  pronouns: true,
  calendar: true,
  disclaimer: true,
  cardLink: true,
});
const disclaimer = ref('');
const accentColor = ref('#2563eb');
const contactColumns = ref<1 | 2>(1);
const cardLinkText = ref('');
const avatarShape = ref<SignatureAvatarShape>('rounded-square');
const selectedPhones = ref<number[]>([]);
const selectedEmails = ref<number[]>([]);
const selectedWebsites = ref<number[]>([]);

// Derived
const selectedCard = computed<Card | null>(() =>
  cards.value.find((c) => c.id === selectedCardId.value) ?? null,
);

const pageTitle = computed(() =>
  isEditMode.value ? t('signatures.editor.title') : t('signatures.editor.newTitle'),
);

const canSave = computed(() => !!name.value.trim() && !!selectedCardId.value);

// Build a Card ref and config ref for useSignatureHtml
const previewCard = computed<Card>(() => {
  if (selectedCard.value) return selectedCard.value;
  // Return a minimal stub so useSignatureHtml doesn't break
  return {
    id: '', slug: '', userId: '', name: '', jobTitle: null, company: null,
    phones: null, emails: null, address: null, websites: null, socialLinks: null,
    bio: null, pronouns: null, calendarUrl: null, avatarPath: null, bannerPath: null,
    bgImagePath: null, bgColor: null, primaryColor: null, textColor: null,
    fontFamily: null, avatarShape: null, theme: null, visibility: 'PUBLIC',
    noIndex: false, obfuscate: false, createdAt: '', updatedAt: '',
  };
});

const previewConfig = computed<SignatureConfig>(() => ({
  fields: fields.value,
  disclaimer: disclaimer.value,
  accentColor: accentColor.value,
  contactColumns: contactColumns.value,
  cardLinkText: cardLinkText.value,
  avatarShape: avatarShape.value,
  selectedPhones: selectedPhones.value,
  selectedEmails: selectedEmails.value,
  selectedWebsites: selectedWebsites.value,
}));

const { html: signatureHtml } = useSignatureHtml(previewCard, previewConfig, layout);

// Set accent color and default selections when card changes
watch(selectedCard, (card) => {
  if (!card) return;
  if (!isEditMode.value) {
    if (card.primaryColor) accentColor.value = card.primaryColor;
    selectedPhones.value = card.phones?.map((_, i) => i) ?? [];
    selectedEmails.value = card.emails?.map((_, i) => i) ?? [];
    selectedWebsites.value = card.websites?.map((_, i) => i) ?? [];
  }
});

async function loadSignature() {
  if (!sigId.value) return;
  loading.value = true;
  error.value = null;
  try {
    const sig = await api.get<Signature>(`/api/me/signatures/${sigId.value}`);
    name.value = sig.name;
    selectedCardId.value = sig.cardId;
    layout.value = sig.layout;
    fields.value = { ...sig.config.fields };
    disclaimer.value = sig.config.disclaimer;
    accentColor.value = sig.config.accentColor;
    contactColumns.value = sig.config.contactColumns ?? 1;
    cardLinkText.value = sig.config.cardLinkText ?? '';
    avatarShape.value = sig.config.avatarShape ?? 'rounded-square';
    selectedPhones.value = sig.config.selectedPhones ?? [];
    selectedEmails.value = sig.config.selectedEmails ?? [];
    selectedWebsites.value = sig.config.selectedWebsites ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('errors.requestFailed');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!canSave.value) return;
  saving.value = true;
  error.value = null;

  const config = {
    fields: fields.value,
    disclaimer: disclaimer.value,
    accentColor: accentColor.value,
    contactColumns: contactColumns.value,
    cardLinkText: cardLinkText.value,
    avatarShape: avatarShape.value,
    selectedPhones: selectedPhones.value,
    selectedEmails: selectedEmails.value,
    selectedWebsites: selectedWebsites.value,
  };

  try {
    if (isEditMode.value) {
      await api.patch(`/api/me/signatures/${sigId.value}`, {
        name: name.value.trim(),
        layout: layout.value,
        config,
      });
      showToast(t('success.signatureSaved'), 'success');
    } else {
      const created = await api.post<Signature>('/api/me/signatures', {
        name: name.value.trim(),
        cardId: selectedCardId.value,
        layout: layout.value,
        config,
      });
      showToast(t('success.signatureSaved'), 'success');
      router.push({ name: 'signature-edit', params: { id: created.id } });
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('errors.requestFailed');
  } finally {
    saving.value = false;
  }
}

async function copyToClipboard() {
  const htmlContent = signatureHtml.value;
  try {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': blob }),
    ]);
    copied.value = true;
    showToast(t('signatures.editor.copied'), 'success');
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    showFallback.value = true;
  }
}

onMounted(async () => {
  await fetchMyCards();
  if (isEditMode.value) {
    await loadSignature();
  }
});
</script>

<template>
  <div class="sig-editor">
    <button class="sig-editor__back-btn" @click="router.push({ name: 'signatures' })">
      <ArrowLeft :size="16" />
      {{ t('common.back') }}
    </button>

    <div class="sig-editor__header">
      <h1 class="sig-editor__title">{{ pageTitle }}</h1>
      <button
        class="sig-editor__save-btn"
        :disabled="saving || !canSave"
        @click="handleSave"
      >
        <Loader2 v-if="saving" :size="14" class="sig-editor__spinner" />
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </div>

    <div v-if="error" class="sig-editor__error">{{ error }}</div>

    <div v-if="loading" class="sig-editor__loading">{{ t('common.loading') }}</div>

    <div v-else class="sig-editor__layout">
      <!-- Form column -->
      <div class="sig-editor__form">
        <!-- Name -->
        <div class="sig-editor__field">
          <label class="sig-editor__label" for="sig-name">{{ t('signatures.editor.name') }}</label>
          <input
            id="sig-name"
            v-model="name"
            type="text"
            class="sig-editor__input"
            :placeholder="t('signatures.editor.namePlaceholder')"
            required
          />
        </div>

        <!-- Card picker -->
        <div class="sig-editor__field">
          <label class="sig-editor__label" for="sig-card">{{ t('signatures.editor.selectCard') }}</label>
          <select
            id="sig-card"
            v-model="selectedCardId"
            class="sig-editor__select"
            :disabled="isEditMode"
          >
            <option :value="null" disabled>{{ t('signatures.editor.selectCard') }}</option>
            <option v-for="card in cards" :key="card.id" :value="card.id">
              {{ card.name }}
            </option>
          </select>
        </div>

        <!-- Layout -->
        <div class="sig-editor__field">
          <label class="sig-editor__label">{{ t('signatures.editor.layout') }}</label>
          <SignatureLayoutPicker v-model="layout" />
        </div>

        <!-- Field toggles -->
        <div v-if="selectedCard" class="sig-editor__field">
          <SignatureFieldToggles
            v-model="fields"
            :card="selectedCard"
            v-model:selected-phones="selectedPhones"
            v-model:selected-emails="selectedEmails"
            v-model:selected-websites="selectedWebsites"
          />
        </div>

        <!-- Avatar shape -->
        <div v-if="fields.avatar && selectedCard?.avatarPath" class="sig-editor__field">
          <label class="sig-editor__label">{{ t('signatures.editor.avatarShape') }}</label>
          <div class="sig-editor__radio-group">
            <label class="sig-editor__radio">
              <input type="radio" value="circle" v-model="avatarShape" />
              {{ t('signatures.editor.avatarShapeCircle') }}
            </label>
            <label class="sig-editor__radio">
              <input type="radio" value="rounded-square" v-model="avatarShape" />
              {{ t('signatures.editor.avatarShapeRounded') }}
            </label>
          </div>
        </div>

        <!-- Contact columns -->
        <div class="sig-editor__field">
          <label class="sig-editor__label">{{ t('signatures.editor.contactColumns') }}</label>
          <div class="sig-editor__radio-group">
            <label class="sig-editor__radio">
              <input type="radio" :value="1" v-model.number="contactColumns" />
              {{ t('signatures.editor.contactColumns1') }}
            </label>
            <label class="sig-editor__radio">
              <input type="radio" :value="2" v-model.number="contactColumns" />
              {{ t('signatures.editor.contactColumns2') }}
            </label>
          </div>
        </div>

        <!-- Card link text -->
        <div v-if="fields.cardLink" class="sig-editor__field">
          <label class="sig-editor__label" for="sig-card-link-text">{{ t('signatures.editor.cardLinkText') }}</label>
          <input
            id="sig-card-link-text"
            v-model="cardLinkText"
            type="text"
            class="sig-editor__input"
            :placeholder="t('signatures.editor.cardLinkTextPlaceholder')"
            maxlength="50"
          />
        </div>

        <!-- Disclaimer -->
        <div v-if="fields.disclaimer" class="sig-editor__field">
          <label class="sig-editor__label" for="sig-disclaimer">{{ t('signatures.editor.disclaimer') }}</label>
          <textarea
            id="sig-disclaimer"
            v-model="disclaimer"
            class="sig-editor__textarea"
            :placeholder="t('signatures.editor.disclaimerPlaceholder')"
            rows="2"
            maxlength="200"
          />
        </div>

        <!-- Accent color -->
        <div class="sig-editor__field">
          <label class="sig-editor__label" for="sig-accent">{{ t('signatures.editor.accentColor') }}</label>
          <input
            id="sig-accent"
            v-model="accentColor"
            type="color"
            class="sig-editor__color-input"
          />
        </div>
      </div>

      <!-- Preview column -->
      <div class="sig-editor__preview">
        <div class="sig-editor__preview-sticky">
          <SignaturePreview v-if="selectedCard" :html="signatureHtml" />

          <div v-if="selectedCard" class="sig-editor__copy-section">
            <button class="sig-editor__copy-btn" @click="copyToClipboard">
              <Check v-if="copied" :size="14" />
              <Copy v-else :size="14" />
              {{ copied ? t('signatures.editor.copied') : t('signatures.editor.copyHtml') }}
            </button>
          </div>

          <!-- Fallback -->
          <div v-if="showFallback" class="sig-editor__fallback">
            <p class="sig-editor__fallback-hint">{{ t('signatures.editor.copyFallback') }}</p>
            <textarea
              class="sig-editor__fallback-area"
              :value="signatureHtml"
              readonly
              rows="6"
              @focus="($event.target as HTMLTextAreaElement).select()"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sig-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

.sig-editor__back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  margin-left: calc(-1 * var(--space-2));
  margin-bottom: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

.sig-editor__back-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.sig-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.sig-editor__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0;
  color: var(--color-text);
}

.sig-editor__save-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-primary-600);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
}

.sig-editor__save-btn:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.sig-editor__save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sig-editor__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sig-editor__error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-error-500);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.sig-editor__loading {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-secondary);
}

.sig-editor__layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-8);
  align-items: start;
}

.sig-editor__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sig-editor__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sig-editor__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.sig-editor__input,
.sig-editor__select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
}

.sig-editor__input:focus,
.sig-editor__select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.sig-editor__select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sig-editor__textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  resize: vertical;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
}

.sig-editor__textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.sig-editor__radio-group {
  display: flex;
  gap: var(--space-4);
}

.sig-editor__radio {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.sig-editor__radio input {
  accent-color: var(--color-primary-500);
  cursor: pointer;
}

.sig-editor__color-input {
  width: 48px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--color-surface);
}

.sig-editor__preview {
  min-width: 0;
  align-self: start;
  position: sticky;
  top: var(--space-6);
}

.sig-editor__preview-sticky {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sig-editor__copy-section {
  display: flex;
  justify-content: flex-end;
}

.sig-editor__copy-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text);
  transition: background var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default);
}

.sig-editor__copy-btn:hover {
  background: var(--color-bg-muted);
  border-color: var(--color-border-hover);
}

.sig-editor__fallback {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sig-editor__fallback-hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.sig-editor__fallback-area {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
}

@media (max-width: 900px) {
  .sig-editor__layout {
    grid-template-columns: 1fr;
  }

  .sig-editor__preview {
    position: static;
  }
}
</style>
