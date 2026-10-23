import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Versão única do projeto (package.json). 1.2.0 -> "V1.2"
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const APP_VERSION = `V${version.split('.').slice(0, 2).join('.')}`;

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'app-version-html',
      transformIndexHtml: (html) => html.replaceAll('%APP_VERSION%', APP_VERSION),
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    port: 5173,
    open: true,
    // Encaminha /api para o back-end local (server/index.js), que confere
    // o login, adiciona a chave e chama a API autorizada.
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', xfwd: true },
    },
  },
});
