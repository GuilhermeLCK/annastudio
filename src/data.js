// Número do WhatsApp com DDI + DDD, só dígitos. Ex.: 5585999999999
export const WHATSAPP_NUMBER = '558585291830';

// Agenda (mês atual): dias sem atendimento (0 = domingo), intervalo entre horários e turnos.
// Os horários vão de 'inicio' até antes de 'fim' (o último começa 'intervaloMin' antes do fim).
export const AGENDA = {
  diasFechados: [0],
  intervaloMin: 90,
  turnos: [
    { id: 'manha', label: 'Manhã', inicio: '09:00', fim: '12:00' },
    { id: 'tarde', label: 'Tarde', inicio: '14:00', fim: '19:00' },
  ],
};

const paraMin = (h) => h.split(':').reduce((hh, mm) => hh * 60 + Number(mm), 0);
const paraHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const TURNOS = AGENDA.turnos.map((t) => {
  const horarios = [];
  for (let m = paraMin(t.inicio); m < paraMin(t.fim); m += AGENDA.intervaloMin) horarios.push(paraHora(m));
  return { ...t, horarios };
});

export const HORARIOS = TURNOS.flatMap((t) => t.horarios);

export const etapas = [
  { n: '01', t: 'Conversa', d: 'Entendo sua rotina e o efeito que você imagina: mais natural ou mais marcante.' },
  { n: '02', t: 'Mapeamento do olhar', d: 'Analiso o formato dos seus olhos e a espessura dos seus fios pra escolher técnica, curvatura e tamanho ideais.' },
  { n: '03', t: 'Aplicação', d: 'Você fica deitada, de olhos fechados, em um ambiente tranquilo. De 40 min a 1h30.' },
  { n: '04', t: 'Cuidados', d: 'Você sai com orientações de manutenção pra seus cílios durarem mais.' },
];

// Fotos da galeria em public/galeria/ (provisórias, do Unsplash: trocar por fotos reais de clientes).
// Enquanto a foto não existir, aparece o espaço reservado com a legenda.
export const galeria = [
  { t: 'Volume brasileiro', img: '/galeria/01-volume-brasileiro.jpg' },
  { t: 'Volume egípcio', img: '/galeria/02-volume-egipcio.jpg' },
  { t: 'Aplicação no estúdio', img: '/galeria/03-aplicacao.jpg' },
  { t: 'Fio a fio', img: '/galeria/04-fio-a-fio.jpg' },
  { t: 'Cuidado em cada fio', img: '/galeria/05-espelho.jpg' },
  { t: 'Olhar marcante', img: '/galeria/06-perfil.jpg' },
];

export const inclui = [
  'Conversa e mapeamento do olhar',
  'Escolha de técnica, curvatura e tamanho',
  'Higienização antes da aplicação',
  'Orientações de cuidado pós aplicação',
];

export const grupos = [
  {
    t: 'DESTAQUES DA CASA',
    itens: [
      { n: 'Volume Brasileiro', p: 'R$ 130' },
      { n: 'Volume Egípcio', p: 'R$ 150' },
    ],
  },
  {
    t: 'OUTRAS TÉCNICAS',
    itens: [
      { n: 'Fio a Fio', p: 'R$ 120' },
      { n: 'Volume Russo', p: 'R$ 170' },
      { n: 'Lash Lifting', p: 'R$ 100' },
    ],
  },
  {
    t: 'MANUTENÇÃO E CUIDADOS',
    itens: [
      { n: 'Manutenção (até 20 dias)', p: 'a partir de R$ 80' },
      { n: 'Remoção', p: 'R$ 40' },
    ],
  },
];

export const servicos = grupos.flatMap((g) => g.itens.map((s) => ({ ...s, grupo: g.t })));

export const faq = [
  { q: 'Como faço pra agendar?', a: 'É só tocar em “Agendar”, preencher seu nome, o procedimento, o dia e o melhor horário. A mensagem já vai pronta pro WhatsApp e eu confirmo com você.' },
  { q: 'Quanto tempo dura o atendimento?', a: 'De 40 min a 1h30, dependendo da técnica.' },
  { q: 'Preciso ir de algum jeito específico?', a: 'Vá sem maquiagem nos olhos e sem lentes de contato, se possível.' },
  { q: 'Posso molhar os cílios depois?', a: 'Evite molhar nas primeiras 24 horas. Depois disso, vida normal com os cuidados que eu te passo.' },
  { q: 'Serve pra quem nunca fez?', a: 'Sim. A conversa inicial ajuda você a escolher o efeito ideal pro seu primeiro cílio.' },
  { q: 'Quais as formas de pagamento?', a: 'Cartão e Pix.' },
  { q: 'Onde fica o estúdio?', a: 'Travessa Planaltina, 38, Planalto Ayrton Senna, Fortaleza.' },
];

export const FLAGS = {
  showGuarantee: false,
};
