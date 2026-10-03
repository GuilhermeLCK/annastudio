import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api vai por proxy para a API (padrão: perfil http da API em localhost:5190).
// Use ALVO_DO_PROXY_DA_API no .env.local para outro endereço, ex.: https://localhost:7190.
export default defineConfig(({ mode }) => {
  const variaveis = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: variaveis.ALVO_DO_PROXY_DA_API || 'http://localhost:5190',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
