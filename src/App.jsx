import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import AgendaDisponivel from './components/AgendaDisponivel.jsx';
import BookingModal from './components/BookingModal.jsx';
import { agruparProcedimentos, faixaDeDuracao, formatarDuracao, formatarPreco } from './procedimentos.js';
import { useProcedimentos } from './useProcedimentos.js';
import LashMark from './components/LashMark.jsx';
import Reveal from './components/Reveal.jsx';
import { textoDaTaxa } from './estudio.js';
import { useEstudio } from './useEstudio.js';
import {
  FLAGS,
  etapas,
  faq,
  inclui,
} from './data.js';
import { LenisProvider, useLenis } from './lenis.jsx';

const Logo = ({ size = 22 }) => (
  <span className="logo">
    <span className="logo__name" style={{ fontSize: size }}>ANNA STUDIO</span>
    <span className="logo__tag">
      <span className="logo__rule" />
      <span>LASH DESIGNER</span>
      <span className="logo__rule" />
    </span>
  </span>
);

const WhatsIcon = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z" />
    <path d="M9 8.5c0 3.5 2.8 6.5 6.5 6.5l1.2-1.4-2-1-.9.9c-1.3-.5-2.3-1.5-2.8-2.8l.9-.9-1-2L9.5 8.5" />
  </svg>
);

const ScrollProgress = () => {
  const lenis = useLenis();
  const barRef = useRef(null);

  useEffect(() => {
    if (!lenis) return;
    return lenis.on('scroll', ({ progress }) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    });
  }, [lenis]);

  return <div className="progress" ref={barRef} aria-hidden="true" />;
};

const Header = ({ onBook }) => {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const check = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 480 && y > last + 2 ? true : y < last - 2 ? false : (h) => h);
      last = y;
    };
    check();
    if (lenis) return lenis.on('scroll', check);
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [lenis]);

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''}`}>
      <div className="container header__inner">
        <a href="#topo" aria-label="Anna Studio, voltar ao topo"><Logo /></a>
        <nav className="nav">
          <a href="#servicos" className="nav__link">Serviços</a>
          <a href="#duvidas" className="nav__link">Dúvidas</a>
          <button type="button" className="btn btn--dark btn--sm" onClick={() => onBook()}>Agendar</button>
        </nav>
      </div>
    </header>
  );
};

const Hero = ({ onBook }) => {
  const lenis = useLenis();
  const imgRef = useRef(null);

  useEffect(() => {
    if (!lenis) return;
    return lenis.on('scroll', ({ scroll }) => {
      if (imgRef.current && scroll < 900) imgRef.current.style.translate = `0 ${scroll * 0.08}px`;
    });
  }, [lenis]);

  return (
    <section id="topo" className="section hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="eyebrow hero__in">EXTENSÃO DE CÍLIOS · FORTALEZA</div>
          <h1 className="hero__title" aria-label="Um olhar desenhado só para você.">
            {'Um olhar desenhado só para você.'.split(' ').map((w, i) => (
              <Fragment key={i}>
                <span className="word" aria-hidden="true">
                  <span style={{ animationDelay: `${0.15 + i * 0.08}s` }}>{w}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <p className="hero__lead hero__in" style={{ animationDelay: '.2s' }}>
            Extensão de cílios sob medida no Planalto Ayrton Senna. Volume brasileiro, volume egípcio e outras técnicas, com atendimento individual e hora marcada.
          </p>
          <div className="hero__in" style={{ animationDelay: '.3s' }}>
            <button type="button" className="btn btn--dark btn--lg" onClick={() => onBook()}>
              Agendar meu horário
            </button>
          </div>
        </div>
        <div className="hero__media">
          <div className="hero__frame" />
          <div className="hero__photo">
            <img ref={imgRef} src="/anna-hero.png" alt="Anna, lash designer do Anna Studio" />
            <div className="hero__shade" />
          </div>
          <div className="hero__badge">
            <span className="hero__badge-name">Anna</span>
            <span className="hero__badge-tag">LASH DESIGNER</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const Intro = () => (
  <section className="section section--sand">
    <Reveal className="container container--narrow center stack-22">
      <LashMark className="lash-draw" />
      <h2 className="h2">Imagina abrir os olhos de manhã e já se sentir bonita.</h2>
      <p className="lead-italic">Sem rímel, sem curvex, sem pressa na frente do espelho.</p>
      <p className="body">No Anna Studio, cada aplicação começa pelo seu olhar: o formato dos seus olhos, a força dos seus fios e o efeito que combina com a sua rotina.</p>
      <p className="body body--strong">O resultado é um olhar marcante, leve e natural, que dura semanas.</p>
    </Reveal>
  </section>
);

// O tempo da aplicação não é escrito à mão: vem do cadastro do painel (do menor ao maior tempo dos procedimentos).
const Etapas = () => {
  const { lista } = useProcedimentos();
  const faixa = lista ? faixaDeDuracao(lista) : '';

  return (
    <section id="como-funciona" className="section">
      <div className="container stack-56">
        <Reveal className="center stack-12">
          <div className="eyebrow">COMO FUNCIONA</div>
          <h2 className="h2">Olhar sob medida, em 4 etapas</h2>
        </Reveal>
        <div className="steps">
          {etapas.map((e, i) => (
            <Reveal key={e.n} className="step" delay={i * 90}>
              <span className="step__n">{e.n}</span>
              <h3 className="step__t">{e.t}</h3>
              <p className="body-sm">{e.comTempo && faixa ? `${e.d} O tempo depende do procedimento: ${faixa}.` : e.d}</p>
            </Reveal>
          ))}
        </div>
        <Reveal as="p" className="quote-line">Nada de cílio igual pra todo mundo. O seu é pensado pro seu rosto.</Reveal>
      </div>
    </section>
  );
};

// Lista de preços: só os procedimentos ativos do painel (com o tempo cadastrado de cada um), nunca uma lista fixa.
// Enquanto carrega, avisa; se a API falhar ou não houver nenhum, diz que não há procedimento disponível.
const useListaDePrecos = () => {
  const { estado, lista, tentarDeNovo } = useProcedimentos();
  const grupos = (lista ?? []).length
    ? agruparProcedimentos(lista).map((g) => ({
        t: g.t,
        itens: g.itens.map((p) => ({ n: p.nome, p: formatarPreco(p.valor), tempo: formatarDuracao(p.duracaoEmMinutos) })),
      }))
    : [];

  return { estado, grupos, tentarDeNovo };
};

const Servicos = ({ onBook }) => {
  const { estado, grupos: lista, tentarDeNovo } = useListaDePrecos();
  const estudio = useEstudio();
  const taxa = estudio ? textoDaTaxa(estudio) : '';

  return (
  <section id="servicos" className="section section--dark">
    <div className="container services">
      <Reveal className="stack-28">
        <div className="eyebrow eyebrow--gold">SERVIÇOS E VALORES</div>
        <h2 className="h2">Toda aplicação inclui</h2>
        <div className="stack-14">
          {inclui.map((i) => (
            <div key={i} className="check"><span className="gold-l">✓</span><span>{i}</span></div>
          ))}
        </div>
        <div className="services__meta">
          <div className="meta">
            <svg className="meta__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
              <path d="M2.5 10h19M6.5 14.5h4" />
            </svg>
            <div className="meta__text">
              <span className="meta__label">PAGAMENTO</span>
              <span className="meta__value">Pix, cartão ou dinheiro</span>
              {taxa && <span className="meta__sub">Pré-agendamento: {taxa}</span>}
            </div>
          </div>
        </div>
      </Reveal>
      <div className="stack-36">
        {estado === 'carregando' && <p className="muted-dark" role="status">Carregando os procedimentos…</p>}
        {estado !== 'carregando' && lista.length === 0 && (
          <div className="stack-14" role="status">
            <p className="muted-dark">Nenhum procedimento disponível no momento.</p>
            {estado === 'erro' && (
              <button type="button" className="link-claro" style={{ alignSelf: 'flex-start' }} onClick={tentarDeNovo}>
                Tentar de novo
              </button>
            )}
          </div>
        )}
        {lista.map((g, gi) => (
          <Reveal key={g.t} className="stack-4" delay={gi * 80}>
            <div className="eyebrow eyebrow--gold" style={{ paddingBottom: 10 }}>{g.t}</div>
            {g.itens.map((s) => (
              <button key={s.n} type="button" className="price-row" onClick={() => onBook(s.n)}>
                <span className="price-row__name">{s.n}</span>
                {s.tempo && <span className="price-row__tempo">{s.tempo}</span>}
                <span className="price-row__dots" />
                <span className="price-row__price">{s.p}</span>
              </button>
            ))}
          </Reveal>
        ))}
        <div className="cta-par">
          <button type="button" className="btn btn--gold btn--lg" onClick={() => onBook()}>
            Escolher meu horário
          </button>
          <button type="button" className="link-claro" onClick={() => onBook('', 'encaixe')}>
            Sem horário bom? Peça um encaixe
          </button>
        </div>
      </div>
    </div>
  </section>
  );
};

const Garantia = () => (
  <section className="section section--flush-top">
    <Reveal className="guarantee">
      <div className="guarantee__seal">
        <span>3</span>
        <small>DIAS DE<br />RETOQUE</small>
      </div>
      <div className="stack-12" style={{ flex: 1, minWidth: 240 }}>
        <div className="eyebrow">COMPROMISSO ANNA STUDIO</div>
        <h2 className="h3">Seu olhar precisa ficar do jeito que você sonhou.</h2>
        <p className="body-sm">Se algum fio soltar nos primeiros 3 dias, o retoque é por minha conta. Sem custo e sem burocracia.</p>
      </div>
    </Reveal>
  </section>
);

const Faq = () => {
  const [aberto, setAberto] = useState(0);
  const { lista } = useProcedimentos();
  const faixa = lista ? faixaDeDuracao(lista) : '';
  const estudio = useEstudio();
  const taxa = estudio ? textoDaTaxa(estudio) : '';
  // Tempo, taxa e endereço vêm do painel, nunca de um texto fixo; sem endereço, a pergunta "Onde fica" some
  const resposta = (f) => {
    if (f.comTempo && faixa) return `Depende do procedimento: ${faixa}. O tempo de cada um aparece na lista de valores e ao agendar.`;
    if (f.comTaxa && taxa) return `${f.a} Para garantir o horário, é cobrada uma taxa de pré-agendamento de ${taxa}.`;
    if (f.comEndereco) return `${estudio.endereco.replace(/\.$/, '')}.`;
    return f.a;
  };
  const perguntas = faq.filter((f) => !f.comEndereco || estudio?.endereco);
  return (
    <section id="duvidas" className="section">
      <div className="container container--faq stack-32">
        <Reveal className="stack-12">
          <div className="eyebrow">DÚVIDAS FREQUENTES</div>
          <h2 className="h2">Antes de agendar</h2>
        </Reveal>
        <Reveal className="faq">
          {perguntas.map((f, i) => {
            const open = aberto === i;
            return (
              <div key={f.q} className={`faq__item ${open ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="faq__q"
                  aria-expanded={open}
                  aria-controls={`faq-${i}`}
                  onClick={() => setAberto(open ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="faq__icon">+</span>
                </button>
                <div className="faq__a" id={`faq-${i}`}>
                  <div><p>{resposta(f)}</p></div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
};

const CtaFinal = ({ onBook }) => (
  <section className="section section--dark section--tall">
    <Reveal className="container container--narrow center stack-22">
      <h2 className="h1-alt">Amanhã você pode acordar e já se sentir pronta.</h2>
      <p className="muted-dark">Sem rímel, sem pressa, só você e o seu olhar do jeito que sempre quis.</p>
      <button type="button" className="btn btn--gold btn--lg" style={{ marginTop: 8 }} onClick={() => onBook()}>
        Agendar meu horário no WhatsApp
      </button>
      <span className="fine">Atendimento individual • Pix, cartão e dinheiro</span>
    </Reveal>
  </section>
);

// Ícones das redes sociais (o do WhatsApp é o WhatsIcon)
const IconeDoInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
);
const IconeDoFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6.5v3.5H9V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15V3Z" /></svg>
);
const IconeDoTiktok = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.3 2.6 2 4.3 4.5 4.5" /></svg>
);

// Redes sociais preenchidas em "Dados do estúdio" no painel, na ordem: Instagram (até 3), Facebook e TikTok
function redesDoEstudio(estudio) {
  if (!estudio) return [];
  return [
    ...estudio.instagrams.map((perfil) => ({ chave: `ig-${perfil.usuario}`, icone: <IconeDoInstagram />, rotulo: `@${perfil.usuario}`, url: perfil.url })),
    estudio.facebook && { chave: 'facebook', icone: <IconeDoFacebook />, rotulo: estudio.facebook.usuario, url: estudio.facebook.url },
    estudio.tiktok && { chave: 'tiktok', icone: <IconeDoTiktok />, rotulo: `@${estudio.tiktok.usuario}`, url: estudio.tiktok.url },
  ].filter(Boolean);
}

const Footer = ({ onBook }) => {
  const lenis = useLenis();
  const estudio = useEstudio();
  const endereco = estudio?.endereco ?? '';
  const redes = redesDoEstudio(estudio);
  const topo = () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' }));

  return (
    <footer className="footer">
      <div className="container footer__main">
        <Reveal className="footer__brand">
          <Logo size={30} />
          <p className="footer__tagline">Um olhar desenhado só para você, com atendimento individual e hora marcada.</p>
          <button type="button" className="btn btn--dark btn--lg" onClick={() => onBook()}>
            Agendar meu horário
          </button>
        </Reveal>

        {endereco && (
          <Reveal className="footer__col" delay={80}>
            <h3 className="footer__title">VISITE</h3>
            <address className="footer__text">{endereco}</address>
            <a className="footer__link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`} target="_blank" rel="noopener noreferrer">
              Ver no mapa <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
        )}

        <Reveal className="footer__col" delay={160}>
          <h3 className="footer__title">HORÁRIOS</h3>
          <AgendaDisponivel onBook={onBook} />
        </Reveal>

        <Reveal className="footer__col" delay={240}>
          <h3 className="footer__title">CONTATO</h3>
          {redes.map((rede) => (
            <a key={rede.chave} className="social" href={rede.url} target="_blank" rel="noopener noreferrer">
              <span className="social__icon">{rede.icone}</span>
              {rede.rotulo}
            </a>
          ))}
          <button type="button" className="social" onClick={() => onBook()}>
            <span className="social__icon"><WhatsIcon size={18} /></span>
            WhatsApp
          </button>
        </Reveal>
      </div>

      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} Anna Studio · Lash Designer · Fortaleza
          {estudio?.cnpj && <> · CNPJ {estudio.cnpj}</>}
        </span>
        <button type="button" className="to-top" onClick={topo}>
          Voltar ao topo
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
        </button>
      </div>
    </footer>
  );
};

const App = () => {
  const [booking, setBooking] = useState({ open: false, servico: '', modo: 'horario' });
  // modo: 'horario' (escolhe dia e hora) ou 'encaixe' (a cliente pede uma data quando nenhum horário serviu)
  const abrir = useCallback((servico = '', modo = 'horario') => setBooking({ open: true, servico, modo }), []);
  const fechar = useCallback(() => setBooking((b) => ({ ...b, open: false })), []);

  return (
    <LenisProvider>
      <div className="page">
        <ScrollProgress />
        <Header onBook={abrir} />
        <main>
          <Hero onBook={abrir} />
          <Intro />
          <Etapas />
          <Servicos onBook={abrir} />
          {FLAGS.showGuarantee && <Garantia />}
          <Faq />
          <CtaFinal onBook={abrir} />
        </main>
        <Footer onBook={abrir} />

        <button type="button" className="fab fab--pulse" aria-label="Agendar pelo WhatsApp" onClick={() => abrir()}>
          <WhatsIcon size={30} color="#fff" />
        </button>

        <BookingModal open={booking.open} servicoInicial={booking.servico} modoInicial={booking.modo} onClose={fechar} />
      </div>
    </LenisProvider>
  );
};

export default App;
