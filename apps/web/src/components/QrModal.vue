<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import QRCodeStyling from 'qr-code-styling';
import { useSettingsStore } from '@/stores/settings';
import { useToast } from '@/composables/useToast';
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
const { show: showToast } = useToast();

const qrContainer = ref<HTMLDivElement | null>(null);
const dialogEl = ref<HTMLDivElement | null>(null);
const qrContent = ref<QrContent>('card-url');
const showLogo = ref(true);
const vcardText = ref<string | null>(null);
const vcardLoading = ref(false);

let qrCode: QRCodeStyling | null = null;

const hasFavicon = computed(() => !!settingsStore.settings.org_favicon);

const cardUrl = computed(() => `${window.location.origin}/c/${props.card.slug}`);
const vcardUrl = computed(() => `${window.location.origin}/api/cards/${props.card.slug}/vcf`);

const qrData = computed(() => {
  switch (qrContent.value) {
    case 'card-url':
      return cardUrl.value;
    case 'vcard-url':
      return vcardUrl.value;
    case 'vcard-inline':
      return vcardText.value ?? cardUrl.value;
    default:
      return cardUrl.value;
  }
});

const qrImage = computed(() => {
  if (showLogo.value && hasFavicon.value) {
    return settingsStore.settings.org_favicon!;
  }
  return undefined;
});

const vcardTooLarge = computed(() => {
  return qrContent.value === 'vcard-inline' && vcardText.value != null && vcardText.value.length > 2900;
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

async function fetchVcard() {
  if (vcardText.value != null) return;
  vcardLoading.value = true;
  try {
    const response = await fetch(`/api/cards/${props.card.slug}/vcf`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('fetch failed');
    vcardText.value = await response.text();
  } catch {
    showToast(t('qrModal.vcardFetchError'), 'error');
    qrContent.value = 'card-url';
  } finally {
    vcardLoading.value = false;
  }
}

function handleDownload() {
  qrCode?.download({ name: `${props.card.slug}-qr`, extension: 'png' });
}

function handleClose() {
  emit('close');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose();
  }
}

watch(() => qrContent.value, (mode) => {
  if (mode === 'vcard-inline') {
    fetchVcard();
  }
});

watch([qrData, qrImage], () => {
  if (qrCode && props.visible) {
    qrCode.update({
      data: qrData.value,
      image: qrImage.value,
    });
  }
});

watch(() => props.visible, async (visible) => {
  if (visible) {
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    if (!qrCode) {
      createQrCode();
    } else {
      qrCode.update({
        data: qrData.value,
        image: qrImage.value,
      });
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

          <div v-if="vcardTooLarge" class="qr-modal__warning">
            {{ $t('qrModal.vcardTooLarge') }}
          </div>

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
          <button class="qr-modal__download-btn" @click="handleDownload">
            <Download :size="16" />
            {{ $t('qrModal.download') }}
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

.qr-modal__warning {
  background: var(--color-warning-50, #fffbeb);
  color: var(--color-warning-700, #b45309);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  text-align: center;
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
