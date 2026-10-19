import { buscarEstudio } from './api.js';
import { formatarPreco } from './procedimentos.js';

// Dados do estúdio (nome, especialidade, profissional, WhatsApp, redes sociais, endereço, CNPJ e taxa) vêm do painel,
// em "Dados do estúdio". Nada é escrito à mão aqui: o que não foi preenchido vem vazio e o site não mostra. Se a API
// não responder, o site fica com o estúdio vazio (nenhum nome, contato ou endereço inventado).
const VAZIO = {
  whatsapp: '',
  instagrams: [],
  facebook: null,
  tiktok: null,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  enderecoParaMapa: '',
  endereco: '',
  cnpj: null,
  taxaDePreAgendamento: null,
  nomeDoEstudio: '',
  especialidade: '',
  nomeDaProfissional: '',
};

let atual = null; // o que já chegou (ou o estúdio vazio, se a API falhou)
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
        atual = atual ?? VAZIO;
        return atual;
      });
  }
  return promessa;
}

// O que já chegou, ou null enquanto carrega (os componentes não mostram nada nesse meio tempo).
export const estudioCarregado = () => atual;

// Para quem precisa do dado na hora (ex.: montar o link do WhatsApp depois de agendar): o que chegou ou o vazio.
export const estudioAtual = () => atual ?? VAZIO;

// Texto do cadastro sem espaços nas pontas; vazio se não veio (API anterior, sem o campo).
const campo = (estudio, nome) => (estudio?.[nome] ?? '').trim();

// Identidade do estúdio: vazia = o trecho que a usa some (ou a frase fica sem o nome).
export const nomeDoEstudio = (estudio = estudioAtual()) => campo(estudio, 'nomeDoEstudio');
export const especialidadeDoEstudio = (estudio = estudioAtual()) => campo(estudio, 'especialidade');
export const nomeDaProfissional = (estudio = estudioAtual()) => campo(estudio, 'nomeDaProfissional');

// Quem atende, para pôr no meio da frase: "a Anna" ou, sem o nome cadastrado, "a profissional".
export const aProfissional = (estudio = estudioAtual()) => {
  const nome = nomeDaProfissional(estudio);
  return nome ? `a ${nome}` : 'a profissional';
};

// O mesmo no começo da frase: "A Anna" ou "A profissional".
export const AProfissional = (estudio = estudioAtual()) => aProfissional(estudio).replace(/^a/, 'A');

// WhatsApp no formato do link (55 + DDD + número); vazio se o estúdio não informou.
export function numeroDoWhatsApp(estudio = estudioAtual()) {
  const digitos = (estudio.whatsapp ?? '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.length > 11 && digitos.startsWith('55') ? digitos : `55${digitos}`;
}

// Diz se dá para mandar mensagem: sem o WhatsApp cadastrado, os botões e links do WhatsApp somem.
export const temWhatsApp = (estudio = estudioAtual()) => numeroDoWhatsApp(estudio) !== '';

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

// Cidade do endereço cadastrado, para a sobrelinha do site; vazia sem endereço (o trecho some).
export const cidadeDoEstudio = (estudio) => campo(estudio, 'cidade');

// Texto que o mapa procura (a API monta sem complemento, terminando em "Brasil"); vazio sem endereço.
export const enderecoDoMapa = (estudio) => estudio?.enderecoParaMapa || estudio?.endereco || '';

// Mapa para pôr na página (iframe), abrir no Google Maps e traçar a rota até o estúdio.
export const mapaIncorporado = (busca) => `https://www.google.com/maps?q=${encodeURIComponent(busca)}&output=embed`;
export const linkDoMapa = (busca) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`;
export const linkDaRota = (busca) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(busca)}`;

// "R$ 20" (ou "R$ 19,90"); vazio quando não há taxa.
export const textoDaTaxa = (estudio = estudioAtual()) =>
  estudio.taxaDePreAgendamento ? formatarPreco(estudio.taxaDePreAgendamento) : '';

// Título da aba: "Nome · Especialidade", só o nome ou, sem cadastro, o genérico do index.html.
export function tituloDoSite(estudio) {
  const partes = [nomeDoEstudio(estudio), especialidadeDoEstudio(estudio)].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Agende seu horário';
}
