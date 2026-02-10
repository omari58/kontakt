<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import QRCodeStyling from 'qr-code-styling';
import { useSettingsStore } from '@/stores/settings';
import type { Card } from '@/types';
import { Download, X } from 'lucide-vue-next';

type QrContent = 'card-url' | 'vcard-url' | 'vcard-inline';

const props = defineProps<{
  card: Card;
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const settingsStore = useSettingsStore();

const qrContainer = ref<HTMLDivElement | null>(null);
const dialogEl = ref<HTMLDivElement | null>(null);
const qrContent = ref<QrContent>('card-url');
const showLogo = ref(true);
const faviconDataUrl = ref<string | undefined>(undefined);

let qrCode: QRCodeStyling | null = null;

const hasFavicon = computed(() => !!settingsStore.settings.org_favicon);

async function loadFaviconDataUrl(url: string) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return;
    const blob = await res.blob();
    faviconDataUrl.value = URL.createObjectURL(blob);
  } catch {
    faviconDataUrl.value = undefined;
  }
}

const cardUrl = computed(() => `${window.location.origin}/c/${props.card.slug}`);
const vcardUrl = computed(() => `${window.location.origin}/api/cards/${props.card.slug}/vcf`);

function buildMinimalVcard(): string {
  const card = props.card;
  const parts = card.name.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.slice(-1)[0] : card.name;
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${lastName};${firstName};;;`);
  lines.push(`FN:${card.name}`);
  if (card.jobTitle) lines.push(`TITLE:${card.jobTitle}`);
  if (card.company) lines.push(`ORG:${card.company}`);
  if (card.emails?.length) lines.push(`EMAIL:${card.emails[0].email}`);
  if (card.phones?.length) lines.push(`TEL:${card.phones[0].number}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

const qrData = computed(() => {
  switch (qrContent.value) {
    case 'card-url':
      return cardUrl.value;
    case 'vcard-url':
      return vcardUrl.value;
    case 'vcard-inline':
      return buildMinimalVcard();
    default:
      return cardUrl.value;
  }
});

const qrImage = computed(() => {
  if (showLogo.value && hasFavicon.value && faviconDataUrl.value) {
    return faviconDataUrl.value;
  }
  return undefined;
});

function clearContainer() {
  if (!qrContainer.value) return;
  while (qrContainer.value.firstChild) {
    qrContainer.value.removeChild(qrContainer.value.firstChild);
  }
}

function createQrCode() {
  qrCode = new QRCodeStyling({
    width: 280,
    height: 280,
    data: qrData.value,
    image: qrImage.value,
    dotsOptions: {
      color: '#000000',
      type: 'rounded',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.3,
      margin: 4,
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
    },
  });
}

function renderQr() {
  if (!qrContainer.value) return;
  clearContainer();
  if (!qrCode) createQrCode();
  qrCode!.append(qrContainer.value);
}

function handleDownload(ext: 'png' | 'svg') {
  qrCode?.download({ name: `${props.card.slug}-qr`, extension: ext });
}

function handleClose() {
  emit('close');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose();
  }
}

watch(() => settingsStore.settings.org_favicon, (url) => {
  if (url) loadFaviconDataUrl(url);
}, { immediate: true });

watch([qrData, qrImage], () => {
  if (qrCode && props.visible) {
    qrCode.update({ data: qrData.value, image: qrImage.value });
  }
});

watch(() => props.visible, async (visible) => {
  if (visible) {
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    if (!qrCode) {
      createQrCode();
    } else {
      qrCode.update({ data: qrData.value, image: qrImage.value });
    }
    renderQr();
    dialogEl.value?.focus();
  } else {
    document.removeEventListener('keydown', onKeydown);
    clearContainer();
  }
});

onMounted(() => {
  if (props.visible) {
    document.addEventListener('keydown', onKeydown);
    createQrCode();
    nextTick(() => {
      renderQr();
      dialogEl.value?.focus();
    });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="qr-modal__overlay" @click.self="handleClose">
      <div
        ref="dialogEl"
        class="qr-modal__dialog"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="qr-modal__header">
          <h2 class="qr-modal__title">{{ $t('qrModal.title') }}</h2>
          <button class="qr-modal__close-btn" @click="handleClose" :aria-label="$t('common.cancel')">
            <X :size="18" />
          </button>
        </div>

        <div class="qr-modal__body">
          <div ref="qrContainer" class="qr-modal__preview" />

          <p v-if="qrContent === 'vcard-inline'" class="qr-modal__hint">
            {{ $t('qrModal.vcardInlineHint') }}
          </p>

          <fieldset class="qr-modal__fieldset">
            <legend class="qr-modal__legend">{{ $t('qrModal.contentLabel') }}</legend>
            <label class="qr-modal__radio">
              <input
                v-model="qrContent"
                type="radio"
                name="qr-content"
                value="card-url"
              />
              <span>{{ $t('qrModal.cardUrl') }}</span>
            </label>
            <label class="qr-modal__radio">
              <input
                v-model="qrContent"
                type="radio"
                name="qr-content"
                value="vcard-url"
              />
              <span>{{ $t('qrModal.vcardUrl') }}</span>
            </label>
            <label class="qr-modal__radio">
              <input
                v-model="qrContent"
                type="radio"
                name="qr-content"
                value="vcard-inline"
              />
              <span>{{ $t('qrModal.vcardInline') }}</span>
            </label>
          </fieldset>

          <label v-if="hasFavicon" class="qr-modal__checkbox">
            <input v-model="showLogo" type="checkbox" />
            <span>{{ $t('qrModal.showLogo') }}</span>
          </label>
        </div>

        <div class="qr-modal__footer">
          <button class="qr-modal__download-btn" @click="handleDownload('png')">
            <Download :size="16" />
            PNG
          </button>
          <button class="qr-modal__download-btn qr-modal__download-btn--secondary" @click="handleDownload('svg')">
            <Download :size="16" />
            SVG
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.qr-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.qr-modal__dialog {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-xl);
  outline: none;
}

.qr-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.qr-modal__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0;
}

.qr-modal__close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

.qr-modal__close-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.qr-modal__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.qr-modal__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  min-width: 280px;
}

.qr-modal__hint {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  text-align: center;
  margin: 0;
  width: 100%;
}

.qr-modal__fieldset {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  margin: 0;
  width: 100%;
}

.qr-modal__legend {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  padding: 0 var(--space-1);
}

.qr-modal__radio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.qr-modal__radio input[type="radio"] {
  accent-color: var(--color-primary-600);
}

.qr-modal__checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  width: 100%;
}

.qr-modal__checkbox input[type="checkbox"] {
  accent-color: var(--color-primary-600);
}

.qr-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.qr-modal__download-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  background: var(--color-primary-600);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
}

.qr-modal__download-btn:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-sm);
}

.qr-modal__download-btn:active {
  transform: scale(0.97);
}

.qr-modal__download-btn--secondary {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.qr-modal__download-btn--secondary:hover {
  background: var(--color-border);
}

/* Modal transition */
.modal-enter-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.modal-enter-active .qr-modal__dialog {
  transition: transform var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}
.modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .qr-modal__dialog {
  opacity: 0;
  transform: scale(0.95);
}
.modal-leave-to {
  opacity: 0;
}
</style>
