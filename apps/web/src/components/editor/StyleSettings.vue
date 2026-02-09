<script setup lang="ts">
import type { AvatarShape, Theme, Visibility } from '@/types';

const FONT_OPTIONS = [
  { id: '', name: 'Default (Outfit)', family: "'Outfit', sans-serif" },
  { id: 'dm-serif', name: 'DM Serif Display', family: "'DM Serif Display', Georgia, serif" },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', Georgia, serif" },
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif" },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
  { id: 'cormorant', name: 'Cormorant Garamond', family: "'Cormorant Garamond', Georgia, serif" },
  { id: 'sora', name: 'Sora', family: "'Sora', sans-serif" },
  { id: 'fraunces', name: 'Fraunces', family: "'Fraunces', Georgia, serif" },
  { id: 'bricolage', name: 'Bricolage Grotesque', family: "'Bricolage Grotesque', sans-serif" },
];

defineProps<{
  bgColor: string;
  primaryColor: string;
  textColor: string;
  fontFamily: string;
  avatarShape: AvatarShape;
  theme: Theme;
  visibility: Visibility;
  noIndex: boolean;
  obfuscate: boolean;
  slug: string;
  isEditMode: boolean;
}>();

const emit = defineEmits<{
  'update:bgColor': [value: string];
  'update:primaryColor': [value: string];
  'update:textColor': [value: string];
  'update:fontFamily': [value: string];
  'update:avatarShape': [value: AvatarShape];
  'update:theme': [value: Theme];
  'update:visibility': [value: Visibility];
  'update:noIndex': [value: boolean];
  'update:obfuscate': [value: boolean];
  'update:slug': [value: string];
  'resetStyles': [];
}>();
</script>

<template>
  <div class="style-settings">
    <fieldset class="style-settings__group">
      <legend class="style-settings__legend">Theme</legend>

      <!-- Theme mode selector with pill buttons -->
      <div class="style-settings__theme-pills">
        <button
          v-for="opt in ([
            { value: 'LIGHT', label: 'Light' },
            { value: 'DARK', label: 'Dark' },
            { value: 'AUTO', label: 'Auto' },
          ] as const)"
          :key="opt.value"
          type="button"
          class="style-settings__theme-pill"
          :class="{ 'style-settings__theme-pill--active': theme === opt.value }"
          @click="emit('update:theme', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Live color swatch preview -->
      <div v-if="theme === 'AUTO'" class="style-settings__swatch-pair">
        <div class="style-settings__swatch style-settings__swatch--half" :style="{ background: '#ffffff' }">
          <span class="style-settings__swatch-label" :style="{ color: '#111111' }">Light</span>
          <span class="style-settings__swatch-text" :style="{ color: '#111111' }">Aa</span>
          <span class="style-settings__swatch-accent" :style="{ background: primaryColor }" />
        </div>
        <div class="style-settings__swatch style-settings__swatch--half" :style="{ background: '#1e1e1e' }">
          <span class="style-settings__swatch-label" :style="{ color: '#ffffff' }">Dark</span>
          <span class="style-settings__swatch-text" :style="{ color: '#ffffff' }">Aa</span>
          <span class="style-settings__swatch-accent" :style="{ background: primaryColor }" />
        </div>
      </div>
      <div v-else class="style-settings__swatch" :style="{ background: bgColor }">
        <span class="style-settings__swatch-text" :style="{ color: textColor }">Aa</span>
        <span class="style-settings__swatch-accent" :style="{ background: primaryColor }" />
      </div>

      <!-- Colors: full controls for Light/Dark, accent-only for Auto -->
      <div v-if="theme !== 'AUTO'" class="style-settings__color-row">
        <label class="style-settings__color-label">
          Background
          <div class="style-settings__color-picker">
            <input
              type="color"
              :value="bgColor"
              class="style-settings__color-input"
              @input="emit('update:bgColor', ($event.target as HTMLInputElement).value)"
            />
            <input
              type="text"
              :value="bgColor"
              class="style-settings__color-text"
              @input="emit('update:bgColor', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </label>

        <label class="style-settings__color-label">
          Text
          <div class="style-settings__color-picker">
            <input
              type="color"
              :value="textColor"
              class="style-settings__color-input"
              @input="emit('update:textColor', ($event.target as HTMLInputElement).value)"
            />
            <input
              type="text"
              :value="textColor"
              class="style-settings__color-text"
              @input="emit('update:textColor', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </label>

        <label class="style-settings__color-label">
          Accent
          <div class="style-settings__color-picker">
            <input
              type="color"
              :value="primaryColor"
              class="style-settings__color-input"
              @input="emit('update:primaryColor', ($event.target as HTMLInputElement).value)"
            />
            <input
              type="text"
              :value="primaryColor"
              class="style-settings__color-text"
              @input="emit('update:primaryColor', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </label>
      </div>

      <div v-else class="style-settings__color-row">
        <label class="style-settings__color-label">
          Accent Color
          <div class="style-settings__color-picker">
            <input
              type="color"
              :value="primaryColor"
              class="style-settings__color-input"
              @input="emit('update:primaryColor', ($event.target as HTMLInputElement).value)"
            />
            <input
              type="text"
              :value="primaryColor"
              class="style-settings__color-text"
              @input="emit('update:primaryColor', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </label>
      </div>

      <button
        type="button"
        class="style-settings__reset-btn"
        @click="emit('resetStyles')"
      >
        Reset to theme defaults
      </button>
    </fieldset>

    <fieldset class="style-settings__group">
      <legend class="style-settings__legend">Style</legend>

      <div class="style-settings__field">
        <label class="style-settings__label">Name Font</label>
        <select
          :value="fontFamily"
          class="style-settings__select"
          @change="emit('update:fontFamily', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="font in FONT_OPTIONS"
            :key="font.id"
            :value="font.id"
            :style="{ fontFamily: font.family }"
          >
            {{ font.name }}
          </option>
        </select>
      </div>

      <div class="style-settings__field">
        <label class="style-settings__label">Avatar Shape</label>
        <select
          :value="avatarShape"
          class="style-settings__select"
          @change="emit('update:avatarShape', ($event.target as HTMLSelectElement).value as AvatarShape)"
        >
          <option value="CIRCLE">Circle</option>
          <option value="ROUNDED_SQUARE">Rounded Square</option>
        </select>
      </div>
    </fieldset>

    <fieldset class="style-settings__group">
      <legend class="style-settings__legend">Card Settings</legend>

      <div v-if="isEditMode" class="style-settings__field">
        <label class="style-settings__label">Slug</label>
        <div class="style-settings__slug-row">
          <span class="style-settings__slug-prefix">/c/</span>
          <input
            :value="slug"
            type="text"
            class="style-settings__input"
            placeholder="my-card-slug"
            @input="emit('update:slug', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="style-settings__field">
        <label class="style-settings__label">Visibility</label>
        <select
          :value="visibility"
          class="style-settings__select"
          @change="emit('update:visibility', ($event.target as HTMLSelectElement).value as Visibility)"
        >
          <option value="PUBLIC">Public</option>
          <option value="UNLISTED">Unlisted</option>
          <option value="DISABLED">Disabled</option>
        </select>
      </div>

      <label class="style-settings__checkbox">
        <input
          type="checkbox"
          :checked="noIndex"
          @change="emit('update:noIndex', ($event.target as HTMLInputElement).checked)"
        />
        No Index (prevent search engines from indexing)
      </label>

      <label class="style-settings__checkbox">
        <input
          type="checkbox"
          :checked="obfuscate"
          @change="emit('update:obfuscate', ($event.target as HTMLInputElement).checked)"
        />
        Obfuscate contact info (bot protection)
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
.style-settings__group {
  border: none;
  padding: 0;
  margin-bottom: var(--space-4);
}

.style-settings__legend {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  padding: 0;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

/* ===== Theme pills ===== */
.style-settings__theme-pills {
  display: flex;
  gap: 0;
  background: var(--color-gray-100);
  border-radius: var(--radius-lg);
  padding: 3px;
  margin-bottom: 0.75rem;
}

.style-settings__theme-pill {
  flex: 1;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: calc(var(--radius-lg) - 2px);
  background: transparent;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.style-settings__theme-pill:hover {
  color: var(--color-text);
}

.style-settings__theme-pill--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.style-settings__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: -0.25rem 0 0.75rem;
  line-height: 1.4;
}

/* ===== Color swatch ===== */
.style-settings__swatch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  margin-bottom: 0.75rem;
  transition: background 0.2s ease;
}

.style-settings__swatch-pair {
  display: flex;
  gap: 0;
  margin-bottom: 0.75rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.style-settings__swatch--half {
  flex: 1;
  border: none;
  border-radius: 0;
  margin-bottom: 0;
}

.style-settings__swatch-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  opacity: 0.5;
}

.style-settings__swatch-text {
  font-size: 1.25rem;
  font-weight: var(--font-semibold);
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
}

.style-settings__swatch-accent {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(128, 128, 128, 0.15);
  transition: background 0.2s ease;
}

/* ===== Colors ===== */
.style-settings__color-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.style-settings__color-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.style-settings__color-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.style-settings__color-input {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2px;
  cursor: pointer;
  background: none;
  box-shadow: var(--shadow-xs);
}

.style-settings__color-text {
  width: 80px;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
}

.style-settings__color-text:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

/* ===== Reset ===== */
.style-settings__reset-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.style-settings__reset-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-text);
}

/* ===== Form fields ===== */
.style-settings__field {
  margin-bottom: 0.75rem;
}

.style-settings__label {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.style-settings__select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--color-surface);
}

.style-settings__select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.style-settings__input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.style-settings__input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.style-settings__slug-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.style-settings__slug-prefix {
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  background: var(--color-gray-100);
  border: 1px solid var(--color-border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.style-settings__slug-row .style-settings__input {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.style-settings__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-base);
  color: var(--color-text);
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.style-settings__checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
</style>
