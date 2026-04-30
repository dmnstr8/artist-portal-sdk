import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  base: '/',
  /** Must be this app’s `public/` so `/data/*.json` and media resolve (not monorepo root `public/`, which is unused). */
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: 'artist-portal-sdk/admin',
        replacement: path.join(repoRoot, 'packages/artist-portal-sdk/src/admin/index.ts'),
      },
      {
        find: 'artist-portal-sdk',
        replacement: path.join(repoRoot, 'packages/artist-portal-sdk/src/index.ts'),
      },
    ],
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
