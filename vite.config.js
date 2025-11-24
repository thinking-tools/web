import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  // server: {
  //   host: '0.0.0.0',
  //   allowedHosts: ['.ngrok-free.app'],
  // },
  build: {
    outDir: 'docs',
    cssMinify: true,
  },
});
