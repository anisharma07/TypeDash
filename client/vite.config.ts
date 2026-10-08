import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two-page build on purpose: the legacy landing page and game page ship
// conflicting global CSS (:root, body, .navbar, .foo, .hidden, .container ...),
// so each page is its own React entry with its own stylesheets, exactly like
// the original multi-page site. URLs stay /index.html and /multiplayer.html.
const SERVER = process.env.TYPEDASH_SERVER ?? 'http://localhost:2360';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        multiplayer: resolve(import.meta.dirname, 'multiplayer.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: SERVER, ws: true },
      '/get-users-leaderboard': SERVER,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
