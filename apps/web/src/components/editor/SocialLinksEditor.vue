<script setup lang="ts">
import { X, Plus } from 'lucide-vue-next';
import type { SocialLink, Website } from '@/types';

defineProps<{
  socialLinks: SocialLink[];
  websites: Website[];
  fieldErrors?: Record<string, string[]>;
}>();

const emit = defineEmits<{
  addSocialLink: [];
  removeSocialLink: [index: number];
  addWebsite: [];
  removeWebsite: [index: number];
}>();

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'x', label: 'X' },
  { value: 'github', label: 'GitHub' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'signal', label: 'Signal' },
  { value: 'discord', label: 'Discord' },
  { value: 'slack', label: 'Slack' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'dribbble', label: 'Dribbble' },
  { value: 'behance', label: 'Behance' },
  { value: 'medium', label: 'Medium' },
  { value: 'dev', label: 'Dev.to' },
  { value: 'stackoverflow', label: 'Stack Overflow' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'mastodon', label: 'Mastodon' },
  { value: 'threads', label: 'Threads' },
  { value: 'bluesky', label: 'Bluesky' },
];
</script>

<template>
  <div class="social-editor">
    <fieldset class="social-editor__group">
      <legend class="social-editor__legend">{{ $t('editor.webSocial.websites') }}</legend>
      <div
        v-for="(site, index) in websites"
        :key="index"
        class="social-editor__row"
      >
        <input
          v-model="site.label"
          type="text"
          :placeholder="$t('editor.webSocial.label')"
          class="social-editor__label-input"
        />
        <input
          v-model="site.url"
          type="url"
          placeholder="https://example.com"
          class="social-editor__input"
          :class="{ 'social-editor__input--error': fieldErrors?.websites }"
        />
        <button
          type="button"
          class="social-editor__remove-btn"
          @click="emit('removeWebsite', index)"
        >
          <X :size="14" />
        </button>
      </div>
      <p v-if="fieldErrors?.websites" class="social-editor__field-error">
        {{ fieldErrors.websites[0] }}
      </p>
      <button
        type="button"
        class="social-editor__add-btn"
        @click="emit('addWebsite')"
      >
        <Plus :size="14" /> {{ $t('editor.webSocial.addWebsite') }}
      </button>
    </fieldset>

    <fieldset class="social-editor__group">
      <legend class="social-editor__legend">{{ $t('editor.webSocial.socialLinks') }}</legend>
      <div
        v-for="(link, index) in socialLinks"
        :key="index"
        class="social-editor__row"
      >
        <select
          v-model="link.platform"
          class="social-editor__select"
        >
          <option
            v-for="opt in platformOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <input
          v-model="link.url"
          type="url"
          placeholder="https://..."
          class="social-editor__input"
          :class="{ 'social-editor__input--error': fieldErrors?.socialLinks }"
        />
        <button
          type="button"
          class="social-editor__remove-btn"
          @click="emit('removeSocialLink', index)"
        >
          <X :size="14" />
        </button>
      </div>
      <p v-if="fieldErrors?.socialLinks" class="social-editor__field-error">
        {{ fieldErrors.socialLinks[0] }}
      </p>
      <button
        type="button"
        class="social-editor__add-btn"
        @click="emit('addSocialLink')"
      >
        <Plus :size="14" /> {{ $t('editor.webSocial.addSocialLink') }}
      </button>
    </fieldset>
  </div>
</template>

<style scoped>
.social-editor__group {
  border: none;
  padding: 0;
  margin-bottom: var(--space-4);
}

.social-editor__legend {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  padding: 0;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.social-editor__row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  align-items: center;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.social-editor__label-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  width: 100px;
  flex-shrink: 0;
}

.social-editor__label-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.social-editor__input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  flex: 1;
}

.social-editor__input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.social-editor__select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  min-width: 140px;
  background: var(--color-surface);
}

.social-editor__select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.social-editor__add-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: var(--text-sm);
  cursor: pointer;
  color: var(--color-primary-600);
  margin-top: 0.25rem;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.social-editor__add-btn:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
}

.social-editor__remove-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.social-editor__remove-btn:hover {
  color: var(--color-error-500);
  background: var(--color-error-50);
}

.social-editor__input--error {
  border-color: var(--color-error-500);
}

.social-editor__input--error:focus {
  border-color: var(--color-error-500);
  box-shadow: 0 0 0 3px var(--color-error-50);
}

.social-editor__field-error {
  color: var(--color-error-700);
  font-size: var(--text-sm);
  margin: var(--space-2) 0 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-error-50);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-error-500);
}
</style>
