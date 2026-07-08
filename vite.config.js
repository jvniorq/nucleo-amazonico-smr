import { defineConfig } from 'vite';

export default defineConfig({
  base: '/nucleo-amazonico-smr/',
  build: {
    target: 'es2020',
    sourcemap: false
  }
});
