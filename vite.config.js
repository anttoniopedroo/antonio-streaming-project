import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Encaminha /api para o back-end local (server/index.js),
    // que adiciona a chave e chama a API autorizada.
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
