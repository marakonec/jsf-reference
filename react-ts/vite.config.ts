import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: '../data',
  build: {
    sourcemap: true,
    // У Vite 8 явне minify: 'esbuild' вимагає окремо встановленого пакета,
    // тому режим readable лише вимикає мініфікацію.
    ...(mode === 'readable' ? { minify: false as const } : {}),
    outDir: mode === 'readable' ? 'dist-readable' : 'dist',
  },
}));
