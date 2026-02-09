<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import type { CardFormData } from '@/composables/useCardForm';

const FONT_MAP: Record<string, { family: string; url: string }> = {
  'dm-serif':  { family: "'DM Serif Display', Georgia, serif", url: 'DM+Serif+Display' },
  'playfair':  { family: "'Playfair Display', Georgia, serif", url: 'Playfair+Display:wght@400;700' },
  'inter':     { family: "'Inter', -apple-system, sans-serif", url: 'Inter:wght@400;500;600;700' },
  'poppins':   { family: "'Poppins', -apple-system, sans-serif", url: 'Poppins:wght@400;500;600' },
  'cormorant': { family: "'Cormorant Garamond', Georgia, serif", url: 'Cormorant+Garamond:wght@400;600' },
  'sora':      { family: "'Sora', -apple-system, sans-serif", url: 'Sora:wght@400;500;600' },
  'fraunces':  { family: "'Fraunces', Georgia, serif", url: 'Fraunces:wght@400;700' },
  'bricolage': { family: "'Bricolage Grotesque', -apple-system, sans-serif", url: 'Bricolage+Grotesque:wght@400;600;700' },
};

const DEFAULT_DISPLAY_FONT = "'DM Serif Display', Georgia, serif";

const props = defineProps<{
  form: CardFormData;
  avatarUrl: string | null;
  bannerUrl: string | null;
  backgroundUrl: string | null;
}>();

const bgColor = computed(() => props.form.bgColor || '#ffffff');
const primaryColor = computed(() => props.form.primaryColor || '#0066cc');
const textColor = computed(() => props.form.textColor || '#111111');

const displayFont = computed(() => {
  const id = props.form.fontFamily;
  if (!id || !FONT_MAP[id]) return DEFAULT_DISPLAY_FONT;
  return FONT_MAP[id].family;
});

function loadGoogleFont(fontId: string) {
  if (!fontId || !FONT_MAP[fontId]) return;
  const linkId = `gfont-${fontId}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${FONT_MAP[fontId].url}&display=swap`;
  document.head.appendChild(link);
}

watch(() => props.form.fontFamily, (id) => {
  if (id) loadGoogleFont(id);
}, { immediate: true });

onMounted(() => {
  if (props.form.fontFamily) loadGoogleFont(props.form.fontFamily);
});

const cardStyle = computed(() => {
  const s: Record<string, string> = {
    '--p-bg': bgColor.value,
    '--p-primary': primaryColor.value,
    '--p-text': textColor.value,
    '--p-font-display': displayFont.value,
  };
  if (props.backgroundUrl) {
    s.backgroundImage = `url("${props.backgroundUrl}")`;
    s.backgroundSize = 'cover';
    s.backgroundPosition = 'center';
  }
  return s;
});

const avatarShapeClass = computed(() =>
  props.form.avatarShape === 'ROUNDED_SQUARE' ? 'rounded-square' : 'circle',
);

const isDark = computed(() => props.form.theme === 'DARK');

const hasAddress = computed(() =>
  props.form.address.street || props.form.address.city || props.form.address.country || props.form.address.zip,
);

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
  <div class="card" :class="{ 'card--dark': isDark }" :style="cardStyle">
    <!-- Banner -->
    <div class="card__banner">
      <img v-if="bannerUrl" :src="bannerUrl" alt="Banner" />
    </div>

    <!-- Profile -->
    <div class="card__profile">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="form.name"
        class="card__avatar"
        :class="avatarShapeClass"
      />
      <div v-else-if="form.name" class="card__avatar-ph" :class="avatarShapeClass">
        {{ form.name.charAt(0).toUpperCase() }}
      </div>

      <h2 v-if="form.name" class="card__name">{{ form.name }}</h2>

      <p v-if="form.jobTitle" class="card__role">
        {{ form.jobTitle }}<template v-if="form.company"> <span class="card__role-dot">&middot;</span> <strong>{{ form.company }}</strong></template>
      </p>
      <p v-else-if="form.company" class="card__role"><strong>{{ form.company }}</strong></p>

      <p v-if="form.bio" class="card__bio">{{ form.bio }}</p>
    </div>

    <!-- Phones -->
    <template v-if="form.phones.length">
      <div class="card__divider" />
      <div class="card__section">
        <div v-for="(phone, i) in form.phones" :key="'p'+i" class="card__contact">
          <span class="card__contact-label">{{ phone.label || 'Phone' }}</span>
          <span class="card__contact-value">{{ phone.number }}</span>
        </div>
      </div>
    </template>

    <!-- Emails -->
    <template v-if="form.emails.length">
      <div v-if="!form.phones.length" class="card__divider" />
      <div class="card__section">
        <div v-for="(email, i) in form.emails" :key="'e'+i" class="card__contact">
          <span class="card__contact-label">{{ email.label || 'Email' }}</span>
          <span class="card__contact-value">{{ email.email }}</span>
        </div>
      </div>
    </template>

    <!-- Websites -->
    <template v-if="form.websites.length">
      <div class="card__divider" />
      <div class="card__section">
        <div v-for="(site, i) in form.websites" :key="'w'+i" class="card__contact">
          <span class="card__contact-label">{{ site.label || 'Website' }}</span>
          <span class="card__contact-value card__contact-value--link">
            {{ site.url }}
            <svg class="card__website-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </span>
        </div>
      </div>
    </template>

    <!-- Address -->
    <template v-if="hasAddress">
      <div class="card__divider" />
      <div class="card__section">
        <div class="card__contact">
          <span class="card__contact-label">Address</span>
          <span class="card__address">
            <template v-if="form.address.street">{{ form.address.street }}<br /></template>
            <template v-if="form.address.city">{{ form.address.city }}</template><template v-if="form.address.zip"> {{ form.address.zip }}</template>
            <template v-if="form.address.country"><br />{{ form.address.country }}</template>
          </span>
        </div>
      </div>
    </template>

    <!-- Social Links -->
    <template v-if="form.socialLinks.length">
      <div class="card__divider" />
      <div class="card__socials">
        <span
          v-for="(link, i) in form.socialLinks"
          :key="'s'+i"
          class="card__social"
        >
          {{ platformLabels[link.platform] || link.platform }}
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  --p-bg: #ffffff;
  --p-primary: #0066cc;
  --p-text: #111111;
  --p-font-display: 'DM Serif Display', Georgia, serif;
  --p-text-secondary: color-mix(in srgb, var(--p-text) 65%, white);
  --p-text-tertiary: color-mix(in srgb, var(--p-text) 45%, white);
  --p-divider: color-mix(in srgb, var(--p-text) 10%, white);
  --p-primary-soft: color-mix(in srgb, var(--p-primary) 10%, white);

  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  color: var(--p-text);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.03),
    0 2px 4px rgba(0,0,0,0.02),
    0 8px 24px rgba(0,0,0,0.06),
    0 24px 48px rgba(0,0,0,0.04);
}

.card--dark {
  background: #1e1e1e;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.06),
    0 8px 24px rgba(0,0,0,0.3),
    0 24px 48px rgba(0,0,0,0.2);
}

/* ===== Banner ===== */
.card__banner {
  width: 100%;
  height: 140px;
  background: linear-gradient(135deg, var(--p-primary), color-mix(in srgb, var(--p-primary) 70%, black));
  overflow: hidden;
  position: relative;
}

.card__banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card__banner::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(to top, rgba(0,0,0,0.12), transparent);
  pointer-events: none;
}

/* ===== Profile ===== */
.card__profile {
  padding: 0 24px 24px;
  text-align: center;
  margin-top: -40px;
  position: relative;
  z-index: 1;
}

.card__avatar {
  width: 80px;
  height: 80px;
  border: 3px solid white;
  object-fit: cover;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card--dark .card__avatar,
.card--dark .card__avatar-ph {
  border-color: #1e1e1e;
}

.card__avatar.circle { border-radius: 50%; }
.card__avatar.rounded-square { border-radius: 16px; }

.card__avatar-ph {
  width: 80px;
  height: 80px;
  border: 3px solid white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--p-primary), color-mix(in srgb, var(--p-primary) 70%, black));
  color: white;
  font-family: var(--p-font-display);
  font-size: 32px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card__avatar-ph.circle { border-radius: 50%; }
.card__avatar-ph.rounded-square { border-radius: 16px; }

.card__name {
  font-family: var(--p-font-display);
  font-size: 22px;
  font-weight: 400;
  margin-top: 12px;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.card__role {
  font-size: 13px;
  font-weight: 400;
  color: var(--p-text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.card__role strong {
  font-weight: 500;
  color: var(--p-text);
}

.card__role-dot {
  opacity: 0.4;
}

.card__bio {
  font-size: 12px;
  line-height: 1.6;
  color: var(--p-text-secondary);
  margin-top: 12px;
  font-weight: 400;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

/* ===== Dividers & Sections ===== */
.card__divider {
  height: 1px;
  background: var(--p-divider);
  margin: 0 24px 20px;
}

.card__section {
  padding: 0 24px;
  margin-bottom: 20px;
}

.card__section-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  font-weight: 600;
  color: var(--p-text-tertiary);
  margin: 0 0 8px 2px;
}

/* ===== Contact rows ===== */
.card__contact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 0 -12px;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.card__contact:hover {
  background: var(--p-primary-soft);
}

.card__contact-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 500;
  color: var(--p-text-tertiary);
  flex-shrink: 0;
}

.card__contact-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--p-primary);
  text-align: right;
  word-break: break-all;
}

.card__contact-value--link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  word-break: break-all;
}

.card__website-icon {
  flex-shrink: 0;
  opacity: 0.4;
}

/* ===== Address ===== */
.card__address {
  font-size: 12px;
  color: var(--p-text-secondary);
  line-height: 1.6;
  font-weight: 400;
  text-align: right;
}

/* ===== Social links ===== */
.card__socials {
  padding: 0 24px;
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.card__social {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid var(--p-divider);
  background: transparent;
  color: var(--p-text-secondary);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: capitalize;
  transition: all 0.2s ease;
}

.card__social:hover {
  border-color: var(--p-primary);
  color: var(--p-primary);
  background: var(--p-primary-soft);
}
</style>
