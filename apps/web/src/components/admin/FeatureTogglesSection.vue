<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  allowUserColorOverride: boolean;
  allowBgImages: boolean;
  defaultVisibility: string;
  footerText: string;
  footerLink: string;
}>();

const emit = defineEmits<{
  'update:allowUserColorOverride': [value: boolean];
  'update:allowBgImages': [value: boolean];
  'update:defaultVisibility': [value: string];
  'update:footerText': [value: string];
  'update:footerLink': [value: string];
}>();

const localColorOverride = ref(props.allowUserColorOverride);
const localBgImages = ref(props.allowBgImages);
const localVisibility = ref(props.defaultVisibility);
const localFooterText = ref(props.footerText);
const localFooterLink = ref(props.footerLink);

watch(() => props.allowUserColorOverride, (v) => { localColorOverride.value = v; });
watch(() => props.allowBgImages, (v) => { localBgImages.value = v; });
watch(() => props.defaultVisibility, (v) => { localVisibility.value = v; });
watch(() => props.footerText, (v) => { localFooterText.value = v; });
watch(() => props.footerLink, (v) => { localFooterLink.value = v; });

const visibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'disabled', label: 'Disabled' },
];

function onToggle(field: 'allowUserColorOverride' | 'allowBgImages', event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  emit(`update:${field}`, checked);
}

function onVisibilityChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  localVisibility.value = value;
  emit('update:defaultVisibility', value);
}

function onFooterTextInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localFooterText.value = value;
  emit('update:footerText', value);
}

function onFooterLinkInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localFooterLink.value = value;
  emit('update:footerLink', value);
}
</script>

<template>
  <section class="settings-section">
    <h2 class="settings-section__title">Feature Toggles</h2>

    <div class="settings-field">
      <label class="settings-field__toggle">
        <input
          type="checkbox"
          :checked="localColorOverride"
          @change="onToggle('allowUserColorOverride', $event)"
        />
        <span class="settings-field__toggle-label">Allow users to customize card colors</span>
      </label>
    </div>

    <div class="settings-field">
      <label class="settings-field__toggle">
        <input
          type="checkbox"
          :checked="localBgImages"
          @change="onToggle('allowBgImages', $event)"
        />
        <span class="settings-field__toggle-label">Allow background images on cards</span>
      </label>
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="default-visibility">Default Card Visibility</label>
      <select
        id="default-visibility"
        class="settings-field__select"
        :value="localVisibility"
        @change="onVisibilityChange"
      >
        <option v-for="v in visibilityOptions" :key="v.value" :value="v.value">{{ v.label }}</option>
      </select>
    </div>
  </section>

  <section class="settings-section">
    <h2 class="settings-section__title">Footer</h2>

    <div class="settings-field">
      <label class="settings-field__label" for="footer-text">Footer Text</label>
      <input
        id="footer-text"
        type="text"
        class="settings-field__input"
        :value="localFooterText"
        @input="onFooterTextInput"
      />
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="footer-link">Footer Link</label>
      <input
        id="footer-link"
        type="url"
        class="settings-field__input"
        placeholder="https://example.com"
        :value="localFooterLink"
        @input="onFooterLinkInput"
      />
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

.settings-field__select {
  width: 100%;
  max-width: 240px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  background: #fff;
  cursor: pointer;
}

.settings-field__select:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.1);
}

.settings-field__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.settings-field__toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.settings-field__toggle-label {
  font-size: 0.875rem;
  color: #333;
}
</style>
