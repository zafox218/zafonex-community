import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(here, 'src') },
  },
  server: {
    port: 5173,
    // WSL2: the file watcher misses Windows-side writes without polling.
    watch: { usePolling: process.env.WSL_DISTRO_NAME ? true : false },
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
