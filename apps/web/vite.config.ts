import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// GitHub Pages serves the site at https://space-shell.github.io/Doodat/,
// so production builds use base '/Doodat/'. The dev server uses '/'.
export default defineConfig(({ command }) => ({
  plugins: [solid()],
  base: command === 'build' ? '/Doodat/' : '/',
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
}));
