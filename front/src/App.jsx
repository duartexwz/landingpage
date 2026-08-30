import { useState, useEffect } from 'react'
import './App.css'

export default function App(){
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(1) // second item open as in prototype
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({nome:'', email:'', projeto:'Desenvolvimento de APIs', orcamento:'R$ 5k - 15k', mensagem:''})
  const [sent, setSent] = useState(false)

  useEffect(()=>{
    const onScroll = ()=> setScrolled(window.scrollY>10)
    window.addEventListener('scroll', onScroll)
    return()=> window.removeEventListener('scroll', onScroll)
  },[])

  useEffect(()=>{
    document.body.style.overflow = modalOpen ? 'hidden' : ''
  },[modalOpen])

  const handleSubmit = (e)=>{
    e.preventDefault()
    if(!form.nome || !form.email || !form.mensagem){ alert('Preencha nome, e-mail e mensagem'); return }
    setSent(true)
    setTimeout(()=>{ setSent(false); setModalOpen(false) }, 2500)
  }

  return (
    <>
      {/* HEADER */}
      <header className={`header ${scrolled?'scrolled':''}`}>
        <div className="container header-inner">
          <a href="#" className="logo"><span className="logo-dot"/> mayckon.dev</a>
          <nav className="nav">
            <a href="#portfolio">Portfólio</a>
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
          <span><strong>+60 projetos</strong> entregues</span>
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
            {/* CARD 1 */}
            <article className="p-card">
              <div className="p-img">
                <div className="p-img-inner">
                  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60" alt="Sistema de Gestão" loading="lazy"/>
                </div>
              </div>
              <div className="p-body">
                <h3>Sistema de Gestão de Colaboradores</h3>
                <p><b>Problema:</b> planilhas caóticas. <b> Solução:</b> painel unificado com permissões por nível.</p>
                <a href="#" className="p-link" onClick={e=>e.preventDefault()}>Ver case completo →</a>
              </div>
            </article>
            {/* CARD 2 */}
            <article className="p-card">
              <div className="p-img">
                <div className="p-img-inner" style={{background:'#0E1020'}}>
                  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60" alt="API Conciliação" style={{opacity:.9}} loading="lazy"/>
                </div>
              </div>
              <div className="p-body">
                <h3>API de Conciliação Financeira</h3>
                <p><b>Problema:</b> fechamento manual. <b> Solução:</b> API que reconcilia 40k lançamentos/dia.</p>
                <a href="#" className="p-link" onClick={e=>e.preventDefault()}>Ver case completo →</a>
              </div>
            </article>
            {/* CARD 3 */}
            <article className="p-card">
              <div className="p-img">
                <div className="p-img-inner" style={{background:'#111'}}>
                  <div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',background:'#0B0B1A',color:'white',padding:16}}>
                    <div style={{textAlign:'left',width:'100%'}}>
                      <div style={{fontSize:11,opacity:.6,marginBottom:8}}>© Capmart</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Latre errerence</div>
                      <div style={{width:70,height:8,background:'#9B6BFF',borderRadius:4,marginTop:10}}/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-body">
                <h3>Landing de Captação</h3>
                <p><b>Problema:</b> conversão baixa. <b className="cyan">Solução:</b> página rápida que dobrou leads qualificados.</p>
                <a href="#" className="p-link" onClick={e=>e.preventDefault()}>Ver case completo →</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="section" style={{paddingTop:0}}>
        <div className="container about-grid">
          <div className="about-photo">
            <img src="/src/assets/WhatsApp Image 2026-08-29 at 15.46.44.jpeg" alt="Mayckon - foto profissional"/>
          </div>
          <div className="about-content">
            <div className="eyebrow">(B) SOBRE MIM</div>
            <h2>Lógica de engenharia,<br/>resultado de negócio.</h2>
            <p>Acredito que todo processo repetitivo é um sistema esperando ser construído. Uso Python e arquitetura limpa para transformar dor operacional em software que escala — com medição, teste e deploy sem surpresas.</p>
            <p className="sub">Eficiência operacional através de automações, integrações e infraestrutura para operações que não podem parar.</p>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="section">
        <div className="container">
          <div className="eyebrow">(C) SERVIÇOS</div>
          <h2 className="section-title">Três frentes, um objetivo: menos trabalho manual.</h2>
          <div className="services-grid">
            <div className="s-card">
              <div className="s-num">01</div>
              <h3>Desenvolvimento de APIs</h3>
              <p>Integrações e backend escalável, documentado e pronto para receber tráfego real.</p>
            </div>
            <div className="s-card">
              <div className="s-num">02</div>
              <h3>Automações de Processos</h3>
              <p>Scripts e pipelines que eliminam tarefas repetitivas e reduzem retrabalho.</p>
            </div>
            <div className="s-card">
              <div className="s-num">03</div>
              <h3>Landing Pages & Web Apps</h3>
              <p>Interfaces rápidas integradas a banco de dados, prontas para converter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section" style={{paddingTop:0}}>
        <div className="container">
          <div className="eyebrow">(D) COMO FUNCIONA</div>
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
          <div className="eyebrow">(E) DEPOIMENTOS</div>
          <h2 className="section-title">Quem já automatizou.</h2>
          <div className="testi-grid">
            <div className="t-card">
              <p>"O painel reduziu 90% do nosso trabalho manual de fechamento. Roda sozinho."</p>
              <div className="t-head">
                <div className="t-avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60" alt="Marina Costa"/></div>
                <div><strong>Marina Costa</strong><span>COO · Vetor Log</span></div>
              </div>
            </div>
            <div className="t-card">
              <p>"API enxuta e documentada. Integração levou dias, não meses."</p>
              <div className="t-head">
                <div className="t-avatar"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" alt="Diego Ramos"/></div>
                <div><strong>Diego Ramos</strong><span>Head de Produto · Nuvem</span></div>
              </div>
            </div>
            <div className="t-card">
              <p>"A landing dobrou nossos leads qualificados na primeira quinzena."</p>
              <div className="t-head">
                <div className="t-avatar"><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" alt="Paula Menezes"/></div>
                <div><strong>Paula Menezes</strong><span>Fundadora · Karta</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" style={{paddingTop:0}}>
        <div className="container">
          <div className="eyebrow">(F) FAQ</div>
          <h2 className="section-title">Perguntas frequentes.</h2>
          <div className="faq">
            {[
              {q:'Quais são os prazos de entrega?', a:'Landing pages: 7–10 dias úteis. APIs e automações: 2–4 semanas dependendo do escopo. Sempre com cronograma e entregas parciais no Notion/GitHub.'},
              {q:'Quais tecnologias você utiliza?', a:'Python, Node.js, Postgres e APIs REST. Escolho a stack que atende ao seu contexto.'},
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

              <div className="form-grid two">
                <div className="field">
                  <label>Tipo de projeto</label>
                  <select value={form.projeto} onChange={e=>setForm({...form, projeto:e.target.value})}>
                    <option>Desenvolvimento de APIs</option>
                    <option>Automações de Processos</option>
                    <option>Landing Pages & Web Apps</option>
                    <option>Identidade Visual</option>
                    <option>Ilustração autoral</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="field">
                  <label>Orçamento estimado</label>
                  <select value={form.orcamento} onChange={e=>setForm({...form, orcamento:e.target.value})}>
                    <option>R$ 2k - 5k</option>
                    <option>R$ 5k - 15k</option>
                    <option>R$ 15k - 30k</option>
                    <option>R$ 30k+</option>
                    <option>Ainda não sei (sob consulta)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Mensagem *</label>
                <textarea placeholder="Conte em 2-3 linhas: o que precisa automatizar, volume e prazo ideal..." value={form.mensagem} onChange={e=>setForm({...form, mensagem:e.target.value})} />
              </div>

              <div className="form-foot">
                <button type="submit" className="btn-primary" style={{flex:1,padding:'12px'}}>Enviar mensagem →</button>
                <a href="https://wa.me/5511999999999?text=Olá%20Mayckon%2C%20quero%20um%20orçamento!" target="_blank" rel="noreferrer" className="wa-btn">💬 WhatsApp direto</a>
              </div>
              <div style={{fontSize:11,color:'#6B6B8A',marginTop:10,textAlign:'center'}}>Ao enviar você concorda em receber resposta por e-mail/WhatsApp.</div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
