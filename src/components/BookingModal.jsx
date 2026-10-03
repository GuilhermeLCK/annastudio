import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { agendar, buscarHorarios } from '../api.js';
import { agruparProcedimentos, procedimentosDaApi } from '../procedimentos.js';
import { PAGAMENTOS, TAXA_PRE_AGENDAMENTO, WHATSAPP_NUMBER } from '../data.js';
import { useLenis } from '../lenis.jsx';

const fmtSemanaLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const fmtMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// A API libera horários até 6 meses à frente; o calendário deixa avançar até 5 meses.
const MESES_A_FRENTE = 5;
const MAXIMO_DE_PROCEDIMENTOS = 10;

const pad = (n) => String(n).padStart(2, '0');
const paraIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deIso = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
};
const soDigitos = (texto) => texto.replace(/\D/g, '');

// Máscara de telefone: (85) 98765-4321 (celular) ou (85) 3234-5678 (fixo)
function mascararTelefone(texto) {
  const d = soDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Mesmas regras da API (quem decide é ela): celular com 11 dígitos começando com 9; fixo com 10 começando com 2 a 5.
function erroDoTelefone(texto) {
  const d = soDigitos(texto);
  if (d.length < 10) return 'Informe o telefone com DDD.';
  if (d.length === 10 && /[6-9]/.test(d[2])) return 'Celular precisa do 9 na frente, por exemplo (85) 98765-4321.';
  if (d.length === 11 && d[2] !== '9') return 'Celular começa com 9 depois do DDD.';
  return '';
}

// Manhã, tarde e noite a partir da hora "HH:mm"
function turnoDaHora(hora) {
  const h = Number(hora.slice(0, 2));
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

function montarMesDoCalendario(ano, mes, diasLivres) {
  const hojeIso = paraIso(new Date());
  const total = new Date(ano, mes, 0).getDate();
  const vazios = new Date(ano, mes - 1, 1).getDay();
  const celulas = Array.from({ length: vazios }, () => null);

  for (let n = 1; n <= total; n++) {
    const iso = `${ano}-${pad(mes)}-${pad(n)}`;
    celulas.push({ iso, dia: n, d: new Date(ano, mes - 1, n), disponivel: diasLivres.has(iso), hoje: iso === hojeIso });
  }

  const titulo = fmtMesAno.format(new Date(ano, mes - 1, 1));
  return { titulo: titulo[0].toUpperCase() + titulo.slice(1), celulas };
}

const rotuloDoPagamento = (valor) => PAGAMENTOS.find((p) => p.valor === valor)?.rotulo ?? valor;

function linkDoWhatsApp(mensagem) {
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
}

// Sem emojis: alguns aparelhos recebem os de 4 bytes quebrados via wa.me
export function montarMensagem({ reserva, pagamento }) {
  const dia = deIso(reserva.data);
  const nomes = reserva.procedimentos.map((p) => p.nome).join(', ');

  return [
    `Olá, Anna! Meu nome é ${reserva.nomeCliente} e acabei de reservar pelo site: *${nomes}* (${fmtMoeda.format(reserva.total)}).`,
    '',
    `*Dia:* ${fmtSemanaLonga.format(dia)}, ${pad(dia.getDate())}/${pad(dia.getMonth() + 1)}`,
    `*Horário:* ${reserva.hora}`,
    `*Pagamento:* ${rotuloDoPagamento(pagamento)}`,
    '',
    `Estou ciente da taxa de pré-agendamento de ${TAXA_PRE_AGENDAMENTO}.`,
    '',
    'Fico no aguardo da confirmação. Obrigada!',
  ].join('\n');
}

const BookingModal = ({ open, onClose, servicoInicial }) => {
  const lenis = useLenis();
  const titleId = useId();
  const panelRef = useRef(null);
  const nomeRef = useRef(null);
  const lastFocus = useRef(null);

  const hoje = useMemo(() => new Date(), [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const [mesVisto, setMesVisto] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 });

  const [procedimentos, setProcedimentos] = useState(null);
  const [erroDeCarga, setErroDeCarga] = useState('');
  const [horarios, setHorarios] = useState(null);
  const [erroDosHorarios, setErroDosHorarios] = useState('');

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [diaIso, setDiaIso] = useState('');
  const [hora, setHora] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroDoEnvio, setErroDoEnvio] = useState('');
  const [reserva, setReserva] = useState(null);

  // Ao abrir: volta ao estado inicial e busca os procedimentos
  useEffect(() => {
    if (!open) return;
    const agora = new Date();
    setMesVisto({ ano: agora.getFullYear(), mes: agora.getMonth() + 1 });
    setNome('');
    setTelefone('');
    setSelecionados([]);
    setDiaIso('');
    setHora('');
    setPagamento('');
    setTentou(false);
    setErroDoEnvio('');
    setReserva(null);
    setErroDeCarga('');
    setProcedimentos(null);

    let ativo = true;
    procedimentosDaApi()
      .then((lista) => ativo && setProcedimentos(lista))
      .catch((e) => ativo && setErroDeCarga(e.message));
    return () => {
      ativo = false;
    };
  }, [open]);

  // Procedimento escolhido na lista de preços da página já vem marcado
  useEffect(() => {
    if (!open || !procedimentos || !servicoInicial) return;
    const achado = procedimentos.find((p) => p.nome.trim().toLowerCase() === servicoInicial.trim().toLowerCase());
    if (achado) setSelecionados((atuais) => (atuais.includes(achado.id) ? atuais : [...atuais, achado.id]));
  }, [open, procedimentos, servicoInicial]);

  const carregarHorarios = useCallback(async (ano, mes) => {
    setErroDosHorarios('');
    try {
      const resposta = await buscarHorarios(ano, mes);
      setHorarios({ ano, mes, dias: new Map(resposta.dias.map((d) => [d.data, d.horas])) });
    } catch (e) {
      setHorarios(null);
      setErroDosHorarios(e.message);
    }
  }, []);

  // Horários livres do mês que está na tela
  useEffect(() => {
    if (!open) return;
    setHorarios(null);
    carregarHorarios(mesVisto.ano, mesVisto.mes);
  }, [open, mesVisto, carregarHorarios]);

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
      const foc = panelRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), [href]');
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

  const mes = useMemo(
    () => (horarios ? montarMesDoCalendario(horarios.ano, horarios.mes, new Set(horarios.dias.keys())) : null),
    [horarios],
  );
  const podeVoltar = mesVisto.ano * 12 + mesVisto.mes > hoje.getFullYear() * 12 + hoje.getMonth() + 1;
  const podeAvancar = mesVisto.ano * 12 + mesVisto.mes < hoje.getFullYear() * 12 + hoje.getMonth() + 1 + MESES_A_FRENTE;
  const trocarMes = (passo) =>
    setMesVisto(({ ano, mes: m }) => {
      const total = ano * 12 + (m - 1) + passo;
      return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
    });

  const horasDoDia = (horarios && diaIso && horarios.dias.get(diaIso)) || [];
  const turnos = ['Manhã', 'Tarde', 'Noite']
    .map((t) => ({ t, horas: horasDoDia.filter((h) => turnoDaHora(h) === t) }))
    .filter((t) => t.horas.length > 0);

  const escolhidos = (procedimentos ?? []).filter((p) => selecionados.includes(p.id));
  const total = escolhidos.reduce((soma, p) => soma + p.valor, 0);
  const lista = useMemo(() => agruparProcedimentos(procedimentos ?? []), [procedimentos]);

  const alternarProcedimento = (id) =>
    setSelecionados((atuais) => {
      if (atuais.includes(id)) return atuais.filter((x) => x !== id);
      return atuais.length >= MAXIMO_DE_PROCEDIMENTOS ? atuais : [...atuais, id];
    });

  const erros = {
    nome: nome.trim().length < 2 ? 'Conta pra gente seu nome.' : '',
    telefone: erroDoTelefone(telefone),
    servico: escolhidos.length === 0 ? 'Escolha ao menos um procedimento.' : '',
    dia: !diaIso ? 'Escolha o dia.' : '',
    hora: !hora ? 'Escolha um horário.' : '',
    pagamento: !pagamento ? 'Escolha a forma de pagamento.' : '',
  };
  const valido = !Object.values(erros).some(Boolean);

  const enviar = async (e) => {
    e.preventDefault();
    setTentou(true);
    if (!valido) {
      const primeiro = panelRef.current?.querySelector('[data-invalid="true"]');
      primeiro?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setEnviando(true);
    setErroDoEnvio('');
    try {
      const resposta = await agendar({
        data: diaIso,
        hora,
        procedimentoIds: selecionados,
        nomeCliente: nome.trim(),
        telefone: soDigitos(telefone),
        formaDePagamento: pagamento,
      });
      setReserva(resposta);
    } catch (erro) {
      setErroDoEnvio(erro.message);
      if (erro.status === 409) {
        // Alguém reservou esse horário antes: tira a escolha e mostra os horários atualizados
        setHora('');
        carregarHorarios(mesVisto.ano, mesVisto.mes);
      }
    } finally {
      setEnviando(false);
    }
  };

  const semAgenda = Boolean(erroDeCarga);

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
            <h2 id={titleId} className="modal__title">{reserva ? 'Horário reservado' : 'Reserve seu horário'}</h2>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        {reserva ? (
          <>
            <div className="modal__body" data-lenis-prevent>
              <p className="done__lead">
                Pronto, {reserva.nomeCliente.split(' ')[0]}! Seu horário está reservado e <strong>aguarda a confirmação da Anna</strong>.
              </p>
              <dl className="done">
                <div><dt>Dia</dt><dd>{fmtSemanaLonga.format(deIso(reserva.data))}, {deIso(reserva.data).toLocaleDateString('pt-BR')}</dd></div>
                <div><dt>Horário</dt><dd>{reserva.hora}</dd></div>
                <div><dt>Procedimentos</dt><dd>{reserva.procedimentos.map((p) => p.nome).join(', ')}</dd></div>
                <div><dt>Total</dt><dd>{fmtMoeda.format(reserva.total)}</dd></div>
                <div><dt>Pagamento</dt><dd>{rotuloDoPagamento(pagamento)}</dd></div>
              </dl>
              <p className="obs">
                Para garantir o horário, é cobrada uma taxa de pré-agendamento de {TAXA_PRE_AGENDAMENTO}. Toque abaixo para avisar a Anna pelo WhatsApp e combinar o pagamento.
              </p>
            </div>
            <footer className="modal__foot modal__foot--stack">
              <a className="btn btn--gold btn--block" href={linkDoWhatsApp(montarMensagem({ reserva, pagamento }))} target="_blank" rel="noopener noreferrer">
                Avisar a Anna no WhatsApp
              </a>
              <button type="button" className="btn btn--block btn--ghost" onClick={onClose}>Fechar</button>
            </footer>
          </>
        ) : (
          <>
            <div className="modal__body" data-lenis-prevent>
              {semAgenda ? (
                <div className="aviso-erro" role="alert">
                  <p>{erroDeCarga}</p>
                  <p>Você ainda pode combinar seu horário direto com a Anna pelo WhatsApp.</p>
                  <a className="btn btn--gold btn--block" href={linkDoWhatsApp('Olá, Anna! Gostaria de agendar um horário.')} target="_blank" rel="noopener noreferrer">
                    Chamar no WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <div className="field" data-invalid={tentou && !!erros.nome}>
                    <label className="field__label" htmlFor="bk-nome">Seu nome</label>
                    <input
                      ref={nomeRef}
                      id="bk-nome"
                      className="input"
                      type="text"
                      autoComplete="name"
                      placeholder="Como posso te chamar?"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      maxLength={150}
                    />
                    {tentou && erros.nome && <span className="field__error">{erros.nome}</span>}
                  </div>

                  <div className="field" data-invalid={tentou && !!erros.telefone}>
                    <label className="field__label" htmlFor="bk-telefone">Seu WhatsApp</label>
                    <input
                      id="bk-telefone"
                      className="input"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="(85) 98765-4321"
                      value={telefone}
                      onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                    />
                    {tentou && erros.telefone && <span className="field__error">{erros.telefone}</span>}
                  </div>

                  <fieldset className="field" data-invalid={tentou && !!erros.servico}>
                    <legend className="field__label">
                      Procedimentos <span className="field__opt">(escolha um ou mais)</span>
                    </legend>
                    <div className="svc-list">
                      {!procedimentos && <p className="field__hint">Carregando procedimentos…</p>}
                      {lista.map((g) => (
                        <div key={g.t} className="svc-group">
                          <div className="svc-group__title">{g.t}</div>
                          {g.itens.map((p) => {
                            const marcado = selecionados.includes(p.id);
                            const travado = !marcado && selecionados.length >= MAXIMO_DE_PROCEDIMENTOS;
                            return (
                              <label key={p.id} className={`svc ${marcado ? 'is-active' : ''}`}>
                                <input type="checkbox" name="servico" value={p.id} checked={marcado} disabled={travado} onChange={() => alternarProcedimento(p.id)} />
                                <span className="svc__radio svc__radio--box" aria-hidden="true" />
                                <span className="svc__name">{p.nome}</span>
                                <span className="svc__dots" aria-hidden="true" />
                                <span className="svc__price">{fmtMoeda.format(p.valor)}</span>
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    {escolhidos.length > 0 && (
                      <div className="total">
                        <span>{escolhidos.length} {escolhidos.length === 1 ? 'procedimento' : 'procedimentos'}</span>
                        <strong>{fmtMoeda.format(total)}</strong>
                      </div>
                    )}
                    {tentou && erros.servico && <span className="field__error">{erros.servico}</span>}
                  </fieldset>

                  <fieldset className="field" data-invalid={tentou && !!erros.dia}>
                    <legend className="field__label">Dia</legend>
                    <div className="cal">
                      <div className="cal__head">
                        <button type="button" className="cal__nav" onClick={() => trocarMes(-1)} disabled={!podeVoltar} aria-label="Mês anterior">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                        </button>
                        <div className="cal__title">{mes ? mes.titulo : fmtMesAno.format(new Date(mesVisto.ano, mesVisto.mes - 1, 1))}</div>
                        <button type="button" className="cal__nav" onClick={() => trocarMes(1)} disabled={!podeAvancar} aria-label="Próximo mês">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                        </button>
                      </div>
                      {erroDosHorarios ? (
                        <p className="field__hint">{erroDosHorarios}</p>
                      ) : !mes ? (
                        <p className="field__hint">Buscando os horários livres…</p>
                      ) : (
                        <div className="cal__grid" role="radiogroup" aria-label={`Dias de ${mes.titulo}`}>
                          {SEMANA.map((s, i) => (
                            <span key={i} className="cal__wd" aria-hidden="true">{s}</span>
                          ))}
                          {mes.celulas.map((c, i) => {
                            if (!c) return <span key={`v${i}`} />;
                            return (
                              <label
                                key={c.iso}
                                className={`cal__day ${diaIso === c.iso ? 'is-active' : ''} ${c.disponivel ? '' : 'is-disabled'} ${c.hoje ? 'is-today' : ''}`}
                                title={c.disponivel ? undefined : 'Indisponível'}
                              >
                                <input
                                  type="radio"
                                  name="dia"
                                  value={c.iso}
                                  checked={diaIso === c.iso}
                                  disabled={!c.disponivel}
                                  onChange={() => {
                                    setDiaIso(c.iso);
                                    setHora('');
                                  }}
                                  aria-label={fmtSemanaLonga.format(c.d) + ', ' + c.dia}
                                />
                                {c.dia}
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {mes && mes.celulas.every((c) => !c || !c.disponivel) && (
                        <p className="field__hint">Sem horários livres neste mês. Veja o próximo mês ou chame a Anna no WhatsApp.</p>
                      )}
                    </div>
                    {tentou && erros.dia && <span className="field__error">{erros.dia}</span>}
                  </fieldset>

                  <fieldset className="field" data-invalid={tentou && !!erros.hora}>
                    <legend className="field__label">Horário</legend>
                    {!diaIso && <p className="field__hint">Escolha um dia para ver os horários livres.</p>}
                    {turnos.map((t) => (
                      <div key={t.t} className="turno">
                        <div className="turno__head">
                          <span className="turno__label">{t.t}</span>
                        </div>
                        <div className="chips chips--time">
                          {t.horas.map((h) => (
                            <label key={h} className={`chip ${hora === h ? 'is-active' : ''}`}>
                              <input type="radio" name="hora" value={h} checked={hora === h} onChange={() => setHora(h)} />
                              {h}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {tentou && erros.hora && <span className="field__error">{erros.hora}</span>}
                  </fieldset>

                  <fieldset className="field" data-invalid={tentou && !!erros.pagamento}>
                    <legend className="field__label">Forma de pagamento</legend>
                    <div className="chips chips--pay">
                      {PAGAMENTOS.map((p) => (
                        <label key={p.valor} className={`chip ${pagamento === p.valor ? 'is-active' : ''}`}>
                          <input type="radio" name="pagamento" value={p.valor} checked={pagamento === p.valor} onChange={() => setPagamento(p.valor)} />
                          {p.rotulo}
                        </label>
                      ))}
                    </div>
                    {tentou && erros.pagamento && <span className="field__error">{erros.pagamento}</span>}
                  </fieldset>

                  <p className="obs">Obs.: para garantir o horário, é cobrada uma taxa de pré-agendamento de {TAXA_PRE_AGENDAMENTO}.</p>

                  {erroDoEnvio && (
                    <p className="form-error" role="alert">{erroDoEnvio}</p>
                  )}
                </>
              )}
            </div>

            {!semAgenda && (
              <footer className="modal__foot">
                <button type="submit" className="btn btn--dark btn--block" disabled={enviando || !procedimentos}>
                  {enviando ? 'Reservando…' : 'Reservar meu horário'}
                  {!enviando && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  )}
                </button>
              </footer>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default BookingModal;
