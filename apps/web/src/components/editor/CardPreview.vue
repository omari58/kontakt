<script setup lang="ts">
import { computed } from 'vue';
import type { CardFormData } from '@/composables/useCardForm';

const props = defineProps<{
  form: CardFormData;
  avatarUrl: string | null;
  bannerUrl: string | null;
  backgroundUrl: string | null;
}>();

const cardStyle = computed(() => ({
  backgroundColor: props.form.bgColor || '#ffffff',
  color: props.form.textColor || '#111111',
  backgroundImage: props.backgroundUrl ? `url(${props.backgroundUrl})` : undefined,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

const accentColor = computed(() => props.form.primaryColor || '#0066cc');

const avatarClass = computed(() =>
  props.form.avatarShape === 'ROUNDED_SQUARE' ? 'preview__avatar--rounded-square' : 'preview__avatar--circle',
);

const themeClass = computed(() => {
  if (props.form.theme === 'DARK') return 'preview--dark';
  return '';
});

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn', twitter: 'Twitter', x: 'X', github: 'GitHub',
  instagram: 'Instagram', facebook: 'Facebook', whatsapp: 'WhatsApp',
  telegram: 'Telegram', youtube: 'YouTube', tiktok: 'TikTok',
  snapchat: 'Snapchat', signal: 'Signal', discord: 'Discord',
  slack: 'Slack', reddit: 'Reddit', pinterest: 'Pinterest',
  dribbble: 'Dribbble', behance: 'Behance', medium: 'Medium',
  dev: 'Dev.to', stackoverflow: 'Stack Overflow', twitch: 'Twitch',
  spotify: 'Spotify', soundcloud: 'SoundCloud', bandcamp: 'Bandcamp',
  mastodon: 'Mastodon', threads: 'Threads', bluesky: 'Bluesky',
};
</script>

<template>
  <div class="preview" :class="themeClass" :style="cardStyle">
    <div v-if="bannerUrl" class="preview__banner">
      <img :src="bannerUrl" alt="Banner" class="preview__banner-img" />
    </div>

    <div class="preview__content">
      <div v-if="avatarUrl" class="preview__avatar" :class="avatarClass">
        <img :src="avatarUrl" alt="Avatar" class="preview__avatar-img" />
      </div>
      <div v-else-if="form.name" class="preview__avatar-placeholder" :class="avatarClass" :style="{ backgroundColor: accentColor }">
        {{ form.name.charAt(0).toUpperCase() }}
      </div>

      <h2 v-if="form.name" class="preview__name">{{ form.name }}</h2>
      <p v-if="form.jobTitle" class="preview__job">{{ form.jobTitle }}</p>
      <p v-if="form.company" class="preview__company">{{ form.company }}</p>

      <p v-if="form.bio" class="preview__bio">{{ form.bio }}</p>

      <div v-if="form.phones.length" class="preview__section">
        <div
          v-for="(phone, i) in form.phones"
          :key="i"
          class="preview__item"
        >
          <span class="preview__item-label">{{ phone.label || 'Phone' }}</span>
          <span>{{ phone.number }}</span>
        </div>
      </div>

      <div v-if="form.emails.length" class="preview__section">
        <div
          v-for="(email, i) in form.emails"
          :key="i"
          class="preview__item"
        >
          <span class="preview__item-label">{{ email.label || 'Email' }}</span>
          <span>{{ email.email }}</span>
        </div>
      </div>

      <div
        v-if="form.address.street || form.address.city || form.address.country || form.address.zip"
        class="preview__section"
      >
        <div class="preview__item">
          <span class="preview__item-label">Address</span>
          <span>
            {{ [form.address.street, form.address.city, form.address.zip, form.address.country].filter(Boolean).join(', ') }}
          </span>
        </div>
      </div>

      <div v-if="form.websites.length" class="preview__section">
        <div
          v-for="(url, i) in form.websites"
          :key="i"
          class="preview__item"
        >
          <a :href="url" :style="{ color: accentColor }" class="preview__link">{{ url }}</a>
        </div>
      </div>

      <div v-if="form.socialLinks.length" class="preview__socials">
        <a
          v-for="(link, i) in form.socialLinks"
          :key="i"
          :href="link.url"
          class="preview__social-link"
          :style="{ borderColor: accentColor, color: accentColor }"
        >
          {{ platformLabels[link.platform] || link.platform }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  max-width: 400px;
  margin: 0 auto;
  font-size: 0.875rem;
}

.preview--dark {
  color: #f0f0f0;
}

.preview__banner {
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.preview__banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview__content {
  padding: 1.5rem;
}

.preview__avatar,
.preview__avatar-placeholder {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  overflow: hidden;
}

.preview__avatar--circle,
.preview__avatar--circle .preview__avatar-img {
  border-radius: 50%;
}

.preview__avatar--rounded-square,
.preview__avatar--rounded-square .preview__avatar-img {
  border-radius: 16px;
}

.preview__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview__avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.preview__name {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.preview__job {
  text-align: center;
  margin: 0 0 0.125rem;
  opacity: 0.8;
}

.preview__company {
  text-align: center;
  margin: 0 0 0.75rem;
  opacity: 0.6;
  font-size: 0.8125rem;
}

.preview__bio {
  text-align: center;
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  opacity: 0.8;
}

.preview__section {
  margin-bottom: 0.75rem;
}

.preview__item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.8125rem;
}

.preview__item-label {
  font-weight: 600;
  min-width: 50px;
}

.preview__link {
  text-decoration: none;
  word-break: break-all;
  font-size: 0.8125rem;
}

.preview__link:hover {
  text-decoration: underline;
}

.preview__socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.preview__social-link {
  padding: 0.375rem 0.75rem;
  border: 1px solid;
  border-radius: 20px;
  font-size: 0.75rem;
  text-decoration: none;
}

.preview__social-link:hover {
  opacity: 0.8;
}
</style>
