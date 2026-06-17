# EducaInclui Pascal — Referência de Arquitetura

> **REGRAS PARA O CLAUDE:**
> 1. Ler este arquivo **antes** de qualquer análise ou tarefa no projeto.
> 2. **Atualizar este arquivo imediatamente** após toda mudança de código (criar, editar ou deletar arquivo). Registrar data e motivo na seção correspondente.
> 3. Usar este arquivo como fonte de verdade para localizar arquivos e entender o fluxo — só inspecionar diretamente o que for necessário após consultar aqui.

---

## Stack e Visão Geral

- **Framework:** React 18.3.1 (sem React Router) + Vite 5.4.8 (MPA)
- **Backend:** NENHUM — 100% frontend estático
- **Arquitetura:** MPA — 5 páginas HTML estáticas + React montado por página apenas para conteúdo dinâmico
- **Persistência:** localStorage (metadados de cursos + fotos como base64 + sessão + anotações + progresso), IndexedDB (`pascal_videos`) para blobs de vídeo
- **Deploy:** Vercel (frontend estático, `npm run build`)
- **React Router:** REMOVIDO — navegação via `<a href="...">` HTML

---

## Como rodar

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

> Vite roda em :5173. Sem backend — tudo é localStorage + IndexedDB.

---

## Arquivos de Configuração

| Arquivo | Propósito |
|---|---|
| `package.json` | Dependências e scripts. Deps: react, react-dom. DevDeps: vite, @vitejs/plugin-react |
| `vite.config.js` | MPA com 5 entradas HTML |
| `vercel.json` | outputDirectory: dist (deploy estático no Vercel) |
| `index.html` | Landing page — HTML estático + `<div id="modals-root">` para React |

---

## Páginas HTML (5 arquivos estáticos)

| Arquivo | Título | Auth check (inline `<script>`) | React entry |
|---|---|---|---|
| `index.html` | Landing | Nenhum | `font/src/entries/landing.jsx` |
| `font/pages/user.html` | Meus Cursos | `tipo === 'cliente'` → redireciona para `/index.html` | `font/src/entries/user.jsx` |
| `font/pages/administrative.html` | Dashboard | `tipo in [professor,educacional,empresarial]` | `font/src/entries/administrative.jsx` |
| `font/pages/course.html` | Gerenciar Cursos | idem administrative | `font/src/entries/course.jsx` |
| `font/pages/courseView.html` | Aula | `tipo === 'cliente'` | `font/src/entries/courseview.jsx` |

**Navegação:** links HTML `<a href="/pages/user.html">` — sem React Router.
**Auth nas páginas protegidas:** `<script>` inline no `<head>` checa `localStorage.usuarioLogado` e redireciona antes do React carregar.
**Logout:** botão no sidebar chama `localStorage.removeItem('usuarioLogado')` + `window.location.href = '/index.html'` via `<script>` inline na página.

---

## O que cada Entry React faz

| Entry | Monta em | Responsabilidade |
|---|---|---|
| `src/entries/landing.jsx` | `#modals-root` | Portals para `#nav-auth` (botões Entrar/Registrar) e `#courses-catalog` (cards se houver cursos). Modais de login/cadastro. |
| `src/entries/user.jsx` | `#user-app` | Busca, filtros por tópico, cards de cursos. Modal de perfil via portal em `#modals-root`. |
| `src/entries/administrative.jsx` | `#admin-app` | Cards de stats (total cursos/aulas) + lista de cursos cadastrados. |
| `src/entries/course.jsx` | `#courses-app` | Tabela CRUD de cursos + modais: AddCourse, ManageCourse, LessonModal (com upload de vídeo e questões). |
| `src/entries/courseview.jsx` | `#courseview-root` | Tudo: sidebar de aulas, player de vídeo, tabs Perguntas/Anotações/Gabarito, overlay de questões. courseId via `URLSearchParams`. |

**Regra do portal:** quando um entry precisa renderizar fora do seu `#root`, usa `createPortal(jsx, document.getElementById('outro-div'))`.

---

## Persistência (sem backend)

### localStorage — chave `pascal_courses`
```json
{
  "courses": [
    {
      "id": 1,
      "name": "Nome do Curso",
      "topic": "Tópico",
      "photoUrl": "data:image/jpeg;base64,...",
      "lessons": [
        {
          "id": 1,
          "name": "Aula 1",
          "desc": "Descrição",
          "hasVideo": true,
          "videoName": "video.mp4",
          "questions": [
            { "text": "Pergunta?", "type": "fechada", "options": ["A","B","C","D"], "correta": 0, "gabarito": "" }
          ]
        }
      ]
    }
  ],
  "nextId": 3
}
```

### IndexedDB — banco `pascal_videos`, store `videos`
| Chave | Valor |
|---|---|
| `String(lesson.id)` | `File` ou `Blob` do vídeo .mp4 |

> Fotos são salvas como base64 diretamente no JSON do localStorage. Vídeos são salvos como blobs no IndexedDB (suporta arquivos grandes). O player carrega o blob com `URL.createObjectURL()` e revoga ao trocar de aula.

---

## Modelos (`src/models/`)

### `Course.js`
```
id, name, topic, photoUrl (base64 ou ''), lessons: Lesson[]
Computed: lessonCount, topicInitial
```

### `Lesson.js`
```
id, name, desc, hasVideo (Boolean), videoName (string), questions: Question[]
Computed: questionCount
```

### `Question.js`
```
text, type ('aberta'|'fechada'), options[], correta (índice ou -1), gabarito
```

---

## API Client (`src/api/courses.js`)

Todas as funções usam localStorage + IndexedDB — sem servidor.

| Função | Armazenamento | Detalhes |
|---|---|---|
| `getAll()` | localStorage | Retorna array de `Course` |
| `getById(id)` | localStorage | Filtra getAll |
| `create(name, topic, photoFile)` | localStorage | Foto convertida para base64 |
| `remove(id)` | localStorage + IndexedDB | Apaga metadados e blobs de vídeo das aulas |
| `addLesson(courseId, {name,desc,videoFile,questions})` | localStorage + IndexedDB | Salva metadata no LS, blob no IndexedDB |
| `updateLesson(courseId, lessonId, ...)` | localStorage + IndexedDB | Novo vídeo sobrescreve blob no IndexedDB |
| `removeLesson(courseId, lessonId)` | localStorage + IndexedDB | Apaga metadata e blob do vídeo |

---

## Outros serviços (`src/api/`)

| Arquivo | Mantido | Propósito |
|---|---|---|
| `auth.js` | ✅ | login/logout via `Session.js` (localStorage) |
| `notes.js` | ✅ | Anotações por aula (localStorage) |
| `progress.js` | ✅ | Aulas concluídas (localStorage) |
| `videos.js` | ❌ DELETADO | Substituído por `src/lib/VideoDB.js` |

---

## Libraries (`src/lib/`)

| Arquivo | Status | Propósito |
|---|---|---|
| `Session.js` | ✅ | Sessão do usuário — localStorage key: `usuarioLogado` |
| `Queue.js` | ✅ | Fila FIFO para liberar questões por progresso do vídeo |
| `CoursesDB.js` | ❌ DELETADO | Substituído por localStorage (`pascal_courses`) |
| `VideoDB.js` | ✅ RECRIADO | IndexedDB para blobs de vídeo (`pascal_videos`) |

---

## localStorage (ainda em uso)

| Chave | Conteúdo |
|---|---|
| `usuarioLogado` | Objeto JSON do usuário logado |
| `pascal_note_{courseId}_{lessonId}` | Texto das anotações do aluno |
| `pascal_done_{courseId}` | Array JSON de IDs de aulas concluídas |
| `pascal_courses` | JSON completo de cursos + fotos base64 (nextId, courses[]) |

> Vídeos NÃO ficam no localStorage — estão no IndexedDB como blobs (suporta arquivos grandes).

---

## Usuários Hardcoded (para testes)

| Email | Senha | Tipo | Acesso |
|---|---|---|---|
| `cliente@pascal.com` | `123` | cliente | `/user.html`, `/courseView.html` |
| `profissional@pascal.com` | `123` | professor | `/pages/administrative.html`, `/pages/course.html` |
| `educacional@pascal.com` | `123` | educacional | `/pages/administrative.html`, `/pages/course.html` |

---

## Estilo (`src/css/`)

**Tema dark** — CSS Custom Properties:

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#0d1117` | Fundo principal |
| `--surface` | `#161b22` | Cards e painéis |
| `--surface2` | `#21262d` | Inputs e elementos internos |
| `--accent` | `#00c8a0` | Cor de destaque (teal) |
| `--text` | `#e6edf3` | Texto principal |
| `--muted` | `#8b949e` | Texto secundário |
| `--border` | `#30363d` | Bordas |

| Arquivo | Usado em |
|---|---|
| `global.css` | Todas as páginas — variáveis, reset, modal `.ativo` (landing/user) |
| `landing.css` | `index.html` — header, hero, planos, catálogo, apresentação |
| `user.css` | `user.html` — sidebar, busca, cards de cursos |
| `administrative.css` | `administrative.html` e `course.html` — layout sidebar + dashboard |
| `course.css` | `course.html` apenas — tabela de cursos, modais, formulários, questões |
| `courseView.css` | `courseView.html` — player, abas, overlay de questões |

---

## Features Especiais

- **Sistema de fila de questões** (`courseview.jsx` + `Queue.js`): questões liberadas em thresholds de progresso (20%–85%). Modal overlay ao desbloquear.
- **Auto-save de anotações** (`courseview.jsx`): debounce 700ms, salvo por aula em localStorage.
- **Vídeos via IndexedDB** (`courseview.jsx` + `VideoDB.js`): blob carregado com `getVideo(lesson.id)`, URL criada com `URL.createObjectURL()`, revogada ao trocar de aula.
- **MPA com portals**: entries usam `createPortal` para injetar React em divs específicos do HTML estático.
- **courseId via URL**: `courseView.html?courseId=1` — lido com `new URLSearchParams(window.location.search)`.

---

## Histórico de Mudanças

| Data | Arquivo(s) | O que mudou |
|---|---|---|
| 2026-06-16 | — | Documento criado com arquitetura inicial (SPA React) |
| 2026-06-16 | Todos | **Refatoração MPA**: convertido de SPA React para 5 HTML estáticos + React por página. Backend Express adicionado. Armazenamento migrado de localStorage/IndexedDB para `courses.json` + pastas `/photos/` `/videos/`. `react-router-dom` removido. |
| 2026-06-16 | `src/api/courses.js`, `src/lib/VideoDB.js`, `src/models/Course.js`, `src/models/Lesson.js`, `src/entries/course.jsx`, `src/entries/courseview.jsx`, `src/entries/user.jsx`, `src/entries/landing.jsx`, `vite.config.js`, `package.json`, `vercel.json` | **Remoção do backend Express**: migrado para armazenamento 100% browser. Metadados de cursos + fotos (base64) → localStorage (`pascal_courses`). Vídeos (blobs) → IndexedDB (`pascal_videos`) via `VideoDB.js` recriado. `server.js`, express, multer, cors, concurrently removidos. Deploy direto no Vercel. |
| 2026-06-17 | `administrative.html`, `course.html`, `courseView.html`, `user.html` → `pages/`, `vite.config.js`, `index.html`, `src/entries/*.jsx` | **Reorganização de estrutura**: 4 HTMLs movidos para `pages/`. Apenas `index.html` permanece na raiz. Todos os links internos atualizados para `/pages/`. |
| 2026-06-17 | `src/`, `pages/`, `public/` → `font/`, `vite.config.js`, `index.html`, `font/pages/*.html` | **Criação da pasta font/**: `src/`, `pages/` e `public/` movidos para `font/`. Raiz mantém apenas `index.html`, `.gitignore`, `CLAUDE.md`, `package.json`, `vite.config.js`, `vercel.json`. Referências `/src/entries/` atualizadas para `/font/src/entries/` em todos os HTMLs. `publicDir` atualizado no vite.config.js. |
| 2026-06-17 | `font/pages/` reorganizado | **Reorganização da pasta pages/**: criadas 4 subpastas — `html.pages/` (4 HTMLs), `css.pages/` (5 CSS movidos de `font/src/css/`), `assets.pages/fotos/` (imagens de `public/assets/fotos/`) + `assets.pages/icons/`, `js.pages/` (JS de modais extraídos: `course-modals.js`, `user-modals.js`). `public/` deletada. Todos os caminhos de CSS, assets e navegação atualizados em todos os arquivos HTML e React. `vite.config.js` atualizado para novos paths dos HTMLs. |
| 2026-06-17 | `font/src/` reorganizado | **Separação por tipo em src/**: criadas `react.src/` (todos .jsx: `App.jsx`, `main.jsx`, `entries/`, `pages/`) e `js.src/` (todos .js: `api/`, `lib/`, `models/`, `assets/`). Todos os imports relativos atualizados (`../api/` → `../../js.src/api/` etc.). Referências `/font/src/entries/` nos HTMLs atualizadas para `/font/src/react.src/entries/`. `course-modals.js` atualizado para `/font/src/js.src/api/courses.js`. |
| 2026-06-17 | `index.html`, `font/pages/html.pages/user.html`, `font/pages/js.pages/landingModals.js` (DELETADO), `font/pages/js.pages/userModals.js` (DELETADO) | **Fix modais landing/user**: substituídas referências `<script src>` externas por scripts inline nos HTMLs (`<script>;(function(){ ... }())</script>`). Eliminados arquivos `landingModals.js` e `userModals.js` como código morto. Usuário `profissional@pascal.com` (tipo `professor`) adicionado à lista hardcoded de usuários. |
| 2026-06-17 | `font/pages/css.pages/` todos | **Refactoring CSS**: removido CSS morto (tech-grid, charts/analytics, `.educacional`/`.empresarial`, paginação, `.course-gallery`, duplicatas). `administrative.css` 949→256 linhas; extraído `course.css` (578 linhas) com todo CSS de gerenciar cursos (tabela, modais, forms, questões). `landing.css` 452→364, `user.css` 510→360. `course.html` atualizado para linkar `course.css`. Total: 2675→2322 linhas. |
| 2026-06-17 | `font/pages/assets.pages/icons/lupa.png`, `font/pages/css.pages/user.css` | **Ícone de busca**: adicionado `background-image: url('../assets.pages/icons/lupa.png')` à classe `.search-icon` no `user.css`. |
| 2026-06-17 | `index.html`, `font/pages/css.pages/landing.css` | **Planos reativados + mobile fix**: removidas classes `card-plano-disabled`/badges "Não disponível". Plano Profissional ganhou botão "Registre-se" (dispara modal de auth). Planos Empresarial e Educacional ganharam botão "Entrar em contato" (link WhatsApp — placeholder `55SEUNUMERO`). `landing.css`: adicionado `overflow-x:hidden` no body, breakpoints 900/600/380px com fixes de padding, grid `hero-letter-row`, tamanho da imagem e tipografia mobile. |
