<script setup lang="ts">
import type { SocialLink } from '@/types';

defineProps<{
  socialLinks: SocialLink[];
  websites: string[];
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
      <legend class="social-editor__legend">Websites</legend>
      <div
        v-for="(_, index) in websites"
        :key="index"
        class="social-editor__row"
      >
        <input
          v-model="websites[index]"
          type="url"
          placeholder="https://example.com"
          class="social-editor__input"
        />
        <button
          type="button"
          class="social-editor__remove-btn"
          @click="emit('removeWebsite', index)"
        >
          Remove
        </button>
      </div>
      <button
        type="button"
        class="social-editor__add-btn"
        @click="emit('addWebsite')"
      >
        + Add Website
      </button>
    </fieldset>

    <fieldset class="social-editor__group">
      <legend class="social-editor__legend">Social Links</legend>
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
        />
        <button
          type="button"
          class="social-editor__remove-btn"
          @click="emit('removeSocialLink', index)"
        >
          Remove
        </button>
      </div>
      <button
        type="button"
        class="social-editor__add-btn"
        @click="emit('addSocialLink')"
      >
        + Add Social Link
      </button>
    </fieldset>
  </div>
</template>

<style scoped>
.social-editor__group {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.social-editor__legend {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0 0.5rem;
  color: #333;
}

.social-editor__row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.social-editor__input {
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
  flex: 1;
}

.social-editor__input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.social-editor__select {
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 140px;
  background: #fff;
}

.social-editor__select:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.social-editor__add-btn {
  padding: 0.375rem 0.75rem;
  border: 1px dashed #d0d0d0;
  border-radius: 4px;
  background: transparent;
  font-size: 0.8125rem;
  cursor: pointer;
  color: #0066cc;
  margin-top: 0.25rem;
}

.social-editor__add-btn:hover {
  background: #f0f7ff;
  border-color: #0066cc;
}

.social-editor__remove-btn {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d32f2f;
  border-radius: 4px;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
  color: #d32f2f;
  flex-shrink: 0;
}

.social-editor__remove-btn:hover {
  background: #fce4ec;
}
</style>
