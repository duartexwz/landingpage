// Cliente HTTP da landing — fala com o backend via mesma origem (/api)
// Em dev (vite) o proxy redireciona /api -> http://localhost:8000.
// Em produção (Vercel/Nginx) /api é reescrito para o backend.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function req(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Erro ${res.status}`);
  return data;
}

export const api = {
  enviarOrcamento: (payload) => req('/api/orcamentos', { method: 'POST', body: payload }),
  login: (email, senha) => req('/api/login', { method: 'POST', body: { email, senha } }),
  refresh: (refresh_token) => req('/api/refresh', { method: 'POST', body: { refresh_token } }),
  listarOrcamentos: (token, params = {}) => {
    const q = new URLSearchParams({ limit: 100, ...params }).toString();
    return req(`/api/orcamentos?${q}`, { token });
  },
  atualizarOrcamento: (token, id, patch) =>
    req(`/api/orcamentos/${id}`, { method: 'PATCH', body: patch, token }),
  excluirOrcamento: (token, id) =>
    fetch(`${BASE}/api/orcamentos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => {
      if (!r.ok && r.status !== 204) throw new Error(`Erro ${r.status}`);
      return true;
    }),
};

export const tokens = {
  get: () => ({
    access: localStorage.getItem('md_access'),
    refresh: localStorage.getItem('md_refresh'),
  }),
  set: (a, r) => {
    localStorage.setItem('md_access', a);
    localStorage.setItem('md_refresh', r);
  },
  clear: () => {
    localStorage.removeItem('md_access');
    localStorage.removeItem('md_refresh');
  },
};
