<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useCardForm } from '@/composables/useCardForm';
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

// Saved card ID is tracked for image uploads on newly created cards
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
        &larr; Back
      </button>
      <h1 class="editor__title">{{ pageTitle }}</h1>
      <button
        class="editor__save-btn"
        :disabled="saving || !form.name"
        @click="handleSave"
      >
        {{ saving ? 'Saving...' : 'Save Card' }}
      </button>
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
            <span class="editor__section-toggle">{{ expandedSections.basicInfo ? '−' : '+' }}</span>
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
            <span class="editor__section-toggle">{{ expandedSections.contact ? '−' : '+' }}</span>
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
            <span class="editor__section-toggle">{{ expandedSections.webSocial ? '−' : '+' }}</span>
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
            <span class="editor__section-toggle">{{ expandedSections.images ? '−' : '+' }}</span>
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
            <span class="editor__section-toggle">{{ expandedSections.appearance ? '−' : '+' }}</span>
          </button>
          <div v-show="expandedSections.appearance" class="editor__section-body">
            <StyleSettings
              :bg-color="form.bgColor"
              :primary-color="form.primaryColor"
              :text-color="form.textColor"
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
              @update:avatar-shape="form.avatarShape = $event"
              @update:theme="form.theme = $event"
              @update:visibility="form.visibility = $event"
              @update:no-index="form.noIndex = $event"
              @update:obfuscate="form.obfuscate = $event"
              @update:slug="form.slug = $event"
            />
          </div>
        </div>
      </div>

      <div class="editor__preview">
        <div class="editor__preview-sticky">
          <h3 class="editor__preview-title">Live Preview</h3>
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
</template>

<style scoped>
.editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.editor__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.editor__back-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}

.editor__back-btn:hover {
  background: #f5f5f5;
}

.editor__title {
  flex: 1;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.editor__save-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: #0066cc;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.editor__save-btn:hover:not(:disabled) {
  background: #0052a3;
}

.editor__save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor__error {
  background: #fce4ec;
  color: #d32f2f;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.editor__loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.editor__layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  align-items: start;
}

.editor__form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.editor__section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: #fff;
  overflow: hidden;
}

.editor__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: #fafafa;
  cursor: pointer;
  font-size: 1rem;
  text-align: left;
}

.editor__section-header:hover {
  background: #f0f0f0;
}

.editor__section-title {
  font-weight: 600;
}

.editor__section-toggle {
  font-size: 1.25rem;
  color: #666;
  width: 24px;
  text-align: center;
}

.editor__section-body {
  padding: 1rem;
}

.editor__field {
  margin-bottom: 0.75rem;
}

.editor__label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.editor__input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.editor__input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.editor__textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.editor__textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.editor__hint {
  color: #666;
  font-size: 0.875rem;
  font-style: italic;
  margin: 0;
}

.editor__preview {
  min-width: 0;
}

.editor__preview-sticky {
  position: sticky;
  top: 1.5rem;
}

.editor__preview-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: #333;
}

@media (max-width: 900px) {
  .editor__layout {
    grid-template-columns: 1fr;
  }

  .editor__preview {
    order: -1;
  }
}
</style>
