import { PAGAMENTOS } from './data.js';
import { numeroDoWhatsApp, textoDaTaxa } from './estudio.js';

const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDiaCompleto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const SAUDACAO = 'Olá, Anna! Tudo bem?';

// api.whatsapp.com e não wa.me: pelo wa.me o WhatsApp do Windows estraga acentos e símbolos.
// O número é o de "Dados do estúdio" no painel (estudio.js).
export function linkDoWhatsApp(mensagem) {
  return `https://api.whatsapp.com/send?phone=${numeroDoWhatsApp()}&text=${encodeURIComponent(mensagem)}`;
}

const rotuloDoPagamento = (valor) => PAGAMENTOS.find((p) => p.valor === valor)?.rotulo ?? valor;

// "2026-10-22" -> "Quinta-feira, 22 de outubro" (por extenso, para o WhatsApp não tratar como link de data)
function diaPorExtenso(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return fmtDiaCompleto.format(new Date(a, m - 1, d)).replace(/^./, (l) => l.toUpperCase());
}

// Um procedimento fica numa linha; vários viram lista, um por linha, com o valor de cada um e o total
function blocoDosProcedimentos(itens, total) {
  if (itens.length === 1) return [`*Procedimento:* ${itens[0].nome}`, `*Valor:* ${fmtMoeda.format(total)}`].join('\n');

  const lista = itens.map((i) => `• ${i.nome} (${fmtMoeda.format(i.valor)})`).join('\n');
  return [`*Procedimentos:*`, lista, `*Total:* ${fmtMoeda.format(total)}`].join('\n');
}

// Mesmo padrão das mensagens do painel: saudação, assunto em uma frase, os dados, o próximo passo e o agradecimento,
// com uma linha em branco entre as partes e *negrito* nos rótulos. Sem gênero e sem hífen no meio do texto.
const montar = (...partes) => partes.join('\n\n');

/** Reserva feita pelo site: a cliente avisa a Anna e fica no aguardo da confirmação. */
export function montarMensagem({ reserva, pagamento }) {
  const taxa = textoDaTaxa();
  return montar(
    ...[
      SAUDACAO,
      `Aqui é *${reserva.nomeCliente}*. Acabei de reservar um horário pelo site e aguardo a sua confirmação.`,
      [`*Dia:* ${diaPorExtenso(reserva.data)}`, `*Horário:* ${reserva.hora}`].join('\n'),
      [blocoDosProcedimentos(reserva.procedimentos, reserva.total), `*Pagamento:* ${rotuloDoPagamento(pagamento)}`].join('\n'),
      // A frase da taxa só entra quando o estúdio cobra pré-agendamento
      taxa && `Estou ciente da taxa de ${taxa} para garantir o horário.`,
      'Agradeço desde já.',
    ].filter(Boolean),
  );
}

/**
 * Pedido de encaixe pelo WhatsApp: antes de enviar pelo site (servidor sem a rota) ou depois, para a cliente
 * falar direto com a Anna (`jaEnviado`).
 */
export function montarMensagemDeEncaixe({ nome, telefone, itens, total, preferencia, jaEnviado = false }) {
  const assunto = jaEnviado
    ? `Aqui é *${nome}*. Solicitei um *encaixe* pelo site e queria falar com você.`
    : `Aqui é *${nome}*. Não achei um horário que servisse no site e quero solicitar um *encaixe* ou uma nova data.`;
  const contato = [];
  if (preferencia) contato.push(`*Preferência:* ${preferencia}`);
  contato.push(`*Meu WhatsApp:* ${telefone}`);

  return montar(
    SAUDACAO,
    assunto,
    blocoDosProcedimentos(itens, total),
    contato.join('\n'),
    'Pode ver na sua agenda e me avisar? Agradeço desde já.',
  );
}
