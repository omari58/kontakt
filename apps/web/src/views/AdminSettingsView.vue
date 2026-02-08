<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import BrandingSection from '@/components/admin/BrandingSection.vue';
import ThemeDefaultsSection from '@/components/admin/ThemeDefaultsSection.vue';
import FeatureTogglesSection from '@/components/admin/FeatureTogglesSection.vue';

const store = useSettingsStore();

const form = reactive({
  org_name: '',
  default_primary_color: '#0F172A',
  default_secondary_color: '#3B82F6',
  default_bg_color: '#FFFFFF',
  default_theme: 'light',
  default_avatar_shape: 'circle',
  allow_user_color_override: true,
  allow_user_background_image: true,
  default_visibility: 'public',
  footer_text: '',
  footer_link: '',
});

const orgLogo = ref<string | null>(null);
const orgFavicon = ref<string | null>(null);

const initial = ref<Record<string, string>>({});

function syncFormFromStore() {
  const s = store.settings;
  form.org_name = s.org_name ?? '';
  form.default_primary_color = s.default_primary_color ?? '#0F172A';
  form.default_secondary_color = s.default_secondary_color ?? '#3B82F6';
  form.default_bg_color = s.default_bg_color ?? '#FFFFFF';
  form.default_theme = s.default_theme ?? 'light';
  form.default_avatar_shape = s.default_avatar_shape ?? 'circle';
  form.allow_user_color_override = s.allow_user_color_override !== 'false';
  form.allow_user_background_image = s.allow_user_background_image !== 'false';
  form.default_visibility = s.default_visibility ?? 'public';
  form.footer_text = s.footer_text ?? '';
  form.footer_link = s.footer_link ?? '';
  orgLogo.value = s.org_logo ?? null;
  orgFavicon.value = s.org_favicon ?? null;

  initial.value = toSettingsMap();
}

function toSettingsMap(): Record<string, string> {
  return {
    org_name: form.org_name,
    default_primary_color: form.default_primary_color,
    default_secondary_color: form.default_secondary_color,
    default_bg_color: form.default_bg_color,
    default_theme: form.default_theme,
    default_avatar_shape: form.default_avatar_shape,
    allow_user_color_override: String(form.allow_user_color_override),
    allow_user_background_image: String(form.allow_user_background_image),
    default_visibility: form.default_visibility,
    footer_text: form.footer_text,
    footer_link: form.footer_link,
  };
}

const changedSettings = computed(() => {
  const current = toSettingsMap();
  const changed: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(current)) {
    if (value !== initial.value[key]) {
      changed.push({ key, value });
    }
  }
  return changed;
});

const hasChanges = computed(() => changedSettings.value.length > 0);

onMounted(async () => {
  await store.fetchSettings();
  syncFormFromStore();
});

async function save() {
  store.clearMessages();
  await store.saveSettings(changedSettings.value);
  if (!store.error) {
    initial.value = toSettingsMap();
  }
}

async function onUploadLogo(file: File) {
  const path = await store.uploadFile('logo', file);
  if (path) {
    orgLogo.value = path;
  }
}

async function onUploadFavicon(file: File) {
  const path = await store.uploadFile('favicon', file);
  if (path) {
    orgFavicon.value = path;
  }
}
</script>

<template>
  <div class="admin-settings">
    <div class="admin-settings__header">
      <h1 class="admin-settings__title">Admin Settings</h1>
      <button
        class="admin-settings__save-btn"
        :disabled="!hasChanges || store.saving"
        @click="save"
      >
        {{ store.saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <div
      v-if="store.successMessage"
      class="admin-settings__toast admin-settings__toast--success"
    >
      {{ store.successMessage }}
    </div>

    <div
      v-if="store.error"
      class="admin-settings__toast admin-settings__toast--error"
    >
      {{ store.error }}
    </div>

    <div v-if="store.loading" class="admin-settings__loading">
      Loading settings...
    </div>

    <template v-else>
      <div class="admin-settings__sections">
        <BrandingSection
          :org-name="form.org_name"
          :org-logo="orgLogo"
          :org-favicon="orgFavicon"
          @update:org-name="form.org_name = $event"
          @upload-logo="onUploadLogo"
          @upload-favicon="onUploadFavicon"
        />

        <ThemeDefaultsSection
          :primary-color="form.default_primary_color"
          :secondary-color="form.default_secondary_color"
          :bg-color="form.default_bg_color"
          :theme="form.default_theme"
          :avatar-shape="form.default_avatar_shape"
          @update:primary-color="form.default_primary_color = $event"
          @update:secondary-color="form.default_secondary_color = $event"
          @update:bg-color="form.default_bg_color = $event"
          @update:theme="form.default_theme = $event"
          @update:avatar-shape="form.default_avatar_shape = $event"
        />

        <FeatureTogglesSection
          :allow-user-color-override="form.allow_user_color_override"
          :allow-bg-images="form.allow_user_background_image"
          :default-visibility="form.default_visibility"
          :footer-text="form.footer_text"
          :footer-link="form.footer_link"
          @update:allow-user-color-override="form.allow_user_color_override = $event"
          @update:allow-bg-images="form.allow_user_background_image = $event"
          @update:default-visibility="form.default_visibility = $event"
          @update:footer-text="form.footer_text = $event"
          @update:footer-link="form.footer_link = $event"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-settings {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.admin-settings__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.admin-settings__title {
  font-size: 1.5rem;
  font-weight: 700;
}

.admin-settings__save-btn {
  padding: 0.5rem 1.25rem;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.admin-settings__save-btn:hover:not(:disabled) {
  background: #333;
}

.admin-settings__save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-settings__toast {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.admin-settings__toast--success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.admin-settings__toast--error {
  background: #fce4ec;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.admin-settings__loading {
  text-align: center;
  color: #666;
  padding: 3rem 1rem;
}

.admin-settings__sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
