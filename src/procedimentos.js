import { buscarProcedimentos } from './api.js';

const VALIDADE_MS = 60_000;
let cache = null; // { promessa, quando }

// Procedimentos ativos do painel. Quem pede junto (página e modal) divide a mesma chamada por 1 minuto.
export function procedimentosDaApi() {
  if (cache && Date.now() - cache.quando < VALIDADE_MS) return cache.promessa;

  const promessa = buscarProcedimentos();
  cache = { promessa, quando: Date.now() };
  promessa.catch(() => {
    if (cache?.promessa === promessa) cache = null; // falhou: a próxima tentativa busca de novo
  });
  return promessa;
}

const fmtPreco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2 });

// "R$ 130", ou "R$ 129,90" quando tem centavos
export const formatarPreco = (valor) => fmtPreco.format(valor).replace(/\s/g, ' ');

const TITULO_DO_DESTAQUE = 'FAVORITOS DAS CLIENTES';

// Tempo cadastrado no painel, em palavras curtas: "45 min", "1h" ou "1h30". Vazio quando não há tempo.
export function formatarDuracao(minutos) {
  if (!Number.isFinite(minutos) || minutos <= 0) return '';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}`;
}

// Do menor ao maior tempo cadastrado: "de 30 min a 1h30" (ou só "1h30" se todos forem iguais). Vazio sem procedimentos.
export function faixaDeDuracao(procedimentos) {
  const minutos = procedimentos.map((p) => p.duracaoEmMinutos).filter((m) => Number.isFinite(m) && m > 0);
  if (minutos.length === 0) return '';
  const menor = Math.min(...minutos);
  const maior = Math.max(...minutos);
  return menor === maior ? formatarDuracao(menor) : `de ${formatarDuracao(menor)} a ${formatarDuracao(maior)}`;
}

// Organiza os procedimentos da API para a lista de preços e para a escolha no agendamento: só os favoritos ficam
// separado (quando a API o informa); todo o resto vem numa lista única, na ordem da API.
export function agruparProcedimentos(procedimentos) {
  const destaques = procedimentos.filter((p) => p.destaque === true);
  const demais = procedimentos.filter((p) => p.destaque !== true);
  const resultado = [];

  if (destaques.length) resultado.push({ t: TITULO_DO_DESTAQUE, itens: destaques });
  if (demais.length) resultado.push({ t: destaques.length ? 'OUTROS PROCEDIMENTOS' : 'PROCEDIMENTOS', itens: demais });

  return resultado;
}
