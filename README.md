# AnnaStudio · Site

Site público do estúdio, onde a cliente vê os procedimentos e valores e agenda sem login: escolhe os procedimentos, o dia e
um horário livre (a reserva nasce aguardando a confirmação do estúdio) ou pede um encaixe quando nenhum horário serve.
React 19 + Vite, em JavaScript.

Nada do estúdio fica escrito no código: nome, especialidade, profissional, contato, redes, endereço, taxa e cuidados vêm do
cadastro do painel (pela API pública `/api/site/*`) e, sem cadastro, o trecho não aparece.

Padrões, estrutura e decisões: [CLAUDE.md](CLAUDE.md).

## Rodando

1. **API** — suba o back (ver `../API/README.md`).
2. **Site**:
   ```bash
   npm install
   npm run dev
   ```
   Abra `http://localhost:5173` (ou `http://<IP-do-PC>:5173` no celular do mesmo Wi-Fi). As chamadas `/api` vão por proxy
   para a API local (7190 se o perfil `https` estiver no ar, senão 5190). Outro endereço — por exemplo, o ambiente descartável
   de testes da API: copie `.env.example` para `.env.local` e ajuste `ALVO_DO_PROXY_DA_API` (apague o `.env.local` depois).
   Nunca teste no banco de produção.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173, também na rede local) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |

## Produção (Vercel)

**Cada push na `main` publica em produção.** Só faça o push com o OK do usuário e com `npm run build` passando. Quando a
API muda o contrato, a ordem é: SQLs no Supabase → API na VPS → PAINEL e SITE logo em seguida.

- Variável `VITE_API_URL` = endereço público da API, com `https://` e sem barra no fim (entra no build: mudou → *Redeploy*).
- O endereço publicado do site precisa estar no CORS da API (`Cors:OrigensPermitidas`).
- O `vercel.json` configura o build, o cache e os cabeçalhos de segurança; a CSP (ainda em `Report-Only`) tem o endereço da
  API no `connect-src` — mudou a API, mude lá também.
