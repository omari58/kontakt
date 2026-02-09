<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Card } from '@/types';
import { ExternalLink, Copy, Check, Trash2, QrCode } from 'lucide-vue-next';

const props = defineProps<{
  card: Card;
}>();

const emit = defineEmits<{
  edit: [id: string];
  delete: [id: string];
}>();

const fullUrl = computed(() => `${window.location.origin}/c/${props.card.slug}`);
const copied = ref(false);

const bannerStyle = computed(() => {
  if (props.card.bannerPath) {
    return { backgroundImage: `url("${props.card.bannerPath}")` };
  }
  return {
    background: `linear-gradient(135deg, ${props.card.primaryColor || 'var(--color-primary-400)'}, ${props.card.bgColor || 'var(--color-primary-600)'})`,
  };
});

const avatarShape = computed(() =>
  props.card.avatarShape === 'ROUNDED_SQUARE' ? 'card-item__avatar--square' : '',
);

async function copyLink() {
  try {
    await navigator.clipboard.writeText(fullUrl.value);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = fullUrl.value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

async function downloadQr() {
  const res = await fetch(`/api/cards/${props.card.slug}/qr?format=png&size=500`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.card.slug}-qr.png`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="card-item">
    <!-- Mini card preview (click to edit) -->
    <div class="card-item__preview" @click="emit('edit', card.id)">
      <div class="card-item__banner" :style="bannerStyle" />
      <div class="card-item__avatar-wrap">
        <img
          v-if="card.avatarPath"
          :src="card.avatarPath"
          :alt="card.name"
          class="card-item__avatar"
          :class="avatarShape"
        />
        <div v-else class="card-item__avatar card-item__avatar--placeholder" :class="avatarShape">
          {{ card.name.charAt(0).toUpperCase() }}
        </div>
      </div>
      <div class="card-item__preview-info">
        <h3 class="card-item__name">{{ card.name }}</h3>
        <p v-if="card.jobTitle" class="card-item__job">{{ card.jobTitle }}</p>
        <p v-if="card.company" class="card-item__company">{{ card.company }}</p>
      </div>
    </div>

    <!-- Footer with URL + actions -->
    <div class="card-item__footer">
      <button class="card-item__url" :title="$t('cardList.copyUrl')" @click="copyLink">
        <span class="card-item__url-text">/c/{{ card.slug }}</span>
        <Check v-if="copied" :size="12" class="card-item__url-icon card-item__url-icon--copied" />
        <Copy v-else :size="12" class="card-item__url-icon" />
      </button>
      <div class="card-item__actions">
        <button
          class="card-item__btn"
          :title="$t('cardList.downloadQr')"
          @click="downloadQr"
        >
          <QrCode :size="14" />
        </button>
        <a
          :href="`/c/${card.slug}`"
          target="_blank"
          rel="noopener"
          class="card-item__btn"
          :title="$t('cardList.open')"
        >
          <ExternalLink :size="14" />
        </a>
        <button
          class="card-item__btn card-item__btn--delete"
          :title="$t('common.delete')"
          @click="emit('delete', card.id)"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  transition: box-shadow var(--duration-normal) var(--ease-default),
              border-color var(--duration-normal) var(--ease-default),
              transform var(--duration-normal) var(--ease-default);
}

.card-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
}

/* ===== Preview area ===== */
.card-item__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: var(--space-4);
  cursor: pointer;
}

.card-item__banner {
  width: 100%;
  height: 80px;
  background-size: cover;
  background-position: center;
}

.card-item__avatar-wrap {
  margin-top: -28px;
}

.card-item__avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 3px solid var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-item__avatar--square {
  border-radius: 12px;
}

.card-item__avatar--placeholder {
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  color: #fff;
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
}

.card-item__preview-info {
  text-align: center;
  padding: var(--space-2) var(--space-4) 0;
}

.card-item__name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0;
}

.card-item__job {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 2px 0 0;
}

.card-item__company {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 1px 0 0;
}

/* ===== Footer ===== */
.card-item__footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
}

.card-item__url {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: color var(--duration-fast) var(--ease-default);
}

.card-item__url:hover {
  color: var(--color-primary-600);
}

.card-item__url-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-item__url-icon {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.card-item__url:hover .card-item__url-icon,
.card-item__url-icon--copied {
  opacity: 1;
}

.card-item__url-icon--copied {
  color: var(--color-success-500);
}

/* ===== Action buttons ===== */
.card-item__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.card-item__btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

.card-item__btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.card-item__btn:active {
  transform: scale(0.95);
}

.card-item__btn--delete:hover {
  color: var(--color-error-500);
  background: var(--color-error-50);
}
</style>
