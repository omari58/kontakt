<script setup lang="ts">
import type { AvatarShape, Theme, Visibility } from '@/types';

defineProps<{
  bgColor: string;
  primaryColor: string;
  textColor: string;
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
  'update:avatarShape': [value: AvatarShape];
  'update:theme': [value: Theme];
  'update:visibility': [value: Visibility];
  'update:noIndex': [value: boolean];
  'update:obfuscate': [value: boolean];
  'update:slug': [value: string];
}>();
</script>

<template>
  <div class="style-settings">
    <fieldset class="style-settings__group">
      <legend class="style-settings__legend">Appearance</legend>

      <div class="style-settings__color-row">
        <label class="style-settings__color-label">
          Primary Color
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

        <label class="style-settings__color-label">
          Background Color
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
          Text Color
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
      </div>

      <div class="style-settings__field">
        <label class="style-settings__label">Theme Mode</label>
        <select
          :value="theme"
          class="style-settings__select"
          @change="emit('update:theme', ($event.target as HTMLSelectElement).value as Theme)"
        >
          <option value="LIGHT">Light</option>
          <option value="DARK">Dark</option>
          <option value="AUTO">Auto</option>
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
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.style-settings__legend {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0 0.5rem;
  color: #333;
}

.style-settings__color-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.style-settings__color-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #555;
}

.style-settings__color-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.style-settings__color-input {
  width: 36px;
  height: 36px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  padding: 2px;
  cursor: pointer;
  background: none;
}

.style-settings__color-text {
  width: 80px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-family: monospace;
}

.style-settings__color-text:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.style-settings__field {
  margin-bottom: 0.75rem;
}

.style-settings__label {
  display: block;
  font-size: 0.8125rem;
  color: #555;
  margin-bottom: 0.25rem;
}

.style-settings__select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
  background: #fff;
}

.style-settings__select:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.style-settings__input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.style-settings__input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.style-settings__slug-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.style-settings__slug-prefix {
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  background: #f5f5f5;
  border: 1px solid #d0d0d0;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 0.875rem;
  color: #666;
}

.style-settings__slug-row .style-settings__input {
  border-radius: 0 4px 4px 0;
}

.style-settings__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #333;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.style-settings__checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
</style>
