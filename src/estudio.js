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
  endereco: 'Travessa Planaltina, 38, Planalto Ayrton Senna, Fortaleza',
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

// "R$ 20" (ou "R$ 19,90"); vazio quando não há taxa.
export const textoDaTaxa = (estudio = estudioAtual()) =>
  estudio.taxaDePreAgendamento ? formatarPreco(estudio.taxaDePreAgendamento) : '';
