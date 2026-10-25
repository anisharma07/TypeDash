import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two pages, each its own React entry: both load the shared base.css and the
// theme tokens, then their own page stylesheet (home.css / game.css), which
// lays out <body> differently. URLs stay /index.html and /multiplayer.html.
const SERVER = process.env.TYPEDASH_SERVER ?? 'http://localhost:2360';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The CSS ships as authored: the theme tokens are OKLCH values and
    // color-mix() over custom properties, and the default minifier
    // (lightningcss) rewrites colours for older browser targets. The original
    // stylesheets also hit real minifier bugs (a dropped `backdrop-filter`).
    // build.test.ts guards the theme blocks; gzip makes the size difference
    // negligible.
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
