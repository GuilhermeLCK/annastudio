// Cliente da API do Anna Studio (rotas públicas do site, sem login).
// Em desenvolvimento, o Vite repassa /api para a API (vite.config.js); em produção, defina VITE_API_URL
// (ex.: https://api.annastudio.com.br) antes do build.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** Erro da API com a mensagem já em português (vem do `title` do ProblemDetails). */
export class ErroDaApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

async function chamar(caminho, opcoes) {
  let resposta;

  try {
    resposta = await fetch(`${BASE}${caminho}`, opcoes);
  } catch {
    throw new ErroDaApi('Sem conexão com o servidor. Confira sua internet e tente de novo.', 0);
  }

  if (!resposta.ok) {
    let titulo = '';

    try {
      titulo = (await resposta.json()).title ?? '';
    } catch {
      // resposta sem corpo legível: cai na mensagem padrão
    }

    throw new ErroDaApi(titulo || 'Não foi possível concluir agora. Tente de novo em instantes.', resposta.status);
  }

  return resposta.json();
}

/** GET /api/site/procedimentos: procedimentos ativos (id, nome, descricao, valor, duracaoEmMinutos). */
export const buscarProcedimentos = () => chamar('/api/site/procedimentos');

/** GET /api/site/horarios: dias do mês com horários livres ({ ano, mes, dias: [{ data, horas }] }). */
export const buscarHorarios = (ano, mes) => chamar(`/api/site/horarios?ano=${ano}&mes=${mes}`);

/** POST /api/site/agendamentos: reserva o horário; nasce aguardando confirmação. */
export const agendar = (dados) =>
  chamar('/api/site/agendamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

/** POST /api/site/solicitacoes: pedido de encaixe ou de nova data, quando a cliente não achou horário. */
export const pedirEncaixe = (dados) =>
  chamar('/api/site/solicitacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
