import { defineConfig } from 'vite';

// Serve at / for local and embedded previews; use the repository subpath
// only for production GitHub Pages builds.
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/sliding-window-protocol-simulator/',
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
}));
