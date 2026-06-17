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
| `index.html` | Landing | Nenhum | `src/entries/landing.jsx` |
| `pages/user.html` | Meus Cursos | `tipo === 'cliente'` → redireciona para `/index.html` | `src/entries/user.jsx` |
| `pages/administrative.html` | Dashboard | `tipo in [professor,educacional,empresarial]` | `src/entries/administrative.jsx` |
| `pages/course.html` | Gerenciar Cursos | idem administrative | `src/entries/course.jsx` |
| `pages/courseView.html` | Aula | `tipo === 'cliente'` | `src/entries/courseview.jsx` |

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

| Arquivo | Importado em |
|---|---|
| `global.css` | Todos os entries (via Vite) |
| `landing.css` | `entries/landing.jsx` |
| `user.css` | `entries/user.jsx` |
| `administrative.css` | `entries/administrative.jsx` e `entries/course.jsx` |
| `course-view.css` | `entries/courseview.jsx` |

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
