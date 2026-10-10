// WhatsApp, redes sociais, endereço, CNPJ e taxa de pré-agendamento vêm do painel ("Dados do estúdio"): ver estudio.js.

// Formas de pagamento (pagas no estúdio): rótulo na tela e nome que a API espera.
export const PAGAMENTOS = [
  { rotulo: 'Pix', valor: 'Pix' },
  { rotulo: 'Cartão', valor: 'Cartao' },
  { rotulo: 'Dinheiro', valor: 'Dinheiro' },
];

export const etapas = [
  { n: '01', t: 'Conversa', d: 'Entendo sua rotina e o efeito que você imagina: mais natural ou mais marcante.' },
  { n: '02', t: 'Mapeamento do olhar', d: 'Analiso o formato dos seus olhos e a espessura dos seus fios pra escolher técnica, curvatura e tamanho ideais.' },
  { n: '03', t: 'Aplicação', d: 'Você fica deitada, de olhos fechados, em um ambiente tranquilo.', comTempo: true },
  { n: '04', t: 'Cuidados', d: 'Você sai com orientações de manutenção pra seus cílios durarem mais.' },
];

export const inclui = [
  'Conversa e mapeamento do olhar',
  'Escolha de técnica, curvatura e tamanho',
  'Higienização antes da aplicação',
  'Orientações de cuidado pós aplicação',
];

export const faq = [
  { q: 'Como faço pra agendar?', a: 'É só tocar em “Agendar”, escolher o procedimento, o dia e um horário livre e informar seu nome e WhatsApp. O horário fica reservado na hora e eu confirmo com você pelo WhatsApp.' },
  { q: 'Não achei um horário bom, e agora?', a: 'Toque em “Agendar” e escolha “Pedir encaixe”. Você diz o procedimento e quando prefere, eu vejo a agenda e te chamo no WhatsApp com uma data.' },
  { q: 'Quanto tempo dura o atendimento?', a: 'Depende do procedimento escolhido.', comTempo: true },
  { q: 'Preciso ir de algum jeito específico?', a: 'Vá sem maquiagem nos olhos e sem lentes de contato, se possível.' },
  { q: 'Posso molhar os cílios depois?', a: 'Evite molhar nas primeiras 24 horas. Depois disso, vida normal com os cuidados que eu te passo.' },
  { q: 'Serve pra quem nunca fez?', a: 'Sim. A conversa inicial ajuda você a escolher o efeito ideal pro seu primeiro cílio.' },
  // comTaxa: a frase da taxa entra quando o estúdio cobra; comEndereco: a resposta é o endereço do painel (sem endereço, some)
  { q: 'Quais as formas de pagamento?', a: 'Pix, cartão e dinheiro, pagos no estúdio.', comTaxa: true },
  { q: 'Onde fica o estúdio?', a: '', comEndereco: true },
];

export const FLAGS = {
  showGuarantee: false,
};
