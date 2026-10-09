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
    // The legacy stylesheets are reused byte-for-byte, and the default CSS
    // minifier (lightningcss) changes their meaning: it drops the standard
    // `backdrop-filter` when the source lists it BEFORE `-webkit-backdrop-filter`
    // (so Chromium/Firefox lose every glass blur, which also moves the
    // absolutely-positioned key hints that rely on it as containing block) and
    // turns the invalid `gap: 1` (ignored by browsers) into a real `gap: 1px`.
    // Shipping the CSS as authored keeps rendering identical; gzip makes the
    // size difference negligible.
    cssMinify: false,
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
