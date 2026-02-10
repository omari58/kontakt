<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  html: string;
}>();

const { t } = useI18n();
const iframeRef = ref<HTMLIFrameElement | null>(null);

const srcdoc = computed(() => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { margin: 0; padding: 16px; font-family: Arial, Helvetica, sans-serif; background: #fff; }
</style></head>
<body>${props.html}</body>
</html>`);

function resizeIframe() {
  const iframe = iframeRef.value;
  if (!iframe) return;
  try {
    const height = iframe.contentDocument?.documentElement?.scrollHeight ?? 0;
    if (height > 0) {
      iframe.style.height = `${height}px`;
    }
  } catch {
    // Sandboxed iframe may restrict access — keep min-height fallback
  }
}

function onIframeLoad() {
  resizeIframe();
}

watch(() => props.html, async () => {
  await nextTick();
  // Small delay to let srcdoc re-render
  requestAnimationFrame(resizeIframe);
});
</script>

<template>
  <div class="sig-preview">
    <label class="sig-preview__label">{{ t('signatures.editor.preview') }}</label>
    <div class="sig-preview__frame-wrap">
      <iframe
        ref="iframeRef"
        class="sig-preview__iframe"
        :srcdoc="srcdoc"
        sandbox=""
        :title="t('signatures.editor.preview')"
        @load="onIframeLoad"
      />
    </div>
  </div>
</template>

<style scoped>
.sig-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sig-preview__label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
}

.sig-preview__frame-wrap {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
  overflow: hidden;
}

.sig-preview__iframe {
  display: block;
  width: 100%;
  min-height: 120px;
  border: none;
}
</style>
