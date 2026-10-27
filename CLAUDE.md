# AnnaStudio SITE — Padrões

Site público onde a cliente vê os procedimentos e agenda **sem login**. Lê tudo da API pública (`/api/site/*`, ver `../API/CLAUDE.md`).
É da sessão **FRONT** (junto com o `../PAINEL`, cujos padrões estão em `../PAINEL/CLAUDE.md`); a sessão BACK cuida da API e avisa as mudanças de contrato.

## Stack e comandos

React 19 + Vite 8, **JavaScript** (sem TypeScript, sem ESLint), CSS num arquivo só (`src/styles.css`, as mesmas cores e fontes que os tokens do painel:
creme, tinta, bronze, dourado; Cormorant Garamond e Jost) e `lenis` para a rolagem suave. Repositório `GuilhermeLCK/annastudio`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Site em `http://localhost:5173` **e na rede local** (`host: true`, `http://<IP-do-PC>:5173`); `/api` vai por proxy para a API |
| `npm run build` | Build de produção em `dist/` — **precisa passar** antes de qualquer push (é a única verificação do site) |
| `npm run preview` | Serve o build localmente |

**Proxy de desenvolvimento** (`vite.config.js`, igual ao do painel): `https://localhost:7190` se o perfil https da API estiver no ar, senão
`http://localhost:5190`, conferindo a cada 3 s. `ALVO_DO_PROXY_DA_API` no `.env.local` fixa outro destino (ex.: o ambiente descartável de
`../API/testes/ambiente-descartavel/`; apague o `.env.local` depois). Em produção o endereço vem de `VITE_API_URL` (`.env.example`).

## Estrutura (`src/`)

| Arquivo | O que tem |
|---|---|
| `main.jsx` | Monta o `App` com o Lenis (`lenis.jsx`: provedor e `useLenis`) |
| `App.jsx` | A página inteira, em seções na ordem: `Header`, `Hero` (`#topo`), a frase de abertura, Como funciona (`#como-funciona`, as `etapas`), Serviços e valores (`#servicos`, procedimentos da API em grupos), `Garantia` (desligada em `FLAGS.showGuarantee`), `Cuidados` (`#cuidados`), `Faq` (`#duvidas`), `Localizacao` (`#onde-fica`), `CtaFinal` e `Footer` (contato, redes, `AgendaDisponivel`), mais o botão flutuante que abre a janela de agendamento. Também o título da aba (`tituloDoSite`) |
| `components/BookingModal.jsx` | A janela de agendamento: procedimentos (até 10), dia no calendário (até 5 meses à frente), horário livre por turno, nome (`capitalizarNome`), telefone (mesma regra da API), pagamento e observação (até 500) → `POST /api/site/agendamentos`; ou o modo **Pedir encaixe** → `POST /api/site/solicitacoes`. No fim, a mensagem pronta para o WhatsApp do estúdio e, no rodapé, **Falar no WhatsApp** (conversa sem assunto, `mensagemParaConversar`) |
| `components/AgendaDisponivel.jsx` | Rodapé > Horários: o próximo horário livre, Escolher horário e Pedir encaixe |
| `components/LashMark.jsx`, `Reveal.jsx` | Desenho da marca e a animação de surgir ao rolar |
| `api.js` | Cliente da API (`fetch`, `ErroDaApi` com a mensagem da API): uma função por rota, com a rota na doc |
| `estudio.js` | **Ponto único dos dados do estúdio**: busca `/api/site/estudio` uma vez (`estudioDaApi`), `VAZIO` quando a API falha, e os auxiliares (`nomeDoEstudio`, `especialidadeDoEstudio`, `nomeDaProfissional`, `aProfissional`/`AProfissional` — "a Anna" ou "a profissional" —, `numeroDoWhatsApp`, `temWhatsApp`, `linhasDoEndereco`, `cidadeDoEstudio`, mapa e rota do Google Maps, `linkDoWaze`, `textoDaTaxa`, `tituloDoSite`) |
| `useEstudio.js`, `useCuidados.js`, `useProcedimentos.js` | Ganchos: `null` enquanto carrega (o trecho não aparece até chegar); procedimentos com `estado` (carregando, pronto, erro) e `tentarDeNovo` |
| `procedimentos.js` | Busca dividida entre página e modal (1 min), `formatarPreco` ("R$ 90,50", "R$ 150") e `descricaoDoProcedimento` (some a descrição sem letra nem número, ex.: só um ".") e os grupos da lista de preços (destaques que a API define, as manutenções — `ehManutencao` — no grupo **MANUTENÇÃO** por último) |
| `mensagens.js` | Mensagens do WhatsApp (agendar, conversar, reserva feita, pedido de encaixe), no formato das do painel: procedimentos um por linha com `•`, `*negrito*` nos rótulos e o total; `linkDoWhatsApp` usa `api.whatsapp.com/send` (pelo `wa.me` o WhatsApp do Windows estraga acentos e emojis) |
| `data.js` | O texto de venda do site (etapas, o que inclui, perguntas) e as formas de pagamento (`PAGAMENTOS`, num lugar só: rótulo, como entra na frase e o valor que a API espera) |

`public/`: ícones da aba e a foto do topo (`anna-hero.png`) — imagens fixas até existir envio de imagens no cadastro.

## API usada

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/site/procedimentos` | Lista de preços e modal (ativos, com `ehManutencao` e o destaque) |
| GET | `/api/site/estudio` | Nome, especialidade, profissional, WhatsApp, Instagram (lista com 0 ou 1 perfil — o site lê `instagrams[0]`), Facebook, TikTok, endereço em campos, `enderecoParaMapa`, CNPJ e taxa de pré-agendamento |
| GET | `/api/site/cuidados` | Seção Cuidados, na ordem do painel (`{ titulo, detalhe }`); vazia = a seção some |
| GET | `/api/site/horarios?ano=&mes=` | Dias com horários livres do mês |
| POST | `/api/site/agendamentos` | Reserva; nasce **aguardando confirmação** (o estúdio confirma pelo painel) |
| POST | `/api/site/solicitacoes` | Pedido de encaixe quando nenhum horário serve (vai para Pedidos de encaixe no painel) |

## Regras

- **Nada do estúdio escrito à mão** (decisão do usuário, white label): nome, especialidade, profissional, WhatsApp, redes, endereço, CNPJ, taxa,
  cuidados e tempos dos procedimentos vêm da API. Sem cadastro ou sem API, o trecho **não aparece** (nunca um valor inventado): sem nome não há logo;
  sem WhatsApp somem os botões de WhatsApp (a reserva continua pelo site); sem endereço some "Onde fica"; sem cuidados some a seção. O `index.html`
  tem só um título e uma descrição genéricos. Leia sempre pelos auxiliares de `estudio.js`, nunca o campo cru espalhado.
- **Frases com dado do estúdio dentro** usam marcadores, não texto fixo: `comTempo` (tempo do cadastro dos procedimentos), `comTaxa` (frase da taxa só
  quando há taxa), `comEndereco` (a resposta é o endereço cadastrado); "No {nome}, ..." com o nome, senão "Aqui, ...".
- **O texto de venda é fixo e aprovado pelo usuário** (`data.js` e as frases das seções, ex.: a frase do topo "Cada detalhe pensado para valorizar o
  seu olhar, com atendimento individual e hora marcada." — sem citar procedimentos nem bairro). Ele ainda é do nicho de cílios (sobrelinha
  "EXTENSÃO DE CÍLIOS", etapas, perguntas): mudar o nicho é decisão do usuário. Dado do estúdio nunca entra nesse texto.
- **Procedimentos só da API**, nunca uma lista fixa; quem decide o destaque é a API.
- **Formas de pagamento** só em `PAGAMENTOS` (pendente: virem do cadastro).
- Quem decide as regras (telefone, limites, horários) é a API; o site valida antes só para dar retorno na hora. Mensagem de erro da API aparece como veio.
- Celular primeiro: a cliente agenda pelo celular; confira sempre em 375 px e no tablet.
- **Linha de preço** (lista da página, `.price-row`, e escolha na janela, `.svc`): grade fixa — nome com o tempo junto (quebra se for comprido),
  pontilhado e o preço **sempre à direita**, na altura da última linha do nome; descrição e manutenção embaixo, na largura toda. Nunca `flex-wrap`
  aí: com nome comprido o preço caía para a linha de baixo, às vezes à esquerda e às vezes à direita.
- **Onde fica:** um bloco de até 420 px: "Como chegar" (rota no Google Maps) na linha toda e, embaixo, Google Maps | Waze do mesmo tamanho
  (`linkDoWaze`, `waze.com/ul?q=...&navigate=yes`).
- **Cuidados:** colunas iguais com a última linha centralizada (1 no celular, 2 no tablet; no PC `colunasDosCuidados`: até 3 lado a lado,
  4 em 2 × 2, 5 ou mais em 3) — nunca um buraco no fim da grade.

## Testes

Nunca no Supabase de produção. Use o ambiente descartável da API (`ALVO_DO_PROXY_DA_API`) ou a API simulada do front (Node, fora do repositório;
onde está e como subir fica na memória do front, `anna-studio-pendencias-2026-10-06.md`). Teste também a API fora do ar e o estúdio sem cadastro:
o site tem de abrir sem nenhum dado inventado.

## Publicação (Vercel)

- **Push na `main` = publicação em produção** (a Vercel publica sozinha). Só com o **OK do usuário dado na sessão FRONT** e com `npm run build` passando;
  antes, `git fetch` (outras sessões commitam). Com contrato novo da API: SQLs → API → PAINEL e SITE logo em seguida.
- `VITE_API_URL` (na Vercel) = endereço da API, sem barra no fim; entra no build (mudou → *Redeploy*). O endereço publicado do site precisa estar no
  CORS da API.
- `vercel.json`: cache longo para `/assets`, `index.html` sempre revalidado e os cabeçalhos de segurança combinados com a API (HSTS, `nosniff`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). A CSP está em **`Content-Security-Policy-Report-Only`**: o `connect-src` tem o endereço
  da API (mudou a API → mude aqui) e o `frame-src` libera `https://www.google.com` (mapa). Depois de conferir o console em produção, troque para
  `Content-Security-Policy`.

## Pendências (2026-10-19)

1. Trava no build contra palavra fixa do estúdio fora de comentário (a mesma do painel), com exceções para o texto de venda aprovado.
2. Com decisão do usuário: imagens (foto do topo, ícones) e tema pelo cadastro; formas de pagamento pelo cadastro.

## Idioma

Tudo em PT-BR (funções, variáveis, comentários, textos). Os nomes antigos em inglês de componentes e classes CSS (`BookingModal`, `Header`, `btn--ghost`)
ficam como estão; código novo em PT-BR.
