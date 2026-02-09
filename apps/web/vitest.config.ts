import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

export default defineConfig({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: [resolve(__dirname, 'src/locales/**')],
      compositionOnly: true,
      runtimeOnly: true,
      fullInstall: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
