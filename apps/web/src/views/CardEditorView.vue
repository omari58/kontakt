<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useCardForm } from '@/composables/useCardForm';
import { ArrowLeft, ChevronDown, Loader2, ExternalLink } from 'lucide-vue-next';
import QrButton from '@/components/QrButton.vue';
import ContactFields from '@/components/editor/ContactFields.vue';
import SocialLinksEditor from '@/components/editor/SocialLinksEditor.vue';
import ImageUploader from '@/components/editor/ImageUploader.vue';
import StyleSettings from '@/components/editor/StyleSettings.vue';
import CardPreview from '@/components/editor/CardPreview.vue';
import QrModal from '@/components/QrModal.vue';
import { useSettingsStore } from '@/stores/settings';
import { useToast } from '@/composables/useToast';
import { ApiError } from '@/composables/useApi';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const router = useRouter();

const cardId = computed(() => route.params.id as string | undefined);

const {
  form,
  loading,
  saving,
  error,
  fieldErrors,
  isDirty,
  isEditMode,
  avatarUrl,
  bannerUrl,
  backgroundUrl,
  loadCard,
  saveCard,
  uploadImage,
  deleteImage,
  addPhone,
  removePhone,
  addEmail,
  removeEmail,
  addWebsite,
  removeWebsite,
  addSocialLink,
  removeSocialLink,
  resetStyles,
} = useCardForm(cardId.value);

const { show: showToast } = useToast();

const expandedSections = ref<Record<string, boolean>>({
  basicInfo: true,
  contact: true,
  webSocial: true,
  images: true,
  appearance: true,
  settings: true,
});

function toggleSection(section: string) {
  expandedSections.value[section] = !expandedSections.value[section];
}

const { t } = useI18n();

const pageTitle = computed(() => isEditMode.value ? t('editor.editCard') : t('editor.createCard'));
const cardViewUrl = computed(() => form.slug ? `/c/${form.slug}` : null);

const savedCardId = ref<string | null>(cardId.value ?? null);
const showQrModal = ref(false);

async function handleSave() {
  const id = await saveCard();
  if (id) {
    savedCardId.value = id;
    showToast(t('success.cardSaved'), 'success');
    if (!isEditMode.value) {
      router.push({ name: 'card-edit', params: { id } });
    }
  }
}

async function handleImageUpload(type: 'avatar' | 'banner' | 'background', file: File) {
  const id = savedCardId.value ?? cardId.value;
  if (!id) {
    showToast(t('editor.saveBeforeUpload'), 'error');
    return;
  }
  try {
    await uploadImage(id, type, file);
    showToast(t('success.imageUploaded'), 'success');
  } catch (e: unknown) {
    const msg = e instanceof ApiError ? e.message : t('errors.failedUpload', { type, detail: '' });
    showToast(msg, 'error');
  }
}

async function handleImageDelete(type: 'avatar' | 'banner' | 'background') {
  const id = savedCardId.value ?? cardId.value;
  if (!id) return;
  try {
    await deleteImage(id, type);
    showToast(t('success.imageDeleted'), 'success');
  } catch (e: unknown) {
    const msg = e instanceof ApiError ? e.message : t('errors.failedDelete', { type });
    showToast(msg, 'error');
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value) {
    const leave = window.confirm(t('editor.unsavedChanges'));
    next(leave);
  } else {
    next();
  }
});

const settingsStore = useSettingsStore();

onMounted(() => {
  if (isEditMode.value) {
    loadCard();
  }
  settingsStore.fetchSettings();
});
</script>

<template>
  <div class="editor">
    <button class="editor__back-btn" @click="router.push({ name: 'dashboard' })">
      <ArrowLeft :size="16" />
      {{ $t('common.back') }}
    </button>
    <div class="editor__header">
      <h1 class="editor__title">{{ pageTitle }}</h1>
    </div>

    <div v-if="error" class="editor__error">
      {{ error }}
    </div>

    <div v-if="loading" class="editor__loading">
      {{ $t('editor.loadingCard') }}
    </div>

    <div v-else class="editor__layout">
      <div class="editor__form">
        <!-- Basic Info -->
        <div class="editor__section">
          <button
            type="button"
            class="editor__section-header"
            @click="toggleSection('basicInfo')"
          >
            <span class="editor__section-title">{{ $t('editor.basicInfo.title') }}</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.basicInfo }"
            />
          </button>
          <div v-show="expandedSections.basicInfo" class="editor__section-body">
            <div class="editor__field">
              <label class="editor__label" for="name">{{ $t('editor.basicInfo.nameRequired') }}</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="editor__input"
                :placeholder="$t('editor.basicInfo.namePlaceholder')"
                required
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="jobTitle">{{ $t('editor.basicInfo.jobTitle') }}</label>
              <input
                id="jobTitle"
                v-model="form.jobTitle"
                type="text"
                class="editor__input"
                :placeholder="$t('editor.basicInfo.jobTitlePlaceholder')"
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="company">{{ $t('editor.basicInfo.company') }}</label>
              <input
                id="company"
                v-model="form.company"
                type="text"
                class="editor__input"
                :placeholder="$t('editor.basicInfo.companyPlaceholder')"
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="bio">{{ $t('editor.basicInfo.bio') }}</label>
              <textarea
                id="bio"
                v-model="form.bio"
                class="editor__textarea"
                :placeholder="$t('editor.basicInfo.bioPlaceholder')"
                rows="3"
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="pronouns">{{ $t('editor.basicInfo.pronouns') }}</label>
              <input
                id="pronouns"
                v-model="form.pronouns"
                type="text"
                class="editor__input"
                :placeholder="$t('editor.basicInfo.pronounsPlaceholder')"
              />
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="editor__section">
          <button
            type="button"
            class="editor__section-header"
            @click="toggleSection('contact')"
          >
            <span class="editor__section-title">{{ $t('editor.contact.title') }}</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.contact }"
            />
          </button>
          <div v-show="expandedSections.contact" class="editor__section-body">
            <ContactFields
              :phones="form.phones"
              :emails="form.emails"
              :address="form.address"
              :field-errors="fieldErrors"
              @add-phone="addPhone"
              @remove-phone="removePhone"
              @add-email="addEmail"
              @remove-email="removeEmail"
              @update:address="Object.assign(form.address, $event)"
            />
          </div>
        </div>

        <!-- Web & Social -->
        <div class="editor__section">
          <button
            type="button"
            class="editor__section-header"
            @click="toggleSection('webSocial')"
          >
            <span class="editor__section-title">{{ $t('editor.webSocial.title') }}</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.webSocial }"
            />
          </button>
          <div v-show="expandedSections.webSocial" class="editor__section-body">
            <div class="editor__field">
              <label class="editor__label" for="calendarUrl">{{ $t('editor.webSocial.calendarUrl') }}</label>
              <input
                id="calendarUrl"
                v-model="form.calendarUrl"
                type="url"
                class="editor__input"
                :placeholder="$t('editor.webSocial.calendarUrlPlaceholder')"
              />
            </div>
            <div v-if="form.calendarUrl" class="editor__field">
              <label class="editor__label" for="calendarText">{{ $t('editor.webSocial.calendarText') }}</label>
              <input
                id="calendarText"
                v-model="form.calendarText"
                type="text"
                class="editor__input"
                :placeholder="$t('editor.webSocial.calendarTextPlaceholder')"
                maxlength="50"
              />
            </div>
            <SocialLinksEditor
              :social-links="form.socialLinks"
              :websites="form.websites"
              :field-errors="fieldErrors"
              @add-social-link="addSocialLink"
              @remove-social-link="removeSocialLink"
              @add-website="addWebsite"
              @remove-website="removeWebsite"
            />
          </div>
        </div>

        <!-- Images -->
        <div class="editor__section">
          <button
            type="button"
            class="editor__section-header"
            @click="toggleSection('images')"
          >
            <span class="editor__section-title">{{ $t('editor.images.title') }}</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.images }"
            />
          </button>
          <div v-show="expandedSections.images" class="editor__section-body">
            <p v-if="!savedCardId && !cardId" class="editor__hint">
              {{ $t('editor.saveFirst') }}
            </p>
            <template v-else>
              <div class="editor__images-row">
                <ImageUploader
                  :label="$t('editor.images.avatar')"
                  :image-url="avatarUrl"
                  @upload="handleImageUpload('avatar', $event)"
                  @remove="handleImageDelete('avatar')"
                />
                <ImageUploader
                  :label="$t('editor.images.banner')"
                  :image-url="bannerUrl"
                  @upload="handleImageUpload('banner', $event)"
                  @remove="handleImageDelete('banner')"
                />
              </div>
              <ImageUploader
                :label="$t('editor.images.background')"
                :image-url="backgroundUrl"
                @upload="handleImageUpload('background', $event)"
                @remove="handleImageDelete('background')"
              />
            </template>
          </div>
        </div>

        <!-- Appearance -->
        <div class="editor__section">
          <button
            type="button"
            class="editor__section-header"
            @click="toggleSection('appearance')"
          >
            <span class="editor__section-title">{{ $t('editor.appearance.title') }}</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.appearance }"
            />
          </button>
          <div v-show="expandedSections.appearance" class="editor__section-body">
            <StyleSettings
              :bg-color="form.bgColor"
              :primary-color="form.primaryColor"
              :text-color="form.textColor"
              :font-family="form.fontFamily"
              :avatar-shape="form.avatarShape"
              :theme="form.theme"
              :visibility="form.visibility"
              :no-index="form.noIndex"
              :obfuscate="form.obfuscate"
              :slug="form.slug"
              :is-edit-mode="isEditMode"
              :field-errors="fieldErrors"
              @update:bg-color="form.bgColor = $event"
              @update:primary-color="form.primaryColor = $event"
              @update:text-color="form.textColor = $event"
              @update:font-family="form.fontFamily = $event"
              @update:avatar-shape="form.avatarShape = $event"
              @update:theme="form.theme = $event"
              @update:visibility="form.visibility = $event"
              @update:no-index="form.noIndex = $event"
              @update:obfuscate="form.obfuscate = $event"
              @update:slug="form.slug = $event"
              @reset-styles="resetStyles"
            />
          </div>
        </div>
      </div>

      <div class="editor__preview">
        <div class="editor__preview-sticky">
          <div class="editor__preview-header">
            <span class="editor__preview-label">{{ $t('editor.livePreview') }}</span>
            <div class="editor__preview-actions">
              <QrButton v-if="cardViewUrl" @click="showQrModal = true" />
              <a
                v-if="cardViewUrl"
                :href="cardViewUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="editor__open-btn"
                :title="$t('editor.openCard')"
              >
                <ExternalLink :size="14" />
              </a>
              <button
                class="editor__save-btn"
                :disabled="saving || !form.name"
                @click="handleSave"
              >
                <Loader2 v-if="saving" :size="14" class="editor__spinner" />
                {{ saving ? $t('common.saving') : $t('editor.saveCard') }}
              </button>
            </div>
          </div>
          <div class="editor__preview-frame">
            <CardPreview
              :form="form"
              :avatar-url="avatarUrl"
              :banner-url="bannerUrl"
              :background-url="backgroundUrl"
              :footer-text="settingsStore.settings.footer_text"
              :footer-link="settingsStore.settings.footer_link"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code modal -->
    <QrModal
      v-if="showQrModal && form.slug"
      :card="{ slug: form.slug, name: form.name, jobTitle: form.jobTitle, company: form.company, phones: form.phones, emails: form.emails }"
      :visible="showQrModal"
      @close="showQrModal = false"
    />
  </div>
</template>

<style scoped>
.editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

.editor__back-btn {
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

.editor__back-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.editor__header {
  margin-bottom: var(--space-6);
}

.editor__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0;
  color: var(--color-text);
}

.editor__save-btn {
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

.editor__save-btn:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.editor__save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.editor__error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-error-500);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.editor__loading {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-secondary);
}

.editor__layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-8);
  align-items: start;
}

.editor__form {
  display: flex;
  flex-direction: column;
}

.editor__section {
  border-bottom: 1px solid var(--color-border);
}

.editor__section:last-child {
  border-bottom: none;
}

.editor__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-4) 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--text-md);
  text-align: left;
}

.editor__section-header:hover {
  color: var(--color-primary-600);
}

.editor__section-title {
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.editor__section-header:hover .editor__section-title {
  color: var(--color-primary-600);
}

.editor__section-chevron {
  color: var(--color-text-muted);
  transition: transform var(--duration-normal) var(--ease-default);
  transform: rotate(-90deg);
}

.editor__section-chevron--open {
  transform: rotate(0deg);
}

.editor__section-body {
  padding: 0 0 var(--space-4);
}

.editor__field {
  margin-bottom: var(--space-3);
}

.editor__label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}

.editor__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
}

.editor__input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.editor__textarea {
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

.editor__textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.editor__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-style: italic;
  margin: 0;
}

.editor__images-row {
  display: flex;
  gap: var(--space-4);
  margin-bottom: 1rem;
}

.editor__images-row > * {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
}

@media (max-width: 480px) {
  .editor__images-row {
    flex-direction: column;
  }
}

.editor__preview {
  min-width: 0;
  align-self: start;
  position: sticky;
  top: var(--space-6);
}

.editor__preview-sticky {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2 * var(--space-6));
}

.editor__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  flex-shrink: 0;
}

.editor__preview-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: var(--font-semibold);
}

.editor__preview-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.editor__open-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

.editor__open-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.editor__preview-frame {
  background: var(--color-bg-muted);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  overflow-y: auto;
  min-height: 0;
}

.editor__preview-frame::-webkit-scrollbar {
  width: 6px;
}

.editor__preview-frame::-webkit-scrollbar-track {
  background: transparent;
}

.editor__preview-frame::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.editor__preview-frame::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

@media (max-width: 900px) {
  .editor__layout {
    grid-template-columns: 1fr;
  }

  .editor__preview {
    order: -1;
    position: static;
  }
}
</style>
