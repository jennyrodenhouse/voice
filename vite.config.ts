import { defineConfig } from 'vite';

export default defineConfig({
  base: '/voice/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
});
