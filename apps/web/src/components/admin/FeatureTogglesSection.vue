<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

const visibilityOptions = computed(() => [
  { value: 'public', label: t('editor.settings.public') },
  { value: 'unlisted', label: t('editor.settings.unlisted') },
  { value: 'disabled', label: t('editor.settings.disabled') },
]);

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
    <h2 class="settings-section__title">{{ $t('admin.features.title') }}</h2>

    <div class="settings-field">
      <label class="settings-field__toggle">
        <input
          type="checkbox"
          :checked="localColorOverride"
          @change="onToggle('allowUserColorOverride', $event)"
        />
        <span class="settings-field__toggle-label">{{ $t('admin.features.allowColors') }}</span>
      </label>
    </div>

    <div class="settings-field">
      <label class="settings-field__toggle">
        <input
          type="checkbox"
          :checked="localBgImages"
          @change="onToggle('allowBgImages', $event)"
        />
        <span class="settings-field__toggle-label">{{ $t('admin.features.allowBgImages') }}</span>
      </label>
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="default-visibility">{{ $t('admin.features.defaultVisibility') }}</label>
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
    <h2 class="settings-section__title">{{ $t('admin.footer.title') }}</h2>

    <div class="settings-field">
      <label class="settings-field__label" for="footer-text">{{ $t('admin.footer.footerText') }}</label>
      <input
        id="footer-text"
        type="text"
        class="settings-field__input"
        :value="localFooterText"
        @input="onFooterTextInput"
      />
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="footer-link">{{ $t('admin.footer.footerLink') }}</label>
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
  border-bottom: 1px solid var(--color-border);
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

.settings-field__select {
  width: 100%;
  max-width: 240px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  background: var(--color-surface);
  cursor: pointer;
}

.settings-field__select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.settings-field__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.settings-field__toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.settings-field__toggle-label {
  font-size: var(--text-base);
  color: var(--color-text);
}
</style>
