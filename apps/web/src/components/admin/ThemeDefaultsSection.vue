<script setup lang="ts">
import { ref, watch } from 'vue';

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

const themes: { value: string; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
];

const avatarShapes: { value: string; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'rounded_square', label: 'Rounded Square' },
];

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
    <h2 class="settings-section__title">Theme Defaults</h2>

    <div class="settings-field">
      <label class="settings-field__label" for="primary-color">Primary Color</label>
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
      <label class="settings-field__label" for="secondary-color">Secondary Color</label>
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
      <label class="settings-field__label" for="bg-color">Background Color</label>
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
      <label class="settings-field__label" for="theme-mode">Theme Mode</label>
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
      <label class="settings-field__label" for="avatar-shape">Default Avatar Shape</label>
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

.settings-field__input--short {
  width: 120px;
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

.settings-field__color-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-field__color-picker {
  width: 40px;
  height: 36px;
  padding: 2px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}
</style>
