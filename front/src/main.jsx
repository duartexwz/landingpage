import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Admin em chunk separado: visitante da landing não baixa o painel.
const Admin = lazy(() => import('./Admin.jsx'));

// Rota /admin serve o painel (login + orçamentos). Qualquer outra rota = landing.
const isAdmin = window.location.pathname.startsWith('/admin');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={<div style={{background:'#08081A',color:'#8B8BA7',minHeight:'100vh',display:'grid',placeItems:'center',fontFamily:'monospace'}}>$ carregando painel…</div>}>
        <Admin />
      </Suspense>
    ) : <App />}
  </React.StrictMode>,
)
