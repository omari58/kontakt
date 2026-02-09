<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from '@/components/AppShell.vue';

onMounted(async () => {
  try {
    const res = await fetch('/api/settings/public');
    if (!res.ok) return;
    const settings = await res.json() as Record<string, string>;
    if (settings.org_favicon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) link.href = settings.org_favicon;
    }
    if (settings.org_name) {
      document.title = settings.org_name;
    }
  } catch {
    // Public settings not available, keep defaults
  }
});
</script>

<template>
  <AppShell>
    <RouterView :key="$route.path" />
  </AppShell>
</template>
