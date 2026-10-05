import { connect } from 'node:net';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api vai por proxy para a API, igual ao PAINEL: perfil https (localhost:7190) se estiver
// no ar, senão o http (localhost:5190). ALVO_DO_PROXY_DA_API no .env.local troca o endereço.
export default defineConfig(async ({ mode, command }) => {
  const variaveis = loadEnv(mode, process.cwd(), '');
  const alvo =
    variaveis.ALVO_DO_PROXY_DA_API ||
    (command === 'serve' && (await portaAberta(7190)) ? 'https://localhost:7190' : 'http://localhost:5190');

  if (command === 'serve') console.log(`\n  Proxy /api → ${alvo}\n`);

  return {
    plugins: [react()],
    // host: true → também atende pela rede local (tablet/celular no mesmo Wi-Fi em http://<IP-do-PC>:5173).
    preview: { host: true },
    server: {
      host: true,
      proxy: {
        '/api': { target: alvo, changeOrigin: true, secure: false },
      },
    },
  };
});

/** Diz se há algo escutando na porta local (para descobrir o perfil da API). */
function portaAberta(porta) {
  return new Promise((resolver) => {
    const conexao = connect({ port: porta, host: 'localhost' });
    const finalizar = (aberta) => {
      conexao.destroy();
      resolver(aberta);
    };
    conexao.setTimeout(400, () => finalizar(false));
    conexao.once('connect', () => finalizar(true));
    conexao.once('error', () => finalizar(false));
  });
}
