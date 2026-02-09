<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  theme: string;
  avatarShape: string;
}>();

const emit = defineEmits<{
  'update:primaryColor': [value: string];
  'update:secondaryColor': [value: string];
  'update:bgColor': [value: string];
  'update:theme': [value: string];
  'update:avatarShape': [value: string];
}>();

const localPrimary = ref(props.primaryColor);
const localSecondary = ref(props.secondaryColor);
const localBg = ref(props.bgColor);
const localTheme = ref(props.theme);
const localShape = ref(props.avatarShape);

watch(() => props.primaryColor, (v) => { localPrimary.value = v; });
watch(() => props.secondaryColor, (v) => { localSecondary.value = v; });
watch(() => props.bgColor, (v) => { localBg.value = v; });
watch(() => props.theme, (v) => { localTheme.value = v; });
watch(() => props.avatarShape, (v) => { localShape.value = v; });

const themes = computed(() => [
  { value: 'light', label: t('theme.light') },
  { value: 'dark', label: t('theme.dark') },
  { value: 'auto', label: t('theme.auto') },
]);

const avatarShapes = computed(() => [
  { value: 'circle', label: t('editor.appearance.circle') },
  { value: 'rounded_square', label: t('editor.appearance.roundedSquare') },
]);

function onColorInput(field: 'primaryColor' | 'secondaryColor' | 'bgColor', event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit(`update:${field}`, value);
}

function onThemeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  localTheme.value = value;
  emit('update:theme', value);
}

function onShapeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  localShape.value = value;
  emit('update:avatarShape', value);
}
</script>

<template>
  <section class="settings-section">
    <h2 class="settings-section__title">{{ $t('admin.themeDefaults.title') }}</h2>

    <div class="settings-field">
      <label class="settings-field__label" for="primary-color">{{ $t('admin.themeDefaults.primaryColor') }}</label>
      <div class="settings-field__color-row">
        <input
          id="primary-color"
          type="color"
          class="settings-field__color-picker"
          :value="localPrimary"
          @input="onColorInput('primaryColor', $event)"
        />
        <input
          type="text"
          class="settings-field__input settings-field__input--short"
          :value="localPrimary"
          @input="onColorInput('primaryColor', $event)"
        />
      </div>
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="secondary-color">{{ $t('admin.themeDefaults.secondaryColor') }}</label>
      <div class="settings-field__color-row">
        <input
          id="secondary-color"
          type="color"
          class="settings-field__color-picker"
          :value="localSecondary"
          @input="onColorInput('secondaryColor', $event)"
        />
        <input
          type="text"
          class="settings-field__input settings-field__input--short"
          :value="localSecondary"
          @input="onColorInput('secondaryColor', $event)"
        />
      </div>
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="bg-color">{{ $t('admin.themeDefaults.backgroundColor') }}</label>
      <div class="settings-field__color-row">
        <input
          id="bg-color"
          type="color"
          class="settings-field__color-picker"
          :value="localBg"
          @input="onColorInput('bgColor', $event)"
        />
        <input
          type="text"
          class="settings-field__input settings-field__input--short"
          :value="localBg"
          @input="onColorInput('bgColor', $event)"
        />
      </div>
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="theme-mode">{{ $t('admin.themeDefaults.themeMode') }}</label>
      <select
        id="theme-mode"
        class="settings-field__select"
        :value="localTheme"
        @change="onThemeChange"
      >
        <option v-for="t in themes" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <div class="settings-field">
      <label class="settings-field__label" for="avatar-shape">{{ $t('admin.themeDefaults.defaultAvatarShape') }}</label>
      <select
        id="avatar-shape"
        class="settings-field__select"
        :value="localShape"
        @change="onShapeChange"
      >
        <option v-for="s in avatarShapes" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
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

.settings-field__input--short {
  width: 120px;
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

.settings-field__color-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.settings-field__color-picker {
  width: 40px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  background: none;
}
</style>
