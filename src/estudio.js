import { buscarEstudio } from './api.js';
import { formatarPreco } from './procedimentos.js';

// Dados do estúdio (WhatsApp, redes sociais, endereço, CNPJ e taxa) vêm do painel, em "Dados do estúdio".
// O que não foi preenchido vem vazio/nulo e o site não mostra. Só se a API não responder o site usa a reserva abaixo,
// para a cliente ainda conseguir falar com a Anna.
const RESERVA = {
  whatsapp: '8585291830',
  instagrams: [{ usuario: 'annastudiolash', url: 'https://www.instagram.com/annastudiolash/' }],
  facebook: null,
  tiktok: null,
  cep: '',
  logradouro: 'Travessa Planaltina',
  numero: '38',
  complemento: '',
  bairro: 'Planalto Ayrton Senna',
  cidade: 'Fortaleza',
  uf: 'CE',
  enderecoParaMapa: 'Travessa Planaltina, 38, Planalto Ayrton Senna, Fortaleza - CE, Brasil',
  endereco: 'Travessa Planaltina, 38 · Planalto Ayrton Senna · Fortaleza/CE',
  cnpj: null,
  taxaDePreAgendamento: 20,
};

let atual = null; // o que já chegou (ou a reserva, se a API falhou)
let promessa = null;

// Busca uma vez e divide a mesma chamada entre quem pedir junto; se falhar, a próxima tentativa busca de novo.
export function estudioDaApi() {
  if (!promessa) {
    promessa = buscarEstudio()
      .then((dados) => {
        atual = dados;
        return dados;
      })
      .catch(() => {
        promessa = null;
        atual = atual ?? RESERVA;
        return atual;
      });
  }
  return promessa;
}

// O que já chegou, ou null enquanto carrega (os componentes não mostram nada nesse meio tempo).
export const estudioCarregado = () => atual;

// Para quem precisa do dado na hora (ex.: montar o link do WhatsApp depois de agendar): o que chegou ou a reserva.
export const estudioAtual = () => atual ?? RESERVA;

// WhatsApp no formato do link (55 + DDD + número); vazio se o estúdio não informou.
export function numeroDoWhatsApp(estudio = estudioAtual()) {
  const digitos = (estudio.whatsapp ?? '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.length > 11 && digitos.startsWith('55') ? digitos : `55${digitos}`;
}

// Endereço em linhas para mostrar: rua e número (– complemento); bairro; cidade – UF · CEP. Vazio sem endereço.
// A API antiga só tem o texto livre (`endereco`): vira uma linha só.
export function linhasDoEndereco(estudio) {
  if (!estudio) return [];
  if (estudio.logradouro === undefined) return estudio.endereco ? [estudio.endereco] : [];
  const rua = [estudio.logradouro, estudio.numero].filter(Boolean).join(', ');
  const cidade = [estudio.cidade, estudio.uf].filter(Boolean).join(' – ');
  return [
    estudio.complemento ? `${rua} – ${estudio.complemento}` : rua,
    estudio.bairro,
    estudio.cep ? `${cidade} · CEP ${estudio.cep}` : cidade,
  ].filter(Boolean);
}

// Texto que o mapa procura (a API monta sem complemento, terminando em "Brasil"); vazio sem endereço.
export const enderecoDoMapa = (estudio) => estudio?.enderecoParaMapa || estudio?.endereco || '';

// Mapa para pôr na página (iframe), abrir no Google Maps e traçar a rota até o estúdio.
export const mapaIncorporado = (busca) => `https://www.google.com/maps?q=${encodeURIComponent(busca)}&output=embed`;
export const linkDoMapa = (busca) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`;
export const linkDaRota = (busca) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(busca)}`;

// "R$ 20" (ou "R$ 19,90"); vazio quando não há taxa.
export const textoDaTaxa = (estudio = estudioAtual()) =>
  estudio.taxaDePreAgendamento ? formatarPreco(estudio.taxaDePreAgendamento) : '';
