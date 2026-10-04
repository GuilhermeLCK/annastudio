import { useEffect, useState } from 'react';
import { buscarHorarios } from '../api.js';

const fmtDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

const deIso = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
};

// "quinta-feira, 22/10" -> "quinta, 22/10"
const rotuloDoDia = (iso) => fmtDia.format(deIso(iso)).replace('-feira', '');

// Mês atual e o seguinte, como a API entrega: só os dias que ainda têm horário livre
async function buscarProximosDias() {
  const hoje = new Date();
  const seguinte = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const meses = await Promise.all([
    buscarHorarios(hoje.getFullYear(), hoje.getMonth() + 1),
    buscarHorarios(seguinte.getFullYear(), seguinte.getMonth() + 1),
  ]);
  return meses.flatMap((m) => m.dias).sort((a, b) => a.data.localeCompare(b.data));
}

// Rodapé > Horários: o próximo horário livre, um botão para escolher e outro para pedir um encaixe
const AgendaDisponivel = ({ onBook }) => {
  const [dias, setDias] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarProximosDias()
      .then((lista) => ativo && setDias(lista))
      .catch(() => ativo && setFalhou(true));
    return () => {
      ativo = false;
    };
  }, []);

  const proximo = dias?.[0];

  const verHorarios = (
    <button type="button" className="footer__link footer__link--btn" onClick={() => onBook()}>
      Ver horários <span aria-hidden="true">→</span>
    </button>
  );
  const pedirEncaixe = (
    <button type="button" className="footer__link footer__link--btn" onClick={() => onBook('', 'encaixe')}>
      Pedir um encaixe <span aria-hidden="true">→</span>
    </button>
  );

  if (falhou) {
    return (
      <>
        <p className="footer__text">Atendimento com hora marcada.</p>
        {verHorarios}
      </>
    );
  }

  if (!dias) return <p className="footer__text agenda__status">Consultando a agenda…</p>;

  if (!proximo) {
    return (
      <>
        <p className="footer__text">Agenda cheia por enquanto. Peça um encaixe e a Anna te chama no WhatsApp.</p>
        {pedirEncaixe}
      </>
    );
  }

  return (
    <>
      <p className="agenda__resumo">
        <span className="agenda__ponto" aria-hidden="true" />
        Agenda aberta
      </p>
      <p className="footer__text">
        Próximo horário: {rotuloDoDia(proximo.data)}, {proximo.horas[0]}
      </p>
      {verHorarios}
      {pedirEncaixe}
    </>
  );
};

export default AgendaDisponivel;
