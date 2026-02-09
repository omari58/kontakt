<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  orgName: string;
  orgLogo: string | null;
  orgFavicon: string | null;
}>();

const emit = defineEmits<{
  'update:orgName': [value: string];
  uploadLogo: [file: File];
  uploadFavicon: [file: File];
}>();

const localName = ref(props.orgName);
const logoPreview = ref<string | null>(null);
const faviconPreview = ref<string | null>(null);

watch(() => props.orgName, (val) => { localName.value = val; });

function onNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localName.value = value;
  emit('update:orgName', value);
}

function onLogoChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  logoPreview.value = URL.createObjectURL(file);
  emit('uploadLogo', file);
}

function onFaviconChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  faviconPreview.value = URL.createObjectURL(file);
  emit('uploadFavicon', file);
}
</script>

<template>
  <section class="settings-section">
    <h2 class="settings-section__title">Branding</h2>

    <div class="settings-field">
      <label class="settings-field__label" for="org-name">Organization Name</label>
      <input
        id="org-name"
        type="text"
        class="settings-field__input"
        :value="localName"
        @input="onNameInput"
      />
    </div>

    <div class="settings-field">
      <label class="settings-field__label">Logo</label>
      <div class="settings-field__upload">
        <img
          v-if="logoPreview || orgLogo"
          :src="logoPreview || orgLogo!"
          alt="Organization logo"
          class="settings-field__preview settings-field__preview--logo"
        />
        <div v-else class="settings-field__placeholder">No logo uploaded</div>
        <label class="settings-field__upload-btn">
          Choose File
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            class="settings-field__file-input"
            @change="onLogoChange"
          />
        </label>
      </div>
    </div>

    <div class="settings-field">
      <label class="settings-field__label">Favicon</label>
      <div class="settings-field__upload">
        <img
          v-if="faviconPreview || orgFavicon"
          :src="faviconPreview || orgFavicon!"
          alt="Favicon"
          class="settings-field__preview settings-field__preview--favicon"
        />
        <div v-else class="settings-field__placeholder">No favicon uploaded</div>
        <label class="settings-field__upload-btn">
          Choose File
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            class="settings-field__file-input"
            @change="onFaviconChange"
          />
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  padding: var(--space-6);
}

.settings-section__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-gray-100);
}

.settings-field {
  margin-bottom: var(--space-5);
}

.settings-field:last-child {
  margin-bottom: 0;
}

.settings-field__label {
  display: block;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

.settings-field__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  background: var(--color-surface);
}

.settings-field__input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.settings-field__upload {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.settings-field__preview {
  object-fit: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.settings-field__preview--logo {
  width: 120px;
  height: 60px;
}

.settings-field__preview--favicon {
  width: 32px;
  height: 32px;
}

.settings-field__placeholder {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.settings-field__upload-btn {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  background: var(--color-surface);
}

.settings-field__upload-btn:hover {
  background: var(--color-gray-100);
}

.settings-field__file-input {
  display: none;
}
</style>
