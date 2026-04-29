import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, repoRoot, '');
  return {
    // Cloud hosting serves from web root.
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      // Longer `find` first: Vite would otherwise treat `artist-portal-sdk/admin` as `index.ts/admin`.
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
    define: {
      'process.env.APP_API_KEY': JSON.stringify(env.APP_API_KEY),
    },
    server: {
      // HMR can be disabled with DISABLE_HMR env var.
      // Do not change: file watching is disabled to reduce flicker during automated edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      outDir: path.join(repoRoot, 'dist'),
      emptyOutDir: true,
    },
  };
});
