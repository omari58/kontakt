<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useCardForm } from '@/composables/useCardForm';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-vue-next';
import ContactFields from '@/components/editor/ContactFields.vue';
import SocialLinksEditor from '@/components/editor/SocialLinksEditor.vue';
import ImageUploader from '@/components/editor/ImageUploader.vue';
import StyleSettings from '@/components/editor/StyleSettings.vue';
import CardPreview from '@/components/editor/CardPreview.vue';

const route = useRoute();
const router = useRouter();

const cardId = computed(() => route.params.id as string | undefined);

const {
  form,
  loading,
  saving,
  error,
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

const expandedSections = ref<Record<string, boolean>>({
  basicInfo: true,
  contact: true,
  webSocial: true,
  images: true,
  appearance: false,
  settings: false,
});

function toggleSection(section: string) {
  expandedSections.value[section] = !expandedSections.value[section];
}

const pageTitle = computed(() => isEditMode.value ? 'Edit Card' : 'Create Card');

const savedCardId = ref<string | null>(cardId.value ?? null);

async function handleSave() {
  const id = await saveCard();
  if (id) {
    savedCardId.value = id;
    if (!isEditMode.value) {
      router.push({ name: 'card-edit', params: { id } });
    }
  }
}

async function handleImageUpload(type: 'avatar' | 'banner' | 'background', file: File) {
  const id = savedCardId.value ?? cardId.value;
  if (!id) {
    error.value = 'Please save the card before uploading images.';
    return;
  }
  await uploadImage(id, type, file);
}

async function handleImageDelete(type: 'avatar' | 'banner' | 'background') {
  const id = savedCardId.value ?? cardId.value;
  if (!id) return;
  await deleteImage(id, type);
}

onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value) {
    const leave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
    next(leave);
  } else {
    next();
  }
});

onMounted(() => {
  if (isEditMode.value) {
    loadCard();
  }
});
</script>

<template>
  <div class="editor">
    <div class="editor__header">
      <button class="editor__back-btn" @click="router.push({ name: 'dashboard' })">
        <ArrowLeft :size="16" />
        Back
      </button>
      <h1 class="editor__title">{{ pageTitle }}</h1>
    </div>

    <div v-if="error" class="editor__error">
      {{ error }}
    </div>

    <div v-if="loading" class="editor__loading">
      Loading card...
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
            <span class="editor__section-title">Basic Info</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.basicInfo }"
            />
          </button>
          <div v-show="expandedSections.basicInfo" class="editor__section-body">
            <div class="editor__field">
              <label class="editor__label" for="name">Name *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="editor__input"
                placeholder="Full name"
                required
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="jobTitle">Job Title</label>
              <input
                id="jobTitle"
                v-model="form.jobTitle"
                type="text"
                class="editor__input"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="company">Company</label>
              <input
                id="company"
                v-model="form.company"
                type="text"
                class="editor__input"
                placeholder="Company name"
              />
            </div>
            <div class="editor__field">
              <label class="editor__label" for="bio">Bio</label>
              <textarea
                id="bio"
                v-model="form.bio"
                class="editor__textarea"
                placeholder="A short bio or description"
                rows="3"
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
            <span class="editor__section-title">Contact</span>
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
            <span class="editor__section-title">Web & Social</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.webSocial }"
            />
          </button>
          <div v-show="expandedSections.webSocial" class="editor__section-body">
            <SocialLinksEditor
              :social-links="form.socialLinks"
              :websites="form.websites"
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
            <span class="editor__section-title">Images</span>
            <ChevronDown
              :size="18"
              class="editor__section-chevron"
              :class="{ 'editor__section-chevron--open': expandedSections.images }"
            />
          </button>
          <div v-show="expandedSections.images" class="editor__section-body">
            <p v-if="!savedCardId && !cardId" class="editor__hint">
              Save the card first to upload images.
            </p>
            <template v-else>
              <ImageUploader
                label="Avatar"
                :image-url="avatarUrl"
                @upload="handleImageUpload('avatar', $event)"
                @remove="handleImageDelete('avatar')"
              />
              <ImageUploader
                label="Banner"
                :image-url="bannerUrl"
                @upload="handleImageUpload('banner', $event)"
                @remove="handleImageDelete('banner')"
              />
              <ImageUploader
                label="Background"
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
            <span class="editor__section-title">Appearance & Settings</span>
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
            <span class="editor__preview-label">Live Preview</span>
            <button
              class="editor__save-btn"
              :disabled="saving || !form.name"
              @click="handleSave"
            >
              <Loader2 v-if="saving" :size="14" class="editor__spinner" />
              {{ saving ? 'Saving...' : 'Save Card' }}
            </button>
          </div>
          <div class="editor__preview-frame">
            <CardPreview
              :form="form"
              :avatar-url="avatarUrl"
              :banner-url="bannerUrl"
              :background-url="backgroundUrl"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

.editor__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.editor__back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
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
  background: var(--color-gray-100);
  color: var(--color-text);
}

.editor__title {
  flex: 1;
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
  border-bottom: 1px solid var(--color-gray-100);
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

.editor__preview {
  min-width: 0;
  align-self: start;
  position: sticky;
  top: var(--space-6);
}

.editor__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.editor__preview-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: var(--font-semibold);
}

.editor__preview-frame {
  background: var(--color-gray-100);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
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
