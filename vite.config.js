import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { i18nAlly } from 'vite-plugin-i18n-ally';

export default defineConfig({
  plugins: [tailwindcss(), i18nAlly()],
  build: {
    outDir: 'docs',
  },
});
