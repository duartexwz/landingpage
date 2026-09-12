import { useEffect, useMemo, useState } from 'react';
import { BASE, api, tokens } from './lib/api.js';
import { waCliente } from './lib/config.js';
import './Admin.css';

const STATUS = ['novo', 'em_atendimento', 'convertido', 'arquivado'];

const msgWhats = (o) =>
  `Olá ${o.nome}! Aqui é o Mayckon da mayckon.dev.\n` +
  `Recebi seu pedido de orçamento:\n` +
  `• Serviço: ${o.tipo_projeto}\n` +
  `• Faixa: ${o.orcamento_estimado}\n` +
  `• Sua mensagem: "${o.mensagem}"\n` +
  `Vamos falar sobre os próximos passos?`;

const fmtData = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');

export default function Admin() {
  const [sess, setSess] = useState(tokens.get);
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState({ status: '', busca: '' });
  const [carregando, setCarregando] = useState(false);
  const [aba, setAba] = useState('orcamentos');

  const stats = useMemo(
    () => ({
      total: itens.length,
      novos: itens.filter((o) => o.status === 'novo').length,
      atendimento: itens.filter((o) => o.status === 'em_atendimento').length,
      convertidos: itens.filter((o) => o.status === 'convertido').length,
    }),
    [itens],
  );

  const carregar = async (access = sess.access) => {
    if (!access) return;
    setCarregando(true);
    setErro('');
    try {
      const data = await api.listarOrcamentos(access, {
        ...(filtro.status ? { status: filtro.status } : {}),
        ...(filtro.busca ? { busca: filtro.busca } : {}),
      });
      setItens(data);
    } catch (e) {
      if (/401|expir|token/i.test(e.message)) {
        try {
          const t = await api.refresh(sess.refresh);
          tokens.set(t.access_token, t.refresh_token);
          setSess(tokens.get());
          setItens(await api.listarOrcamentos(t.access_token));
          return;
        } catch {
          tokens.clear();
          setSess({ access: null, refresh: null });
          setErro('Sessão expirada. Faça login novamente.');
          return;
        }
      }
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const t = await api.login(form.email, form.senha);
      tokens.set(t.access_token, t.refresh_token);
      setSess(tokens.get());
      carregar(t.access_token);
    } catch (err) {
      setErro(err.message);
    }
  };

  const mudar = async (id, patch) => {
    try {
      const atualizado = await api.atualizarOrcamento(sess.access, id, patch);
      setItens((xs) => xs.map((x) => (x.id === id ? atualizado : x)));
    } catch (e) {
      alert(e.message);
    }
  };

  const excluir = async (id) => {
    if (!confirm('Excluir este orçamento?')) return;
    try {
      await api.excluirOrcamento(sess.access, id);
      setItens((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const sair = () => {
    tokens.clear();
    setSess({ access: null, refresh: null });
    setItens([]);
  };

  if (!sess.access) {
    return (
      <div className="admin-wrap">
        <div className="admin-terminal">
          <div className="admin-terminal-bar">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            <span className="admin-terminal-title">mayckon.dev // painel</span>
          </div>
          <form className="admin-login" onSubmit={entrar}>
            <p className="mono dim">$ auth --painel</p>
            <h2>Acesso restrito</h2>
            <p className="muted">Orçamentos e mensagens da landing.</p>
            {erro && <div className="admin-erro">{erro}</div>}
            <label>E-MAIL<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@mayckon.dev" /></label>
            <label>SENHA<input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="••••••••" /></label>
            <button className="btn-primary" type="submit">Entrar →</button>
            <a className="admin-voltar" href="/">← voltar ao site</a>
          </form>
        </div>
    </div>
  );
}

  return (
    <div className="admin-wrap wide">
      <header className="admin-terminal wide-terminal">
        <div className="admin-terminal-bar">
          <span className="dot r" /><span className="dot y" /><span className="dot g" />
          <span className="admin-terminal-title">mayckon.dev // painel</span>
          <span className="live"><i />live</span>
        </div>
        <div className="admin-top">
          <div>
            <h1>Painel<span className="accent">.</span></h1>
            <p className="mono dim">$ mayckon.dev --admin</p>
          </div>
          <div className="admin-top-actions">
            <a className="btn-outline" href="/">Ver site</a>
            <button className="btn-outline" onClick={sair}>Sair</button>
          </div>
        </div>
        <div className="admin-tabs">
          <button className={aba === 'orcamentos' ? 'active' : ''} onClick={() => setAba('orcamentos')}>💰 Orçamentos <span>{itens.length}</span></button>
          <button className={aba === 'editar' ? 'active' : ''} onClick={() => setAba('editar')}>✏️ Editar landing</button>
        </div>
        {aba === 'orcamentos' && (
        <div className="admin-stats">
          <div className="stat"><strong>{stats.total}</strong><span>total</span></div>
          <div className="stat s-novo"><strong>{stats.novos}</strong><span>novos</span></div>
          <div className="stat s-at"><strong>{stats.atendimento}</strong><span>em atendimento</span></div>
          <div className="stat s-ok"><strong>{stats.convertidos}</strong><span>convertidos</span></div>
        </div>
        )}
      </header>

      {aba === 'editar'
        ? <EditarLanding token={sess.access} />
        : <>
      <div className="admin-filtros">
        <select value={filtro.status} onChange={(e) => setFiltro({ ...filtro, status: e.target.value })}>
          <option value="">Todos os status</option>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="$ buscar nome, e-mail, mensagem…" value={filtro.busca}
          onChange={(e) => setFiltro({ ...filtro, busca: e.target.value })} />
        <button className="btn-primary" onClick={() => carregar()}>Filtrar</button>
      </div>

      {erro && <div className="admin-erro">{erro}</div>}
      {carregando && <p className="mono dim">$ carregando leads…</p>}

      <div className="admin-lista">
        {itens.map((o) => (
          <article key={o.id} className={`lead ${o.lido ? '' : 'novo'} st-${o.status}`}>
            <div className="lead-head">
              <div className="lead-who">
                <div className="lead-avatar">{o.nome.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{o.nome}</strong>
                  <a href={`mailto:${o.email}`}>{o.email}</a>
                  {o.telefone
                    ? <a className="lead-fone" href={`tel:${o.telefone.replace(/\D/g, '')}`}>📱 {o.telefone}</a>
                    : <span className="lead-sem-fone">sem telefone</span>}
                </div>
              </div>
              <div className="lead-head-right">
                <span className={`badge-status ${o.status}`}>{o.status.replace('_', ' ')}</span>
                {!o.lido && <span className="badge-new">● novo</span>}
              </div>
            </div>

            <div className="lead-meta">
              <div><span>serviço</span><strong>{o.tipo_projeto}</strong></div>
              <div><span>faixa de valor</span><strong className="valor">{o.orcamento_estimado}</strong></div>
              <div><span>origem</span><strong>{o.origem}</strong></div>
              <div><span>recebido em</span><strong className="mono">{fmtData(o.criado_em)}</strong></div>
            </div>

            <p className="lead-msg">“{o.mensagem}”</p>

            <div className="lead-foot">
              {waCliente(o.telefone, msgWhats(o))
                ? <a className="wa-btn" href={waCliente(o.telefone, msgWhats(o))} target="_blank" rel="noreferrer">💬 Chamar no WhatsApp</a>
                : <span className="wa-btn off" title="Cliente não informou telefone">💬 Sem WhatsApp</span>}
              <a className="btn-outline sm" href={`mailto:${o.email}?subject=${encodeURIComponent(`Orçamento — ${o.tipo_projeto} | mayckon.dev`)}`}>✉ E-mail</a>
              <select value={o.status} onChange={(e) => mudar(o.id, { status: e.target.value })}>
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn-outline sm" onClick={() => mudar(o.id, { lido: !o.lido })}>{o.lido ? 'Não lido' : 'Lido ✓'}</button>
              <button className="danger sm" onClick={() => excluir(o.id)}>Excluir</button>
            </div>
          </article>
        ))}
        {!carregando && itens.length === 0 && <p className="mono dim">$ nenhum lead encontrado.</p>}
      </div>
        </>}
    </div>
  );
}

/* ================= EDITAR LANDING ================= */

const PROJ_VAZIO = { titulo: '', problema: '', solucao: '', imagem_url: '', capa_url: '', imagens: [], link_url: '', como_foi_feito: '', estrutura_pastas: '', linguagens: '', ordem: 0, ativo: true };
const DEP_VAZIO = { texto: '', nome: '', cargo: '', avatar_url: '', ordem: 0, ativo: true };

function FotoUpload({ token, value, onChange, label = 'Foto' }) {
  const [up, setUp] = useState(false);
  const [prev, setPrev] = useState('');

  const escolher = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrev(URL.createObjectURL(file));
    setUp(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BASE}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Erro ${res.status}`);
      onChange(data.url);
      setPrev('');
    } catch (err) {
      alert(err.message);
      setPrev('');
    } finally {
      setUp(false);
      e.target.value = '';
    }
  };

  return (
    <div className="foto-upload">
      <span>{label}</span>
      {(prev || value) && <img className="edit-preview" src={prev || value} alt="preview" onError={(e) => { e.target.style.display = 'none'; }} />}
      <label className="btn-outline sm file-btn">
        {up ? '⏳ Enviando…' : '📤 Escolher imagem'}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={escolher} disabled={up} hidden />
      </label>
      {value && !prev && !up && <span className="mono dim up-ok">✓ enviada</span>}
    </div>
  );
}

function GaleriaUpload({ token, value = [], onChange, label = 'Imagens do case' }) {
  const [up, setUp] = useState(false);

  const escolher = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUp(true);
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${BASE}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || `Erro ${res.status}`);
        urls.push(data.url);
      }
      onChange([...(value || []), ...urls]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUp(false);
      e.target.value = '';
    }
  };

  return (
    <div className="foto-upload">
      <span>{label} ({(value || []).length})</span>
      {(value || []).length > 0 && (
        <div className="galeria-thumbs">
          {(value || []).map((u) => (
            <div key={u} className="galeria-thumb">
              <img src={u} alt="case" />
              <button onClick={() => onChange((value || []).filter((x) => x !== u))} title="Remover">✕</button>
            </div>
          ))}
        </div>
      )}
      <label className="btn-outline sm file-btn">
        {up ? '⏳ Enviando…' : '📤 Adicionar imagens'}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={escolher} disabled={up} hidden />
      </label>
    </div>
  );
}

function EditarLanding({ token }) {
  const [bio, setBio] = useState({ titulo: '', texto: '', sub: '' });
  const [foto, setFoto] = useState('');
  const [bioIni, setBioIni] = useState({ titulo: '', texto: '', sub: '' });
  const [fotoIni, setFotoIni] = useState('');
  const [projetos, setProjetos] = useState([]);
  const [deps, setDeps] = useState([]);
  const [novoProj, setNovoProj] = useState(PROJ_VAZIO);
  const [novoDep, setNovoDep] = useState(DEP_VAZIO);
  const [msg, setMsg] = useState('');
  const [editProj, setEditProj] = useState({});
  const [editDep, setEditDep] = useState({});
  const [excluirProj, setExcluirProj] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [msgProjeto, setMsgProjeto] = useState(null); // {modo:'criado'|'editado', titulo}
  const [adicionando, setAdicionando] = useState(false);

  const carregarTudo = async () => {
    try {
      const site = await api.obterSite();
      setBio(site.bio || {});
      setFoto(site.foto_url || '');
      setBioIni(site.bio || {});
      setFotoIni(site.foto_url || '');
      setProjetos(await api.listarProjetos(token));
      setDeps(await api.listarDepoimentos(token));
    } catch (e) {
      setMsg(e.message);
    }
  };

  useEffect(() => { carregarTudo(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!excluirProj && !msgProjeto) return;
    document.body.style.overflow = 'hidden';
    const fechar = (e) => {
      if (e.key !== 'Escape' || excluindo || adicionando) return;
      setExcluirProj(null);
      setMsgProjeto(null);
    };
    window.addEventListener('keydown', fechar);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', fechar);
    };
  }, [excluirProj, msgProjeto, excluindo, adicionando]);

  const ok = (t) => { setMsg(`✅ ${t}`); setTimeout(() => setMsg(''), 2500); };

  // helpers de edição inline de projeto: ep lê (editado ?? original), sp grava
  const ep = (p, campo) => editProj[p.id]?.[campo] ?? p[campo] ?? '';
  const sp = (pid, campo, valor) => setEditProj((prev) => {
    const base = projetos.find((x) => x.id === pid) || {};
    return { ...prev, [pid]: { ...base, ...(prev[pid] || {}), [campo]: valor } };
  });
  const salvarProj = async (p) => {
    const m = { ...p, ...(editProj[p.id] || {}) };
    const upd = await api.atualizarProjeto(token, p.id, {
      titulo: m.titulo, problema: m.problema, solucao: m.solucao,
      imagem_url: m.imagem_url || null, capa_url: m.capa_url || null,
      imagens: m.imagens || [], link_url: m.link_url || null,
      como_foi_feito: m.como_foi_feito || '', estrutura_pastas: m.estrutura_pastas || '',
      linguagens: m.linguagens || '', ordem: Number(m.ordem) || 0, ativo: !!m.ativo,
    });
    setProjetos((xs) => xs.map((x) => (x.id === p.id ? upd : x)));
    setEditProj(({ [p.id]: _drop, ...r }) => r);
    setMsgProjeto({ modo: 'editado', titulo: upd.titulo || m.titulo });
  };

  const confirmarExcluirProj = async () => {
    if (!excluirProj) return;
    setExcluindo(true);
    try {
      await api.excluirProjeto(token, excluirProj.id);
      setProjetos((xs) => xs.filter((x) => x.id !== excluirProj.id));
      ok('Projeto removido!');
      setExcluirProj(null);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setExcluindo(false);
    }
  };

  const salvarSite = async () => {
    try {
      await api.salvarSite(token, { bio, foto_url: foto });
      setBioIni({ ...bio });
      setFotoIni(foto);
      ok('Landing atualizada!');
    } catch (e) { setMsg(e.message); }
  };

  // Bio + foto: salvar só habilita após alguma alteração
  const bioSujo = (bio.titulo || '') !== (bioIni.titulo || '')
    || (bio.texto || '') !== (bioIni.texto || '')
    || (bio.sub || '') !== (bioIni.sub || '')
    || (foto || '') !== (fotoIni || '');

  // Feedback novo: sujo se texto ou nome preenchidos
  const novoDepSujo = (novoDep.texto || '').trim() || (novoDep.nome || '').trim();

  // Salvar de um projeto existente só habilita após alguma alteração
  const projSujo = (p) => !!editProj[p.id];

  // Form "novo projeto": sujo se qualquer campo foi preenchido
  const novoProjSujo = [
    novoProj.titulo, novoProj.problema, novoProj.solucao, novoProj.link_url,
    novoProj.linguagens, novoProj.como_foi_feito, novoProj.estrutura_pastas,
    novoProj.capa_url,
  ].some((v) => (v || '').trim()) || (novoProj.imagens || []).length > 0;

  const adicionarProj = async () => {
    if (!novoProj.titulo.trim()) { alert('Título é obrigatório'); return; }
    setAdicionando(true);
    try {
      const criado = await api.criarProjeto(token, novoProj);
      setProjetos((xs) => [...xs, criado]);
      setNovoProj(PROJ_VAZIO);
      setMsgProjeto({ modo: 'criado', titulo: criado.titulo });
    } catch (e) {
      setMsg(e.message);
    } finally {
      setAdicionando(false);
    }
  };

  return (
    <div className="edit-wrap">
      {msg && <div className="admin-erro" style={{ marginBottom: 12 }}>{msg}</div>}

      <section className="edit-card">
        <h3>👤 Bio + foto</h3>
        <label>Título<input value={bio.titulo || ''} onChange={(e) => setBio({ ...bio, titulo: e.target.value })} /></label>
        <label>Texto<textarea value={bio.texto || ''} onChange={(e) => setBio({ ...bio, texto: e.target.value })} /></label>
        <label>Subtexto<textarea value={bio.sub || ''} onChange={(e) => setBio({ ...bio, sub: e.target.value })} /></label>
        <FotoUpload token={token} value={foto} onChange={setFoto} label="Foto de perfil" />
        <button className="btn-primary" onClick={salvarSite} disabled={!bioSujo}>Salvar bio + foto</button>
      </section>

      <section className="edit-card">
        <h3>🗂️ Projetos ({projetos.length})</h3>
        {projetos.map((p) => (
          <div key={p.id} className="edit-item">
            <input value={ep(p, 'titulo')} onChange={(e) => sp(p.id, 'titulo', e.target.value)} placeholder="Título" />
            <textarea value={ep(p, 'problema')} onChange={(e) => sp(p.id, 'problema', e.target.value)} placeholder="Problema" />
            <textarea value={ep(p, 'solucao')} onChange={(e) => sp(p.id, 'solucao', e.target.value)} placeholder="Solução" />
            <div className="edit-row2">
              <FotoUpload token={token} label="Capa (landing)" value={ep(p, 'capa_url') || ep(p, 'imagem_url')} onChange={(url) => sp(p.id, 'capa_url', url)} />
              <GaleriaUpload token={token} value={ep(p, 'imagens') || []} onChange={(arr) => sp(p.id, 'imagens', arr)} />
            </div>
            <input value={ep(p, 'link_url')} onChange={(e) => sp(p.id, 'link_url', e.target.value)} placeholder="Link do projeto (https://…)" />
            <input value={ep(p, 'linguagens')} onChange={(e) => sp(p.id, 'linguagens', e.target.value)} placeholder="Linguagens (ex: Python, FastAPI, React)" />
            <textarea className="mono-area" value={ep(p, 'como_foi_feito')} onChange={(e) => sp(p.id, 'como_foi_feito', e.target.value)} placeholder="Como foi feito (quase um README…)" />
            <textarea className="mono-area" value={ep(p, 'estrutura_pastas')} onChange={(e) => sp(p.id, 'estrutura_pastas', e.target.value)} placeholder={'Estrutura de pastas (ex:\napi/\n  routers/\nfront/\n  src/)'} />
            <div className="edit-row">
              <input type="number" value={ep(p, 'ordem')} onChange={(e) => sp(p.id, 'ordem', Number(e.target.value))} title="Ordem" />
              <label className="check"><input type="checkbox" checked={!!(editProj[p.id]?.ativo ?? p.ativo)} onChange={(e) => sp(p.id, 'ativo', e.target.checked)} /> visível</label>
              <button className="btn-primary sm" onClick={() => salvarProj(p)} disabled={!projSujo(p)}>Salvar</button>
              <button className="danger sm" onClick={() => setExcluirProj(p)}>Remover</button>
            </div>
          </div>
        ))}
        <div className="edit-item novo">
          <strong>+ Novo projeto</strong>
          <input value={novoProj.titulo} onChange={(e) => setNovoProj({ ...novoProj, titulo: e.target.value })} placeholder="Título *" />
          <textarea value={novoProj.problema} onChange={(e) => setNovoProj({ ...novoProj, problema: e.target.value })} placeholder="Problema" />
          <textarea value={novoProj.solucao} onChange={(e) => setNovoProj({ ...novoProj, solucao: e.target.value })} placeholder="Solução" />
          <div className="edit-row2">
            <FotoUpload token={token} label="Capa (landing)" value={novoProj.capa_url} onChange={(url) => setNovoProj({ ...novoProj, capa_url: url })} />
            <GaleriaUpload token={token} value={novoProj.imagens} onChange={(arr) => setNovoProj({ ...novoProj, imagens: arr })} />
          </div>
          <input value={novoProj.link_url} onChange={(e) => setNovoProj({ ...novoProj, link_url: e.target.value })} placeholder="Link do projeto (https://…)" />
          <input value={novoProj.linguagens} onChange={(e) => setNovoProj({ ...novoProj, linguagens: e.target.value })} placeholder="Linguagens (ex: Python, FastAPI, React)" />
          <textarea className="mono-area" value={novoProj.como_foi_feito} onChange={(e) => setNovoProj({ ...novoProj, como_foi_feito: e.target.value })} placeholder="Como foi feito (quase um README…)" />
          <textarea className="mono-area" value={novoProj.estrutura_pastas} onChange={(e) => setNovoProj({ ...novoProj, estrutura_pastas: e.target.value })} placeholder={'Estrutura de pastas (ex:\napi/\n  routers/\nfront/\n  src/)'} />
          <button className="btn-primary sm" onClick={adicionarProj} disabled={!novoProjSujo || adicionando}>
            {adicionando ? 'Adicionando…' : 'Adicionar projeto'}
          </button>
        </div>
      </section>

      <section className="edit-card">
        <h3>💬 Feedbacks / depoimentos ({deps.length})</h3>
        {deps.map((d) => (
          <div key={d.id} className="edit-item">
            {!d.ativo && (
              <div className="pendente-row">
                <span className="badge-status novo">⏳ pendente de aprovação</span>
                <button className="btn-primary sm" onClick={async () => {
                  const upd = await api.atualizarDepoimento(token, d.id, { ativo: true });
                  setDeps((xs) => xs.map((x) => (x.id === d.id ? upd : x)));
                  ok('Feedback aprovado e publicado!');
                }}>✓ Aprovar e publicar</button>
              </div>
            )}
            <textarea value={editDep[d.id]?.texto ?? d.texto} onChange={(e) => setEditDep({ ...editDep, [d.id]: { ...d, ...editDep[d.id], texto: e.target.value } })} placeholder="Texto do feedback" />
            <div className="edit-row">
              <input value={editDep[d.id]?.nome ?? d.nome} onChange={(e) => setEditDep({ ...editDep, [d.id]: { ...d, ...editDep[d.id], nome: e.target.value } })} placeholder="Nome" />
              <input value={editDep[d.id]?.cargo ?? d.cargo} onChange={(e) => setEditDep({ ...editDep, [d.id]: { ...d, ...editDep[d.id], cargo: e.target.value } })} placeholder="Cargo · Empresa" />
            </div>
            <div className="edit-row">
              <input type="number" value={editDep[d.id]?.ordem ?? d.ordem} onChange={(e) => setEditDep({ ...editDep, [d.id]: { ...d, ...editDep[d.id], ordem: Number(e.target.value) } })} title="Ordem" />
              <label className="check"><input type="checkbox" checked={editDep[d.id]?.ativo ?? d.ativo} onChange={(e) => setEditDep({ ...editDep, [d.id]: { ...d, ...editDep[d.id], ativo: e.target.checked } })} /> visível</label>
              <button className="btn-primary sm" disabled={!editDep[d.id]} onClick={async () => {
                const patch = editDep[d.id] || {};
                const upd = await api.atualizarDepoimento(token, d.id, { texto: patch.texto ?? d.texto, nome: patch.nome ?? d.nome, cargo: patch.cargo ?? d.cargo, avatar_url: patch.avatar_url ?? d.avatar_url, ordem: patch.ordem ?? d.ordem, ativo: patch.ativo ?? d.ativo });
                setDeps((xs) => xs.map((x) => (x.id === d.id ? upd : x)));
                setEditDep(({ [d.id]: _drop2, ...r }) => r);
                ok('Feedback salvo!');
              }}>Salvar</button>
              <button className="danger sm" onClick={async () => {
                if (!confirm(`Remover feedback de "${d.nome}"?`)) return;
                await api.excluirDepoimento(token, d.id);
                setDeps((xs) => xs.filter((x) => x.id !== d.id));
              }}>Remover</button>
            </div>
          </div>
        ))}
        <div className="edit-item novo">
          <strong>+ Novo feedback</strong>
          <textarea value={novoDep.texto} onChange={(e) => setNovoDep({ ...novoDep, texto: e.target.value })} placeholder="Texto do feedback *" />
          <div className="edit-row">
            <input value={novoDep.nome} onChange={(e) => setNovoDep({ ...novoDep, nome: e.target.value })} placeholder="Nome *" />
            <input value={novoDep.cargo} onChange={(e) => setNovoDep({ ...novoDep, cargo: e.target.value })} placeholder="Cargo · Empresa" />
          </div>
          <button className="btn-primary sm" disabled={!novoDepSujo} onClick={async () => {
            if (!novoDep.texto || !novoDep.nome) { alert('Texto e nome são obrigatórios'); return; }
            const criado = await api.criarDepoimento(token, novoDep);
            setDeps((xs) => [...xs, criado]);
            setNovoDep(DEP_VAZIO);
            ok('Feedback adicionado!');
          }}>Adicionar feedback</button>
        </div>
      </section>

      {excluirProj && (
        <div className="confirm-overlay" onClick={() => !excluindo && setExcluirProj(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Excluir projeto?</h3>
            <p>
              <strong>“{excluirProj.titulo}”</strong> será removido da landing
              permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div className="confirm-actions">
              <button className="btn-outline sm" onClick={() => setExcluirProj(null)} disabled={excluindo}>
                Cancelar
              </button>
              <button className="btn-danger sm" onClick={confirmarExcluirProj} disabled={excluindo}>
                {excluindo ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {msgProjeto && (
        <div className="confirm-overlay" onClick={() => setMsgProjeto(null)}>
          <div className="confirm-modal success" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon ok">✓</div>
            <h3>{msgProjeto.modo === 'criado' ? 'Projeto adicionado!' : 'Alterações salvas!'}</h3>
            <p>
              <strong>“{msgProjeto.titulo}”</strong> {msgProjeto.modo === 'criado' ? 'já está visível no portfólio da landing.' : 'foi atualizado na landing.'}
            </p>
            <div className="confirm-actions">
              <button className="btn-outline sm" onClick={() => setMsgProjeto(null)}>
                Fechar
              </button>
              <a className="btn-primary sm" href="/#portfolio" target="_blank" rel="noreferrer">
                Ver na landing →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
