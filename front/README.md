# mayckon.dev — Landing Page

Landing page dark de alta conversão para serviços de **Sistemas, APIs e Automações**. SPA âncora construída com React + Vite, sem dependências extras, fiel aos protótipos em `prototipagem-tela/`.

> **Stack:** Vite 5 + React 18 + CSS puro (variáveis) · Deploy estático (`dist/`)

---

## 🚀 Como rodar

```bash
cd front
npm install      # instala 281 pacotes
npm run dev      # http://localhost:5173 (HMR)
npm run build    # gera dist/ otimizado (3.4kB CSS + 50kB JS gzip)
npm run preview  # serve dist/ em http://localhost:4173
npm run lint     # eslint src/**/*
```

Requisitos: **Node 18+** (testado em 18.19.1), npm 9+.

---

## 📁 Estrutura

```
front/
├── index.html          # HTML base, importa /src/main.jsx, fonts e SEO
├── vite.config.js      # plugin-react (JSX + Fast Refresh)
├── package.json        # scripts: dev/build/preview/lint
├── public/vite.svg
├── src/
│   ├── main.jsx        # ReactDOM.createRoot(#root).render(<App/>)
│   ├── index.css       # Reset + variáveis CSS + .container
│   ├── App.jsx         # ← TODA a landing (11 seções + modal)
│   ├── App.css         # Estilos por seção (header, hero, terminal...)
│   └── assets/         # foto do perfil (WhatsApp Image 2026-08-29...)
└── dist/               # build de produção (não commitar)
```

### Mapa de seções em `src/App.jsx`

| # | id | Eyebrow | Arquivo | Descrição |
|---|----|---------|---------|-----------|
| 1 | — | — | `App.jsx:32` | **Header** fixo, blur, nav `Portfólio/Serviços/FAQ` + CTA modal |
| 2 | — | — | `App.jsx:56` | **Hero** headline + 2 CTAs + mockup terminal `api-gateway v2.4.1` |
| 3 | — | — | `App.jsx:91` | **Prova social** `+60 projetos entregues` |
| 4 | `portfolio` | (A) PORTFÓLIO | `App.jsx:100` | 3 cards problema→solução + `Ver case completo` |
| 5 | `sobre` | (B) SOBRE MIM | `App.jsx:155` | Foto + `Lógica de engenharia...` +8 anos |
| 6 | `servicos` | (C) SERVIÇOS | `App.jsx:170` | 3 cards `01 APIs / 02 Automações / 03 Landing Pages` |
| 7 | — | (D) COMO FUNCIONA | `App.jsx:195` | 4 passos Briefing→Deploy com linha conectora |
| 8 | — | (E) DEPOIMENTOS | `App.jsx:225` | 3 cards Marina/Diego/Paula |
| 9 | `faq` | (F) FAQ | `App.jsx:256` | 4 accordions (2º aberto por padrão) |
| 10| — | — | `App.jsx:279` | **CTA final** `Pronto para automatizar?` |
| 11| — | — | `App.jsx:287` | **Footer** GitHub/LinkedIn/ola@mayckon.dev |
| 12| — | — | `App.jsx:299` | **Modal Orçamento** formulário + WhatsApp |

> Single Page Application com `scroll-behavior:smooth` (`index.css:18`) — sem react-router.

---

## 🎨 Design System

Definido em `src/index.css:2` ( `:root` ) — altere aqui para retematizar:

```css
--bg:#08081A;       /* fundo */
--card:#11112A;     /* cards */
--border:#22223A;
--text:#F1F1FF;
--muted:#8B8BA7;
--accent:#9B6BFF;   /* roxo CTA */
--accent-hover:#8B5CF6;
--cyan:#22D3EE;     /* eyebrow / links */
```

Fontes: `Inter` (texto) + `JetBrains Mono` (badges, terminal, números) — importadas em `index.html:10`.

Breakpoints principais: `520px` (form), `760px` (portfolio), `800px` (serviços/depoimentos), `860px` (nav), `960px` (hero).

Classes utilitárias: `.container` (max 1120px centrado), `.btn-primary` (roxo com glow), `.btn-outline` (borda), `.section` (padding 64→88px).

---

## 🧠 Estado e interatividade (`App.jsx:4-27`)

```js
const [scrolled,setScrolled] = useState(false)   // header sólido após 10px
const [mobileOpen,setMobileOpen] = useState(false) // menu hambúrguer
const [faqOpen,setFaqOpen] = useState(1)          // accordion aberto (índice)
const [modalOpen,setModalOpen] = useState(false)  // modal orçamento
const [form,setForm] = useState({...})            // controlled inputs
const [sent,setSent] = useState(false)            // feedback sucesso
```

- `useEffect` scroll listener (`App.jsx:12`) + trava body `overflow:hidden` quando modal aberto (`App.jsx:18`).
- `handleSubmit` (`App.jsx:22`) valida `nome/email/mensagem`, seta `sent` e auto-fecha modal em 2.5s. **Hoje é mock** — troque por `fetch('/api/lead')`.

Exemplo de adição de projeto:
1. Duplique um `article.p-card` em `App.jsx:106`
2. Troque `img src`, `h3`, `p` e link.
3. Para mais de 3, o grid já é responsivo (`App.css:132`).

---

## 🔧 Manutenção comum

**Trocar textos/headline:**
- Hero: `App.jsx:60-61`
- Prova social: `App.jsx:93-95`
- Portfólio: `App.jsx:113-147`
- Sobre: `App.jsx:162-164`
- FAQ: `App.jsx:261-265`

**Trocar cores/CTA:**
- Variáveis em `index.css:2`, botões em `App.css:26-43`

**Trocar foto:**
- Substitua `src/assets/WhatsApp Image...jpeg` e ajuste `App.jsx:158` (`<img src=...>`). O CSS aplica `object-fit:cover` + `mix-blend:lighten` (`App.css:164`).

**Integrar formulário com backend:**
```js
// em handleSubmit, substitua setTimeout por:
await fetch('https://sua-api.com/leads', {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify(form)
})
```

**WhatsApp:** troque o número em `App.jsx:353` (`wa.me/5511999999999`).

**Adicionar nova seção:** crie `<section id="nova" className="section">` após `App.jsx:192` e adicione link no `nav` (`App.jsx:35`).

---

## 🧪 Build e deploy

```bash
npm run build   # gera dist/
# dist/ é estático — faça upload para Vercel/Netlify/GitHub Pages:
npx serve dist          # teste local
# ou
scp -r dist/* usuario@servidor:/var/www/mayckon.dev/
```

Vercel/Netlify: aponte **Build Command** `npm run build` e **Output** `dist`.

Variáveis de ambiente não são necessárias (landing estática).

---

## 📐 Convenções

- **Componente único** `App.jsx` propositalmente — evita over-engineering para landing. Se crescer, quebre em `components/Header.jsx`, `Hero.jsx` etc.
- CSS puro com BEM leve (`.p-card`, `.s-card`, `.t-card`) — sem Tailwind para manter bundle pequeno.
- Imagens externas via `unsplash` com `loading="lazy"` — substitua por `/public` para produção offline.

---

## 📄 Licença

© 2026 mayckon.dev — Todos os direitos reservados.
