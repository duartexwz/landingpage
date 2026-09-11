import { useEffect, useMemo, useState } from 'react';
import { api, tokens } from './lib/api.js';
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
            <h1>Orçamentos<span className="accent">.</span></h1>
            <p className="mono dim">$ leads --origem=landing</p>
          </div>
          <div className="admin-top-actions">
            <a className="btn-outline" href="/">Ver site</a>
            <button className="btn-outline" onClick={sair}>Sair</button>
          </div>
        </div>
        <div className="admin-stats">
          <div className="stat"><strong>{stats.total}</strong><span>total</span></div>
          <div className="stat s-novo"><strong>{stats.novos}</strong><span>novos</span></div>
          <div className="stat s-at"><strong>{stats.atendimento}</strong><span>em atendimento</span></div>
          <div className="stat s-ok"><strong>{stats.convertidos}</strong><span>convertidos</span></div>
        </div>
      </header>

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
    </div>
  );
}
