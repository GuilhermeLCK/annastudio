import { buscarProcedimentos } from './api.js';
import { grupos } from './data.js';

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

// Organiza os procedimentos da API nos grupos da lista de preços do site (pelo nome); o que não estiver lá vai para o fim.
export function agruparProcedimentos(procedimentos) {
  const normalizar = (t) => t.trim().toLowerCase();
  const restantes = new Map(procedimentos.map((p) => [normalizar(p.nome), p]));
  const resultado = [];

  for (const g of grupos) {
    const itens = g.itens.map((i) => restantes.get(normalizar(i.n))).filter(Boolean);
    itens.forEach((p) => restantes.delete(normalizar(p.nome)));
    if (itens.length) resultado.push({ t: g.t, itens });
  }

  if (restantes.size) {
    resultado.push({ t: resultado.length ? 'OUTROS PROCEDIMENTOS' : 'PROCEDIMENTOS', itens: [...restantes.values()] });
  }

  return resultado;
}
