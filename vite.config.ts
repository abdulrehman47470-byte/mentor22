import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    rollupOptions: {
      // React and the router change rarely, so they get their own long-cached chunk. Icons stay with the
      // pages that use them, so the landing page doesn't download icons for screens it never shows.
      output: { manualChunks: (id: string) => (/node_modules[\/](react|react-dom|scheduler|react-router)[\/]/.test(id) ? 'vendor' : undefined) },
    },
  },
});
