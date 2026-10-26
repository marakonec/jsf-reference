import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  publicDir: '../data',
  build: {
    sourcemap: true,
    ...(mode === 'readable' ? { minify: false as const } : {}),
    outDir: mode === 'readable' ? 'dist-readable' : 'dist',
  },
}));
