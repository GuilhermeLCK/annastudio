import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AGENDA, HORARIOS, PAGAMENTOS, TAXA_PRE_AGENDAMENTO, TURNOS, WHATSAPP_NUMBER, grupos, servicos } from '../data.js';
import { useLenis } from '../lenis.jsx';

const fmtSemanaLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const fmtMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const chaveDoDia = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const pad = (n) => String(n).padStart(2, '0');

// Calendário do mês atual: dias passados, fechados ou sem horário ficam indisponíveis
function montarMes() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const total = new Date(ano, mes + 1, 0).getDate();
  const vazios = new Date(ano, mes, 1).getDay();
  const celulas = Array.from({ length: vazios }, () => null);
  for (let n = 1; n <= total; n++) {
    const d = new Date(ano, mes, n);
    const disponivel = d >= hoje && !AGENDA.diasFechados.includes(d.getDay()) && horariosDoDia(d).length > 0;
    celulas.push({ d, disponivel, hoje: d.getTime() === hoje.getTime() });
  }
  const titulo = fmtMesAno.format(hoje);
  return { titulo: titulo[0].toUpperCase() + titulo.slice(1), celulas };
}

function horariosDoDia(dia) {
  if (!dia) return [];
  const base = HORARIOS;
  const agora = new Date();
  if (chaveDoDia(dia) !== chaveDoDia(agora)) return base;
  // Hoje: só horários com pelo menos 1h de antecedência
  const limite = agora.getHours() * 60 + agora.getMinutes() + 60;
  return base.filter((h) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm >= limite;
  });
}

// Valor especial do campo Horário: a cliente quer saber os horários livres do dia
const CONSULTAR = 'consultar';

// Sem emojis: alguns aparelhos recebem os de 4 bytes quebrados (�) via wa.me
export function montarMensagem({ nome, servico, dia, hora, pagamento }) {
  const linhas = [
    `Olá, Anna! Meu nome é ${nome.trim()} e gostaria de agendar *${servico.n}* (${servico.p}).`,
    '',
    `*Dia:* ${fmtSemanaLonga.format(dia)}, ${pad(dia.getDate())}/${pad(dia.getMonth() + 1)}`,
    hora === CONSULTAR ? '*Horário:* quais horários você tem livres nesse dia?' : `*Horário:* ${hora}`,
    `*Pagamento:* ${pagamento}`,
    '',
    `Estou ciente da taxa de pré-agendamento de ${TAXA_PRE_AGENDAMENTO}.`,
  ];
  linhas.push('', hora === CONSULTAR ? 'Fico no aguardo. Obrigada!' : 'Fico no aguardo da confirmação. Obrigada!');
  return linhas.join('\n');
}

const BookingModal = ({ open, onClose, servicoInicial }) => {
  const lenis = useLenis();
  const titleId = useId();
  const panelRef = useRef(null);
  const nomeRef = useRef(null);
  const lastFocus = useRef(null);

  const mes = useMemo(montarMes, [open]);
  const [nome, setNome] = useState('');
  const [servicoN, setServicoN] = useState('');
  const [diaKey, setDiaKey] = useState('');
  const [hora, setHora] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [tentou, setTentou] = useState(false);

  const dia = mes.celulas.find((c) => c?.disponivel && chaveDoDia(c.d) === diaKey)?.d ?? null;
  const temDiaLivre = mes.celulas.some((c) => c?.disponivel);
  const horas = horariosDoDia(dia);
  const servico = servicos.find((s) => s.n === servicoN) ?? null;

  useEffect(() => {
    if (!open) return;
    if (servicoInicial) setServicoN(servicoInicial);
    setTentou(false);
  }, [open, servicoInicial]);

  useEffect(() => {
    if (hora && hora !== CONSULTAR && !horas.includes(hora)) setHora('');
  }, [diaKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trava o scroll da página, gerencia foco e fecha com Esc
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    lenis?.stop();
    document.documentElement.classList.add('modal-open');
    const t = setTimeout(() => nomeRef.current?.focus(), 60);

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const foc = panelRef.current.querySelectorAll('button:not([disabled]), input, [href]');
      const first = foc[0];
      const last = foc[foc.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('modal-open');
      lenis?.start();
      lastFocus.current?.focus?.();
    };
  }, [open, lenis, onClose]);

  const erros = {
    nome: nome.trim().length < 2 ? 'Conta pra gente seu nome.' : '',
    servico: !servico ? 'Escolha um procedimento.' : '',
    dia: !dia ? 'Escolha o dia.' : '',
    hora: !hora ? 'Escolha um horário ou peça para consultar a disponibilidade.' : '',
    pagamento: !pagamento ? 'Escolha a forma de pagamento.' : '',
  };
  const valido = !Object.values(erros).some(Boolean);
  const mensagem = valido ? montarMensagem({ nome, servico, dia, hora, pagamento }) : '';

  const enviar = (e) => {
    e.preventDefault();
    setTentou(true);
    if (!valido) {
      const primeiro = panelRef.current?.querySelector('[data-invalid="true"]');
      primeiro?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const numero = WHATSAPP_NUMBER.replace(/\D/g, '');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
    onClose();
  };

  return (
    <div className={`modal ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="modal__backdrop" onClick={onClose} />
      <form
        ref={panelRef}
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={enviar}
        noValidate
        inert={!open}
      >
        <header className="modal__head">
          <div>
            <div className="eyebrow">AGENDAMENTO</div>
            <h2 id={titleId} className="modal__title">Reserve seu horário</h2>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="modal__body" data-lenis-prevent>
          <div className="field" data-invalid={tentou && !!erros.nome}>
            <label className="field__label" htmlFor="bk-nome">Seu nome</label>
            <input
              ref={nomeRef}
              id="bk-nome"
              className="input"
              type="text"
              autoComplete="given-name"
              placeholder="Como posso te chamar?"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={60}
            />
            {tentou && erros.nome && <span className="field__error">{erros.nome}</span>}
          </div>

          <fieldset className="field" data-invalid={tentou && !!erros.servico}>
            <legend className="field__label">Procedimento</legend>
            <div className="svc-list">
              {grupos.map((g) => (
                <div key={g.t} className="svc-group">
                  <div className="svc-group__title">{g.t}</div>
                  {g.itens.map((s) => (
                    <label key={s.n} className={`svc ${servicoN === s.n ? 'is-active' : ''}`}>
                      <input type="radio" name="servico" value={s.n} checked={servicoN === s.n} onChange={() => setServicoN(s.n)} />
                      <span className="svc__radio" aria-hidden="true" />
                      <span className="svc__name">{s.n}</span>
                      <span className="svc__dots" aria-hidden="true" />
                      <span className="svc__price">{s.p}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            {tentou && erros.servico && <span className="field__error">{erros.servico}</span>}
          </fieldset>

          <fieldset className="field" data-invalid={tentou && !!erros.dia}>
            <legend className="field__label">Dia</legend>
            <div className="cal">
              <div className="cal__title">{mes.titulo}</div>
              <div className="cal__grid" role="radiogroup" aria-label={`Dias de ${mes.titulo}`}>
                {SEMANA.map((s, i) => (
                  <span key={i} className="cal__wd" aria-hidden="true">{s}</span>
                ))}
                {mes.celulas.map((c, i) => {
                  if (!c) return <span key={`v${i}`} />;
                  const k = chaveDoDia(c.d);
                  return (
                    <label
                      key={k}
                      className={`cal__day ${diaKey === k ? 'is-active' : ''} ${c.disponivel ? '' : 'is-disabled'} ${c.hoje ? 'is-today' : ''}`}
                      title={c.disponivel ? undefined : 'Indisponível'}
                    >
                      <input
                        type="radio"
                        name="dia"
                        value={k}
                        checked={diaKey === k}
                        disabled={!c.disponivel}
                        onChange={() => setDiaKey(k)}
                        aria-label={fmtSemanaLonga.format(c.d) + ', ' + c.d.getDate()}
                      />
                      {c.d.getDate()}
                    </label>
                  );
                })}
              </div>
              {!temDiaLivre && <p className="field__hint">Não há mais dias livres este mês. Chama no WhatsApp que a gente combina.</p>}
            </div>
            {tentou && erros.dia && <span className="field__error">{erros.dia}</span>}
          </fieldset>

          <fieldset className="field" data-invalid={tentou && !!erros.hora}>
            <legend className="field__label">Horário</legend>
            {TURNOS.map((t) => (
              <div key={t.id} className="turno">
                <div className="turno__head">
                  <span className="turno__label">{t.label}</span>
                  <span className="turno__faixa">{t.inicio.replace(':00', 'h')} às {t.fim.replace(':00', 'h')}</span>
                </div>
                <div className="chips chips--time">
                  {t.horarios.map((h) => {
                    const livre = !dia || horas.includes(h);
                    return (
                      <label key={h} className={`chip ${hora === h ? 'is-active' : ''} ${livre ? '' : 'is-disabled'}`}>
                        <input type="radio" name="hora" value={h} checked={hora === h} disabled={!livre} onChange={() => setHora(h)} />
                        {h}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="turno__ou"><span>ou</span></div>
            <label className={`chip chip--consult ${hora === CONSULTAR ? 'is-active' : ''}`}>
              <input type="radio" name="hora" value={CONSULTAR} checked={hora === CONSULTAR} onChange={() => setHora(CONSULTAR)} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></svg>
              <span>
                Consultar disponibilidade
                <small>Anna te responde com os horários livres disponíveis</small>
              </span>
            </label>
            {tentou && erros.hora && <span className="field__error">{erros.hora}</span>}
          </fieldset>

          <fieldset className="field" data-invalid={tentou && !!erros.pagamento}>
            <legend className="field__label">Forma de pagamento</legend>
            <div className="chips chips--pay">
              {PAGAMENTOS.map((p) => (
                <label key={p} className={`chip ${pagamento === p ? 'is-active' : ''}`}>
                  <input type="radio" name="pagamento" value={p} checked={pagamento === p} onChange={() => setPagamento(p)} />
                  {p}
                </label>
              ))}
            </div>
            {tentou && erros.pagamento && <span className="field__error">{erros.pagamento}</span>}
          </fieldset>

          <div className="notice">
            <div className="notice__head">
              <span className="notice__label">Taxa de pré-agendamento</span>
              <span className="notice__value">{TAXA_PRE_AGENDAMENTO}</span>
            </div>
            <p>O horário é garantido após o pagamento da taxa.</p>
          </div>
        </div>

        <footer className="modal__foot">
          <button type="submit" className="btn btn--dark btn--block">
            Enviar no WhatsApp
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </footer>
      </form>
    </div>
  );
};

export default BookingModal;
