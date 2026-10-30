// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { privateDocsIntegration } from './src/utils/sync-private-docs.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [privateDocsIntegration()],
  vite: {
    plugins: [tailwindcss()]
  }
});
