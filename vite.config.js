import { defineConfig } from 'vite';

// Pages currently publishes main/ with the legacy source setting. Keep the
// development entry at /, and publish the compiled site at /dist/.
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/sliding-window-protocol-simulator/dist/',
  plugins: [{
    name: 'inject-simulator-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace('</body>', '<script type="module" src="/src/main.jsx"></script></body>');
      },
    },
  }],
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
}));
