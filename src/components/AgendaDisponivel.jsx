import { useEffect, useState } from 'react';
import { buscarHorarios } from '../api.js';

const fmtDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
const DIAS_MOSTRADOS = 4;
const HORAS_MOSTRADAS = 4;

const deIso = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
};

// "qui., 08/10" -> "qui, 08/10"
const rotuloDoDia = (iso) => fmtDia.format(deIso(iso)).replace('.', '');

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

// Rodapé > Horários: o que está livre na agenda agora (vem da API) e o aviso de hora marcada
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

  const total = dias ? dias.reduce((soma, d) => soma + d.horas.length, 0) : 0;

  return (
    <>
      {falhou && <p className="footer__text">Consulte os horários livres pelo WhatsApp.</p>}
      {!falhou && !dias && <p className="footer__text agenda__status">Consultando a agenda…</p>}

      {dias && total === 0 && (
        <p className="footer__text">Agenda cheia por enquanto. Chame no WhatsApp para saber de novos horários.</p>
      )}

      {dias && total > 0 && (
        <>
          <p className="agenda__resumo">
            <span className="agenda__ponto" aria-hidden="true" />
            Agenda disponível: {total} {total === 1 ? 'horário livre' : 'horários livres'}
          </p>
          <ul className="agenda__dias">
            {dias.slice(0, DIAS_MOSTRADOS).map((d) => (
              <li key={d.data}>
                <button type="button" className="hours__dia" onClick={() => onBook()}>
                  {rotuloDoDia(d.data)}
                </button>
                <span className="agenda__horas">
                  {d.horas.slice(0, HORAS_MOSTRADAS).join(' · ')}
                  {d.horas.length > HORAS_MOSTRADAS && ` +${d.horas.length - HORAS_MOSTRADAS}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <span className="footer__note">Atendimento individual, com hora marcada</span>
    </>
  );
};

export default AgendaDisponivel;
