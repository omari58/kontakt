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
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
}

.settings-section__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.settings-field {
  margin-bottom: 1.25rem;
}

.settings-field:last-child {
  margin-bottom: 0;
}

.settings-field__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #333;
}

.settings-field__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  background: #fff;
}

.settings-field__input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.1);
}

.settings-field__upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-field__preview {
  object-fit: contain;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #f9f9f9;
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
  font-size: 0.8125rem;
  color: #999;
}

.settings-field__upload-btn {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  background: #fff;
}

.settings-field__upload-btn:hover {
  background: #f5f5f5;
}

.settings-field__file-input {
  display: none;
}
</style>
