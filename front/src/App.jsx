import { useState, useEffect, useRef } from 'react'
import { api } from './lib/api.js'
import { waLink } from './lib/config.js'
import fotoFallback from './assets/avatar-sobre.png'
import './App.css'

// Fallback caso a API esteja fora — mesmo conteúdo do seed do banco.
const FALLBACK_PROJETOS = [
  { id: 'f1', titulo: 'Sistema de agendamento de eventos', problema: 'marcação de eventos sem organização, com falta de planejamento e mais.', solucao: 'sistema de agendamento externo e interno, com painel de controle, cadastro de usuarios, acompanhamento de solicitação, etc..', imagem_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60' },
  { id: 'f2', titulo: 'Loja de Vendas Online', problema: 'vendas por whatsapp, alta demanda de atendimento e entrega.', solucao: 'Sistema de compras online, com pagamento confiável pelo Mercado Pago, gestão de pedidos, produtos e entregas.', imagem_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60' },
  { id: 'f3', titulo: 'Landing de Captação', problema: 'conversão baixa.', solucao: 'página rápida que dobrou leads qualificados.', imagem_url: '' },
];
const FALLBACK_DEPS = [
  { id: 'd1', texto: 'O painel reduziu 90% do nosso trabalho manual de fechamento. Roda sozinho.', nome: 'Marina Costa', cargo: 'COO · Vetor Log' },
  { id: 'd2', texto: 'API enxuta e documentada. Integração levou dias, não meses.', nome: 'Diego Ramos', cargo: 'Head de Produto · Nuvem' },
  { id: 'd3', texto: 'A landing dobrou nossos leads qualificados na primeira quinzena.', nome: 'Paula Menezes', cargo: 'Fundadora · Karta' },
];
const FALLBACK_BIO = { titulo: 'Lógica de engenharia,\nresultado de negócio.', texto: 'Acredito que todo processo repetitivo é um sistema esperando ser construído. Uso Python e arquitetura limpa para transformar dor operacional em software que escala — com medição, teste e deploy sem surpresas.', sub: 'Eficiência operacional através de automações, integrações e infraestrutura para operações que não podem parar.' };
const FALLBACK_FOTO = fotoFallback;

// Faixa de valor padrão para cada tipo de projeto — ao trocar o tipo,
// o select de orçamento já carrega o valor correspondente.
const ORCAMENTO_POR_PROJETO = {
  'Desenvolvimento de APIs': 'R$ 2k - 3,5k',
  'Landing Pages': 'R$ 800 - 1k',
  'Web Apps': 'R$ 3k - 5k',
  'Automações de Processos': 'R$ 3k - 6k',
  'Outro': 'Ainda não sei (sob consulta)',
};
const FORM_INICIAL = {nome:'', email:'', telefone:'', projeto:'Desenvolvimento de APIs', orcamento: ORCAMENTO_POR_PROJETO['Desenvolvimento de APIs'], mensagem:''};

export default function App(){
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(1) // second item open as in prototype
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [sent, setSent] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [site, setSite] = useState(null)
  const [caseAberto, setCaseAberto] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [fb, setFb] = useState({nome:'', cargo:'', texto:''})
  const [fbSent, setFbSent] = useState(false)
  const [fbErro, setFbErro] = useState('')
  const [fbEnviando, setFbEnviando] = useState(false)

  useEffect(()=>{
    api.obterSite().then(setSite).catch(()=>{});
  },[])

  const projetos = site?.projetos?.length ? site.projetos : FALLBACK_PROJETOS;
  const depoimentos = site?.depoimentos?.length ? site.depoimentos : FALLBACK_DEPS;
  const bio = site?.bio || FALLBACK_BIO;
  const foto = site?.foto_url || FALLBACK_FOTO;

  useEffect(()=>{
    const onScroll = ()=> setScrolled(window.scrollY>10)
    window.addEventListener('scroll', onScroll)
    return()=> window.removeEventListener('scroll', onScroll)
  },[])

  useEffect(()=>{
    document.body.style.overflow = modalOpen ? 'hidden' : ''
  },[modalOpen])

  useEffect(()=>{
    document.body.style.overflow = caseAberto ? 'hidden' : ''
  },[caseAberto])

  useEffect(()=>{
    document.body.style.overflow = feedbackOpen ? 'hidden' : ''
  },[feedbackOpen])

  const handleFeedback = async (e)=>{
    e.preventDefault()
    if(!fb.nome || !fb.texto){ setFbErro('Preencha nome e feedback'); return }
    setFbErro(''); setFbEnviando(true)
    try {
      await api.enviarDepoimento({ nome: fb.nome, cargo: fb.cargo, texto: fb.texto })
      setFbSent(true)
      setFb({nome:'', cargo:'', texto:''})
    } catch(err) {
      setFbErro(err.message || 'Falha ao enviar.')
    } finally {
      setFbEnviando(false)
    }
  }

  const handleProjetoChange = (e)=>{
    const projeto = e.target.value
    setForm({...form, projeto, orcamento: ORCAMENTO_POR_PROJETO[projeto] || form.orcamento})
  }

  // Enviar só habilita com os obrigatórios preenchidos
  const formValido = form.nome.trim() && form.email.trim() && form.mensagem.trim();
  const fbValido = fb.nome.trim() && fb.texto.trim();

  const handleSubmit = async (e)=>{
    e.preventDefault()
    if(!form.nome || !form.email || !form.mensagem){ setErro('Preencha nome, e-mail e mensagem'); return }
    setErro(''); setEnviando(true)
    try {
      await api.enviarOrcamento({
        nome: form.nome, email: form.email,
        telefone: form.telefone.trim() || undefined,
        tipo_projeto: form.projeto,
        orcamento_estimado: form.orcamento, mensagem: form.mensagem, consent_lgpd: true,
      })
      setSent(true)
      setTimeout(()=>{ setSent(false); setModalOpen(false); setForm(FORM_INICIAL) }, 2500)
    } catch(err) {
      setErro(err.message || 'Falha ao enviar. Tente pelo WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {/* HEADER */}
      <header className={`header ${scrolled?'scrolled':''}`}>
        <div className="container header-inner">
          <a href="#" className="logo"><span className="logo-dot"/> mayckon.dev</a>
          <nav className="nav">
            <a href="#portfolio">Portfólio</a>
            <a href="#habilidades">Habilidades</a>
            <a href="#servicos">Serviços</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <button className="btn-primary" onClick={()=>setModalOpen(true)}>Solicitar Orçamento</button>
            <button className="menu-btn" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="menu">{mobileOpen?'✕':'☰'}</button>
          </div>
        </div>
        <div className="container">
          <div className={`mobile-nav ${mobileOpen?'open':''}`}>
            <a href="#portfolio" onClick={()=>setMobileOpen(false)}>Portfólio</a>
            <a href="#habilidades" onClick={()=>setMobileOpen(false)}>Habilidades</a>
            <a href="#servicos" onClick={()=>setMobileOpen(false)}>Serviços</a>
            <a href="#faq" onClick={()=>setMobileOpen(false)}>FAQ</a>
            <button className="btn-primary" onClick={()=>{setMobileOpen(false);setModalOpen(true)}}>Solicitar Orçamento</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge"><i/> Disponível para novos projetos</span>
            <h1>Crio sistemas, APIs e landing pages que <span>automatizam</span> seu negócio.</h1>
            <p>Foco em backend escalável, integrações e performance — a tecnologia certa para transformar processos manuais em sistemas que rodam sozinhos.</p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={()=>setModalOpen(true)}>Solicitar orçamento</button>
              <a href="#portfolio" className="btn-outline">Ver portfólio</a>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <div className="terminal-dots"><span style={{background:'#FF5F57'}}/><span style={{background:'#FFBD2E'}}/><span style={{background:'#28C840'}}/></div>
              <span style={{marginLeft:8}}>api-gateway — v2.4.1</span>
            </div>
            <div className="terminal-body">
              <div><span style={{color:'#8B8BA7'}}>$</span> deploy --prod</div>
              <div className="ok">→ build ok · 142ms</div>
              <div className="ok2">✓ /auth · 200 in 38ms</div>
              <div className="ok2">✓ /webhooks · 200 in 41ms</div>
              <div className="cmt"># uptime 99.98% · p95 82ms</div>
              <div><span style={{color:'#8B8BA7'}}>$</span> <span style={{background:'#9B6BFF',color:'white',padding:'0 6px'}}>█</span></div>
            </div>
            <div className="terminal-stats">
              <div className="s1"><strong>99.98%</strong><span>UPTIME</span></div>
              <div className="s2"><strong>82ms</strong><span>P95</span></div>
              <div className="s3"><strong>1.2k</strong><span>REQ/S</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <div className="proof">
        <div className="container proof-inner">
          <span><strong>Projetos entregues com</strong> confiança</span>
          <span>para empresas que <strong>automatizaram o operacional</strong></span>
          <span>com foco em <strong className="hl">performance e escalabilidade</strong></span>
        </div>
      </div>

      {/* PORTFOLIO */}
      <section id="portfolio" className="section">
        <div className="container">
          <div className="eyebrow">(A) PORTFÓLIO</div>
          <h2 className="section-title">Problemas reais,<br/>soluções que rodam.</h2>
          <div className="portfolio-grid">
            {projetos.map((p)=>{
              const capa = p.capa_url || p.imagem_url;
              return (
              <article key={p.id} className="p-card">
                <div className="p-img">
                  <div className="p-img-inner">
                    {capa
                      ? <img src={capa} alt={p.titulo} loading="lazy"/>
                      : <div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',background:'#0B0B1A',color:'white',padding:16}}>
                          <div style={{textAlign:'left',width:'100%'}}>
                            <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{p.titulo}</div>
                            <div style={{width:70,height:8,background:'#9B6BFF',borderRadius:4,marginTop:10}}/>
                          </div>
                        </div>}
                  </div>
                </div>
                <div className="p-body">
                  <h3>{p.titulo}</h3>
                  <p><b>Problema:</b> {p.problema} <b> Solução:</b> {p.solucao}</p>
                  <button className="p-link" style={{background:'none',border:'none',cursor:'pointer',padding:0}} onClick={()=>setCaseAberto(p)}>Ver case completo →</button>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="section" style={{paddingTop:0}}>
        <div className="container about-grid">
          <div className="about-photo">
            <img src={foto} alt="Mayckon - foto profissional"/>
            <div className="about-floats" aria-hidden="true">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="" loading="lazy" />
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="" loading="lazy" />
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="" loading="lazy" />
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="" loading="lazy" />
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="" loading="lazy" />
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="" loading="lazy" />
            </div>
          </div>
          <div className="about-content">
            <div className="eyebrow">(B) SOBRE MIM</div>
            <h2>{bio.titulo.split('\n').map((l,i)=>(<span key={i}>{l}{i===0 && <br/>}</span>))}</h2>
            <p>{bio.texto}</p>
            {!!bio.sub && <p className="sub">{bio.sub}</p>}
          </div>
        </div>
      </section>

      {/* HABILIDADES */}
      <section id="habilidades" className="section" style={{paddingTop:0}}>
        <div className="container">
          <div className="eyebrow">(C) HABILIDADES</div>
          <h2 className="section-title">Stack que entrega.</h2>
          <Habilidades />
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="section">
        <div className="container">
          <div className="eyebrow">(D) SERVIÇOS</div>
          <h2 className="section-title">Quatro frentes, um objetivo: menos trabalho manual.</h2>
          <div className="services-grid">
            <div className="s-card">
              <div className="s-num">01</div>
              <h3>Desenvolvimento de APIs</h3>
              <p>Integrações e backend escalável, documentado e pronto para receber tráfego real.</p>
              <div className="s-price">R$ 2k – R$ 3,5k</div>
            </div>
            <div className="s-card">
              <div className="s-num">02</div>
              <h3>Landing Pages</h3>
              <p>Páginas rápidas e otimizadas para conversão, prontas para captar leads.</p>
              <div className="s-price">R$ 800 – R$ 1k</div>
            </div>
            <div className="s-card">
              <div className="s-num">03</div>
              <h3>Web Apps</h3>
              <p>Aplicações completas integradas a banco de dados, com painel e autenticação.</p>
              <div className="s-price">R$ 3k – R$ 5k</div>
            </div>
            <div className="s-card">
              <div className="s-num">04</div>
              <h3>Automações de Processos</h3>
              <p>Scripts e pipelines que eliminam tarefas repetitivas e reduzem retrabalho.</p>
              <div className="s-price">R$ 3k – R$ 6k</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section" style={{paddingTop:0}}>
        <div className="container">
          <div className="eyebrow">(E) COMO FUNCIONA</div>
          <h2 className="section-title">Do briefing ao deploy, em 4 passos.</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div><div className="step-line"/>
              <h4>Briefing e Requisitos</h4>
              <p>Entender o processo e o que precisa ser automatizado.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div><div className="step-line"/>
              <h4>Arquitetura e Lógica</h4>
              <p>Definir a solução técnica e o desenho do sistema.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div><div className="step-line"/>
              <h4>Desenvolvimento</h4>
              <p>Código testado, com entregas em ciclos curtos.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h4>Deploy e Entrega</h4>
              <p>Publicação, monitoramento e documentação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="section" style={{paddingTop:0}}>
        <div className="container">
          <div className="eyebrow">(F) DEPOIMENTOS</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:28}}>
            <h2 className="section-title" style={{marginBottom:0}}>Quem já automatizou.</h2>
            <button className="btn-outline" onClick={()=>{setFbSent(false);setFbErro('');setFeedbackOpen(true)}}>💬 Deixar meu feedback</button>
          </div>
          <div className="testi-grid">
            {depoimentos.map((d)=>(
              <div key={d.id} className="t-card">
                <p>“{d.texto}”</p>
                <div className="t-head">
                  <div><strong>{d.nome}</strong><span>{d.cargo}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" style={{paddingTop:0}}>
        <div className="container">
          <div className="eyebrow">(G) FAQ</div>
          <h2 className="section-title">Perguntas frequentes.</h2>
          <div className="faq">
            {[
              {q:'Quais são os prazos de entrega?', a:'Landing pages: 7–10 dias úteis. APIs e automações: 2–4 semanas dependendo do escopo. Sempre com cronograma e entregas parciais no Notion/GitHub.'},
              {q:'Quais tecnologias você utiliza?', a:'PostgreSQL, Python, FastAPI, HTML, CSS, JS e React — com infraestrutura na Vercel. Escolho a combinação certa para cada contexto.'},
              {q:'Tem suporte pós-entrega?', a:'Sim — 15 dias de ajustes inclusos + documentação, Loom de handoff e monitoramento inicial. Suporte contínuo sob contrato mensal se precisar.'},
              {q:'Formas de pagamento?', a:'50% para reservar agenda + 50% na entrega. Pix ou até 12x no cartão (com taxa). Nota fiscal inclusa.'},
            ].map((f,i)=>(
              <div key={f.q} className={`faq-item ${faqOpen===i?'open':''}`}>
                <button className="faq-q" onClick={()=> setFaqOpen(faqOpen===i ? -1 : i)}>
                  <span>{f.q}</span><span>{faqOpen===i ? '×' : '+'}</span>
                </button>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta">
        <div className="container">
          <h2>Pronto para <span>automatizar</span> seu negócio?</h2>
          <button className="btn-primary" onClick={()=>setModalOpen(true)}>Solicitar Orçamento</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <a href="https://github.com" target="_blank" rel="noreferrer">◧ GitHub</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">in LinkedIn</a>
            <a href="mailto:ola@mayckon.dev">✉ ola@mayckon.dev</a>
          </div>
          <div className="footer-copy">© 2026 mayckon.dev — Todos os direitos reservados.</div>
        </div>
      </footer>

      {/* MODAL ORÇAMENTO */}
      {modalOpen && (
        <div className="modal-overlay" onClick={()=>setModalOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <h3>Vamos criar algo incrível juntos?</h3>
              <button onClick={()=>setModalOpen(false)}>✕</button>
            </div>
            <p>Respondo em até 2h úteis. Ou chama direto no WhatsApp — converte mais rápido.</p>

            {sent && <div className="success">✅ Recebido! Te respondo em até 2h. Se for urgente, chama no WhatsApp.</div>}
            {erro && <div className="success" style={{background:'rgba(239,68,68,.1)',borderColor:'rgba(239,68,68,.3)',color:'#FCA5A5'}}>{erro}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-grid two">
                <div className="field">
                  <label>Nome *</label>
                  <input placeholder="Seu nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} />
                </div>
                <div className="field">
                  <label>E-mail *</label>
                  <input type="email" placeholder="voce@empresa.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
                </div>
              </div>

              <div className="field">
                <label>Telefone / WhatsApp</label>
                <input type="tel" placeholder="(61) 98409-2729" maxLength={20} value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})} />
              </div>

              <div className="form-grid two">
                <div className="field">
                  <label>Tipo de projeto</label>
                  <select value={form.projeto} onChange={handleProjetoChange}>
                    <option>Desenvolvimento de APIs</option>
                    <option>Landing Pages</option>
                    <option>Web Apps</option>
                    <option>Automações de Processos</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="field">
                  <label>Orçamento estimado</label>
                  <select value={form.orcamento} onChange={e=>setForm({...form, orcamento:e.target.value})}>
                    <option>R$ 800 - 1k</option>
                    <option>R$ 2k - 3,5k</option>
                    <option>R$ 3k - 5k</option>
                    <option>R$ 3k - 6k</option>
                    <option>Ainda não sei (sob consulta)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Mensagem *</label>
                <textarea placeholder="Conte em 2-3 linhas: o que precisa automatizar, volume e prazo ideal..." value={form.mensagem} onChange={e=>setForm({...form, mensagem:e.target.value})} />
              </div>

              <div className="form-foot">
                <button type="submit" className="btn-primary" style={{flex:1,padding:'12px'}} disabled={!formValido || enviando} title={!formValido ? 'Preencha nome, e-mail e mensagem' : undefined}>{enviando ? 'Enviando…' : 'Enviar mensagem →'}</button>
                <a href={waLink('Olá Mayckon, quero um orçamento!')} target="_blank" rel="noreferrer" className="wa-btn">💬 WhatsApp direto</a>
              </div>
              <div style={{fontSize:11,color:'#6B6B8A',marginTop:10,textAlign:'center'}}>Ao enviar você concorda em receber resposta por e-mail/WhatsApp.</div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CASE COMPLETO */}
      {caseAberto && <CaseModal projeto={caseAberto} onFechar={()=>setCaseAberto(null)} />}

      {/* MODAL FEEDBACK */}
      {feedbackOpen && (
        <div className="modal-overlay" onClick={()=>setFeedbackOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <h3>💬 Deixe seu feedback</h3>
              <button onClick={()=>setFeedbackOpen(false)}>✕</button>
            </div>
            <p>Conte como foi trabalhar comigo — seu depoimento aparece no site após aprovação.</p>

            {fbSent && <div className="success">✅ Obrigado pelo feedback! Ele será publicado após aprovação. 🙏</div>}
            {fbErro && <div className="success" style={{background:'rgba(239,68,68,.1)',borderColor:'rgba(239,68,68,.3)',color:'#FCA5A5'}}>{fbErro}</div>}

            {!fbSent && (
            <form onSubmit={handleFeedback}>
              <div className="form-grid two">
                <div className="field">
                  <label>Seu nome *</label>
                  <input placeholder="Paulo Henrique" value={fb.nome} onChange={e=>setFb({...fb, nome:e.target.value})} />
                </div>
                <div className="field">
                  <label>Cargo · Empresa</label>
                  <input placeholder="Micro-Empresário - Jp Croco" value={fb.cargo} onChange={e=>setFb({...fb, cargo:e.target.value})} />
                </div>
              </div>
              <div className="field">
                <label>Feedback *</label>
                <textarea placeholder="Como foi o projeto, o que mudou no seu negócio…" value={fb.texto} onChange={e=>setFb({...fb, texto:e.target.value})} />
              </div>
              <div className="form-foot">
                <button type="submit" className="btn-primary" style={{flex:1,padding:'12px'}} disabled={!fbValido || fbEnviando} title={!fbValido ? 'Preencha nome e feedback' : undefined}>{fbEnviando ? 'Enviando…' : 'Enviar feedback →'}</button>
              </div>
            </form>
            )}
            {fbSent && <button className="btn-outline" style={{width:'100%',marginTop:8}} onClick={()=>setFeedbackOpen(false)}>Fechar</button>}
          </div>
        </div>
      )}
    </>
  )
}

function SkillBar({ nome, pct, dim }){
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);
  const [num, setNum] = useState(0);
  useEffect(()=>{
    const el = ref.current;
    if(!el) return;
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){ setVisivel(true); obs.disconnect(); }
    }, {threshold:.4});
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);
  useEffect(()=>{
    if(!visivel) return;
    let raf;
    const t0 = performance.now(), dur = 1200;
    const tick = (t)=>{
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setNum(Math.round(eased * pct));
      if(p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[visivel, pct]);
  return (
    <div ref={ref} className="skill" style={dim ? {opacity:.35} : undefined}>
      <div className="skill-head"><span>{nome}</span><strong>{num}%</strong></div>
      <div className="skill-track">
        <div className="skill-fill" style={{width: visivel ? pct + '%' : '0%'}} />
      </div>
    </div>
  );
}

const NIVEL_CSS = 85;

const SKILLS = [
  { nome: 'Python', pct: '97%', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { nome: 'PostgreSQL', pct: '85%', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { nome: 'HTML', pct: '90%', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { nome: 'Vercel', pct: '70%', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg', invert: true },
  { nome: 'CSS', pct: '85%', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { nome: 'JavaScript', pct: '65%', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { nome: 'React', pct: 'em aprendizado', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
];

function SkillIcon({ nome, src, pct, invert, ativo, onAtivo }){
  const [falhou, setFalhou] = useState(false);
  return (
    <button type="button" className={`sk-tile${ativo ? ' active' : ''}`}
      onMouseEnter={() => onAtivo(nome)} onMouseLeave={() => onAtivo(null)}
      onFocus={() => onAtivo(nome)} onBlur={() => onAtivo(null)}
      onClick={() => onAtivo(ativo ? null : nome)} title={`${nome} — ${pct}`}>
      {falhou
        ? <span className="sk-letter">{nome.charAt(0)}</span>
        : <img src={src} alt={nome} loading="lazy" className={invert ? 'invert' : ''} onError={() => setFalhou(true)} />}
      <span className="sk-name">{nome}</span>
      <span className="sk-pct">{pct}</span>
    </button>
  );
}

function Habilidades(){
  const [teste, setTeste] = useState(NIVEL_CSS);
  const [ativo, setAtivo] = useState(null);
  const diff = teste - NIVEL_CSS;
  const veredito = diff === 0
    ? '🎯 cravado no meu nível!'
    : diff > 0 ? `${diff}% acima do meu nível` : `${-diff}% abaixo do meu nível`;
  const dim = (nome) => ativo && ativo !== nome;
  return (
    <div className="skills-grid">
    <div className="skills-list">
      <SkillBar nome="Python" pct={97} dim={dim('Python')} />
      <SkillBar nome="FastAPI" pct={98} dim={dim('FastAPI')} />
      <SkillBar nome="PostgreSQL" pct={85} dim={dim('PostgreSQL')} />
      <SkillBar nome="HTML" pct={90} dim={dim('HTML')} />
      <SkillBar nome="Vercel" pct={70} dim={dim('Vercel')} />
      <SkillBar nome="CSS" pct={NIVEL_CSS} dim={dim('CSS')} />
      <div className="css-lab">
        <label htmlFor="css-teste">🧪 Teste meu CSS — arraste e compare com meus {NIVEL_CSS}%</label>
        <div className="css-lab-row">
          <input id="css-teste" type="range" min="0" max="100" value={teste}
            onChange={(e)=>setTeste(Number(e.target.value))} aria-label="Seu nível de CSS" />
          <span>{teste}%</span>
        </div>
        <div className="css-lab-track">
          <div className="css-lab-fill" style={{width: teste + '%'}} />
          <div className="css-lab-marker" style={{left: NIVEL_CSS + '%'}} title={`Meu nível: ${NIVEL_CSS}%`} />
        </div>
        <p className="css-lab-veredito">{veredito} <span>(eu: {NIVEL_CSS}%)</span></p>
      </div>
      <SkillBar nome="JavaScript" pct={65} dim={dim('JavaScript')} />
      <div className="skill-learn-row" style={dim('React') ? {opacity:.35} : undefined}>
        <span>React</span>
        <strong className="learn-badge"><i/>em aprendizado</strong>
      </div>
    </div>
    <div className="skills-icons">
      <div className="sk-grid">
        {SKILLS.map((s) => (
          <SkillIcon key={s.nome} {...s} ativo={ativo === s.nome} onAtivo={setAtivo} />
        ))}
      </div>
      <p className="sk-hint">Passe o mouse para destacar a barra correspondente</p>
    </div>
    </div>
  );
}

function CaseModal({ projeto: p, onFechar }){
  const galeria = [p.capa_url || p.imagem_url, ...(p.imagens || [])].filter(Boolean);
  const [imgAtiva, setImgAtiva] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const faixaRef = useRef(null);
  const linguagens = (p.linguagens || '').split(',').map(s=>s.trim()).filter(Boolean);
  useEffect(()=>{
    if (lightbox === null) return;
    const nav = (e)=>{
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i)=>(i+1)%galeria.length);
      if (e.key === 'ArrowLeft') setLightbox((i)=>(i-1+galeria.length)%galeria.length);
    };
    window.addEventListener('keydown', nav);
    return ()=> window.removeEventListener('keydown', nav);
  },[lightbox, galeria.length]);
  const total = galeria.length;
  const anterior = ()=> setImgAtiva(i => (i - 1 + total) % total);
  const proxima = ()=> setImgAtiva(i => (i + 1) % total);
  const rolarFaixa = (dir)=> faixaRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  useEffect(()=>{
    faixaRef.current?.querySelector('.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  },[imgAtiva]);
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal case-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3>{p.titulo}</h3>
          <button onClick={onFechar}>✕</button>
        </div>
        {linguagens.length > 0 && (
          <div className="case-chips">{linguagens.map(l=><span key={l}>{l}</span>)}</div>
        )}
        {galeria.length > 0 && (
          <div className="case-galeria">
            <div className="case-stage">
              <img src={galeria[Math.min(imgAtiva, galeria.length-1)]} alt={p.titulo}
                className="case-main zoomable" title="Clique para ampliar"
                onClick={()=>setLightbox(Math.min(imgAtiva, galeria.length-1))}/>
              {galeria.length > 1 && (
                <>
                  <button type="button" className="stage-seta esquerda" onClick={anterior} aria-label="Imagem anterior">‹</button>
                  <button type="button" className="stage-seta direita" onClick={proxima} aria-label="Próxima imagem">›</button>
                  <span className="stage-contador">{Math.min(imgAtiva, galeria.length-1)+1} / {galeria.length}</span>
                </>
              )}
            </div>
            {galeria.length > 1 && (
              <div className="case-carrossel">
                <button type="button" className="carrossel-seta" onClick={()=>rolarFaixa(-1)} aria-label="Rolar miniaturas para a esquerda">‹</button>
                <div className="case-thumbs" ref={faixaRef}>
                  {galeria.map((u,i)=>(
                    <button key={u+i} type="button" className={i===imgAtiva?'active':''} onClick={()=>setImgAtiva(i)}>
                      <img src={u} alt={`detalhe ${i+1}`} loading="lazy"/>
                    </button>
                  ))}
                </div>
                <button type="button" className="carrossel-seta" onClick={()=>rolarFaixa(1)} aria-label="Rolar miniaturas para a direita">›</button>
              </div>
            )}
          </div>
        )}
        <div className="case-bloco">
          <h4>🧩 Problema</h4><p>{p.problema || '—'}</p>
        </div>
        <div className="case-bloco">
          <h4>✅ Solução</h4><p>{p.solucao || '—'}</p>
        </div>
        {!!p.como_foi_feito && (
          <div className="case-bloco">
            <h4>🛠️ Como foi feito</h4>
            {p.como_foi_feito.split('\n').filter(l=>l.trim()).map((l,i)=>(<p key={i}>{l}</p>))}
          </div>
        )}
        {!!p.estrutura_pastas && (
          <div className="case-bloco">
            <h4>📁 Estrutura</h4>
            <pre className="case-tree">{p.estrutura_pastas}</pre>
          </div>
        )}
        <div className="form-foot">
          {!!p.link_url && <a href={p.link_url} target="_blank" rel="noreferrer" className="btn-primary" style={{flex:1,padding:'12px'}}>🔗 Ver projeto online</a>}
          <button className="btn-outline" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      {lightbox !== null && (
        <div className="lightbox" onClick={()=>setLightbox(null)}>
          <button className="lightbox-fechar" onClick={()=>setLightbox(null)} aria-label="Fechar ampliação">✕</button>
          {galeria.length > 1 && (
            <>
              <button className="lightbox-seta esquerda" aria-label="Imagem anterior"
                onClick={(e)=>{e.stopPropagation();setLightbox((lightbox-1+galeria.length)%galeria.length)}}>‹</button>
              <button className="lightbox-seta direita" aria-label="Próxima imagem"
                onClick={(e)=>{e.stopPropagation();setLightbox((lightbox+1)%galeria.length)}}>›</button>
            </>
          )}
          <img src={galeria[lightbox]} alt={`${p.titulo} — ampliada`}
            onClick={(e)=>e.stopPropagation()} />
          <span className="lightbox-contador">{lightbox+1} / {galeria.length}</span>
        </div>
      )}
    </div>
  )
}
