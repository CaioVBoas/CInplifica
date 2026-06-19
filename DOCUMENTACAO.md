# CInplifica — Documentação Oficial do Projeto

> Plataforma comunitária do Centro de Informática da UFPE (CIn-UFPE) para anúncios, vendas, achados e perdidos, comunicação acadêmica, chat em tempo real e fórum de discussão.

---

## 1. Visão Geral

O **CInplifica** é uma plataforma web dedicada à comunidade do CIn-UFPE. Ela centraliza, em um único lugar, as necessidades de comunicação e troca de bens e informações entre alunos, professores e demais membros do centro, substituindo a dispersão de grupos informais de mensagens.

A plataforma oferece:

- **Marketplace acadêmico** — anúncios de venda, doação (itens gratuitos), achados e perdidos e divulgações acadêmicas.
- **Chat em tempo real** — conversas diretas entre interessados e anunciantes via WebSockets.
- **Fórum** — tópicos, respostas e comentários para discussão da comunidade.
- **Notificações e alertas de interesse** — alertas por palavras-chave quando surgem anúncios relevantes.
- **Avaliações (reviews)** — reputação entre usuários após negociações concluídas.
- **Moderação e auditoria** — denúncias, ações de moderação, suspensão de usuários e trilha de auditoria.

O acesso é **restrito a e-mails institucionais** do domínio `@cin.ufpe.br`, garantindo que apenas membros validados da comunidade utilizem o sistema.

---

## 2. Arquitetura

O projeto segue uma arquitetura de **três camadas**, organizada como um **monorepo** gerenciado por `pnpm workspaces`.

```
┌─────────────────┐     HTTP/REST + WebSocket      ┌─────────────────┐     Prisma ORM     ┌──────────────┐
│   Client (Web)  │  ◄──────────────────────────►  │   API (Server)  │  ◄──────────────►  │  PostgreSQL  │
│  React + Vite   │                                │ Node + Express  │                    │   (Docker)   │
└─────────────────┘                                └─────────────────┘                    └──────────────┘
```

1. **Client** — SPA responsiva em React (TypeScript), com arquitetura baseada em *features* (vertical slicing).
2. **API Server** — API RESTful em Node.js + Express (TypeScript), com canal WebSocket (Socket.io) para o chat.
3. **Database** — PostgreSQL gerenciado pelo Prisma ORM.

### Princípios

- **Type-safety de ponta a ponta** — TypeScript no front-end, no back-end e tipos gerados pelo Prisma.
- **Separação de responsabilidades** no back-end: `routes` → `controllers` → `services` → `prisma`.
- **Vertical slicing** no front-end: cada funcionalidade encapsula seus componentes, hooks e serviços.

---

## 3. Stack de Tecnologias

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Linguagem | TypeScript | Padronização e segurança de tipos em todo o projeto |
| Front-end | React 18 + React Router 6 | SPA componentizada |
| Build (web) | Vite 4 | Dev server rápido e build otimizado |
| Estilização | Tailwind CSS 3 | Estilização utilitária e responsiva |
| Ícones | lucide-react | Conjunto de ícones |
| Back-end | Node.js + Express 4 | Simplicidade e performance |
| ORM | Prisma 6 | Type-safety e produtividade no acesso a dados |
| Banco | PostgreSQL 15 | Banco relacional robusto |
| Real-time | Socket.io 4 | Chat e contadores em tempo real |
| Autenticação | Passport + Google OAuth 2.0 + JWT | SSO por domínio institucional |
| Infra local | Docker Compose | Provisionamento do PostgreSQL |
| Gerenciador | pnpm (workspaces) | Monorepo |

---

## 4. Estrutura do Projeto

```
/
├── apps/
│   ├── api/                          # Back-end (Node.js + Express)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Modelagem das entidades
│   │   │   ├── migrations/           # Histórico de migrations
│   │   │   └── seed.ts               # Dados de desenvolvimento (idempotente)
│   │   └── src/
│   │       ├── config/               # Configuração de ambiente (env)
│   │       ├── controllers/          # Recebem requisições HTTP
│   │       ├── services/             # Lógica de negócio + Prisma Client
│   │       ├── routes/               # Definição de rotas REST
│   │       ├── middleware/           # Auth, roles, validações
│   │       ├── websocket/            # Lógica de chat em tempo real
│   │       └── index.ts              # Ponto de entrada
│   └── web/                          # Front-end (React + Tailwind)
│       └── src/
│           ├── features/             # Funcionalidades (vertical slicing)
│           │   ├── listings/         # Anúncios e achados/perdidos
│           │   ├── chat/             # Chat em tempo real
│           │   ├── forum/            # Fórum
│           │   ├── notifications/    # Alertas e notificações
│           │   └── moderation/       # Painel de moderação
│           ├── shared/               # Recursos compartilhados
│           │   ├── components/       # UI Kit
│           │   ├── hooks/            # Hooks globais
│           │   └── context/          # Contextos globais (AuthContext)
│           └── App.tsx               # Roteamento e setup global
├── scripts/
│   └── setup-dev.sh                  # Setup automatizado do ambiente
├── docker-compose.yml                # PostgreSQL
├── pnpm-workspace.yaml               # Configuração do monorepo
└── package.json                      # Scripts raiz do workspace
```

---

## 5. Modelo de Dados

O schema (`apps/api/prisma/schema.prisma`) define as seguintes entidades principais:

### Usuários e Anúncios

- **User** — usuário da plataforma. Campos: `email` (único), `name`, `picture`, `role`, `status` (`ACTIVE`/`SUSPENDED`), `suspendedAt`. É o centro de quase todos os relacionamentos.
- **Listing** — anúncio. Suporta múltiplos tipos via `category` e campos específicos:
  - Venda/Doação: `price`, `isFree`, `imageUrl`.
  - Achados e Perdidos: `lostFoundLocation`, `lostFoundOccurredAt`, `lostFoundStatus`.
  - Acadêmico: `academicExternalLink`, `academicSubject`, `academicProfessor`, `academicTerm`.

### Chat

- **Conversation** — conversa, opcionalmente vinculada a um `Listing`. Tem `status` (`OPEN`/concluída) e `completedBy`/`completedAt`.
- **Message** — mensagem de uma conversa.
- **MessageRead** — controle de leitura por usuário (para contagem de não lidas).

### Notificações e Interesses

- **InterestKeyword** — palavra-chave de interesse cadastrada por um usuário.
- **Notification** — notificação (`type`: `MESSAGE` ou `INTEREST_ALERT`), com `readAt`, `title`, `body`, `link`.

### Moderação e Auditoria

- **Report** — denúncia. `targetType` (`LISTING`/`MESSAGE`/`CONVERSATION`), `status` (`PENDING`/`REVIEWED`/`DISMISSED`/`RESOLVED`).
- **ModerationAction** — ação de moderação (`APPROVE_REPORT`, `REJECT_REPORT`, `SUSPEND_USER`, `REMOVE_CONTENT`).
- **AuditLog** — trilha de auditoria genérica (`action`, `entityType`, `entityId`, `actorId`, `metadata`).

### Reputação

- **Review** — avaliação de um usuário por outro após uma conversa. `rating`, `comment`. Restrição de unicidade por `(reviewer, conversation, reviewedUser)`.

### Fórum

- **ForumTopic** → **ForumAnswer** → **ForumComment** — estrutura hierárquica de discussão.

> Os modelos usam `@@index` em campos de consulta frequente (ordenação por data, busca por status, etc.) e `onDelete: Cascade` onde apropriado.

---

## 6. Autenticação e Autorização

### Login

- **Google OAuth 2.0 (SSO)** via Passport (`passport-google-oauth20`). O fluxo:
  1. `GET /api/auth/login` → redireciona ao Google (`prompt: select_account`, restrito ao domínio).
  2. `GET /api/auth/callback` → valida o e-mail, faz *upsert* do usuário e redireciona ao front com um **JWT**.
- **Restrição de domínio** — apenas e-mails terminados em `@cin.ufpe.br` (configurável via `ALLOWED_EMAIL_DOMAIN`) são aceitos, tanto no login quanto no middleware.
- **Mock login (apenas dev)** — `GET /api/auth/mock-login?email=...` gera um token sem Google. Bloqueado em produção.

### Sessão

- **JWT** com validade de 30 dias, contendo `id`, `email`, `name`, `picture`, `role`, `status`.
- O `authMiddleware` valida o token, confirma o domínio do e-mail, recarrega o usuário do banco e bloqueia usuários `SUSPENDED`.

### Papéis (roles)

- `STUDENT` (padrão), `MODERATOR`, `ADMIN`.
- `requireRole(['ADMIN', 'MODERATOR'])` protege rotas de moderação e auditoria.

---

## 7. API REST

Base: `http://localhost:3011/api`

| Recurso | Rota base | Destaques |
|---------|-----------|-----------|
| Health | `GET /health` | Status do servidor |
| Auth | `/api/auth` | `login`, `callback`, `mock-login` (dev) |
| Listings | `/api/listings` | `GET /`, `GET /mine`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /upload-image` |
| Conversations | `/api/conversations` | listar, `unread-count`, criar/obter, `:id/complete`, `:id/read`, `:id/messages` |
| Reviews | `/api/reviews` | `GET /users/:userId`, `POST /` |
| Notifications | `/api/notifications` | listar, `unread-count`, `mark-all-read` |
| Interests | `/api/interests` | CRUD de `keywords` |
| Forum | `/api/forum` | tópicos, respostas e comentários (CRUD) |
| Reports | `/api/reports` | criar (qualquer usuário), listar/atualizar (moderação) |
| Moderation | `/api/moderation` | ações, aprovar/rejeitar denúncia, remover conteúdo, suspender usuário |
| Audit Logs | `/api/audit-logs` | listagem (somente ADMIN/MODERATOR) |

Uploads de imagem são servidos estaticamente em `/uploads`. O corpo das requisições aceita até `7mb` (limite de upload configurável via `MAX_UPLOAD_BYTES`, padrão 5 MB).

---

## 8. Tempo Real (WebSockets)

O servidor Socket.io compartilha a porta da API. Fluxo:

- **Handshake autenticado** — o cliente envia o JWT em `auth.token`; conexões sem token válido ou de usuários suspensos são recusadas.
- Cada socket entra na sala pessoal `user:{id}` (para notificações direcionadas).
- **Eventos do cliente**: `join_conversation`, `send_message`.
- **Eventos do servidor**: `new_message` (broadcast na sala da conversa) e `unread_count_updated` (atualiza o contador de não lidas dos participantes).

---

## 9. Front-end

- **SPA** com React Router. Quase todas as rotas são protegidas por `ProtectedRoute`; `/moderation` exige papel `ADMIN`/`MODERATOR`.
- **AuthContext** (`shared/context`) centraliza estado de autenticação (`user`, `token`, `isAuthenticated`, `logout`).
- **Rotas principais**: `/` (home/feed), `/login`, `/auth/success`, `/listings/:id`, `/listings/new`, `/listings/:id/edit`, `/forum`, `/forum/novo`, `/forum/:id`, `/meus-anuncios`, `/chat`, `/alerts`, `/moderation`.
- O `Header` exibe um *badge* de não lidas que combina notificações de interesse e mensagens, atualizado em tempo real via socket.
- Identidade visual baseada no vermelho institucional (`red-600`) sobre fundo âmbar claro.

---

## 10. Configuração de Ambiente

Variáveis da API (`apps/api/.env`, a partir de `.env.example`):

| Variável | Descrição | Padrão (dev) |
|----------|-----------|--------------|
| `DATABASE_URL` | Conexão PostgreSQL | `postgresql://user:password@localhost:5431/cinplifica?schema=public` |
| `PORT` | Porta da API | `3011` |
| `JWT_SECRET` | Segredo do JWT (≥ 32 chars em produção) | — |
| `FRONTEND_URL` | Origem do front (CORS) | `http://localhost:5173` |
| `NODE_ENV` | Ambiente | `development` |
| `ALLOWED_EMAIL_DOMAIN` | Domínio permitido | `cin.ufpe.br` |
| `UPLOAD_ROOT` | Pasta de uploads | `uploads` |
| `MAX_UPLOAD_BYTES` | Tamanho máximo de upload | `5242880` (5 MB) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciais OAuth | — |
| `GOOGLE_CALLBACK_URL` | Callback do OAuth | `http://localhost:3011/api/auth/callback` |

> Em **produção**, as variáveis de banco, front, JWT e Google são obrigatórias e validadas na inicialização (e o JWT precisa ter ≥ 32 caracteres). O mock login é desativado.

---

## 11. Como Rodar Localmente

**Pré-requisitos:** Node.js, pnpm e Docker Desktop.

```bash
# 1. Instalar dependências
pnpm install

# 2. Criar o .env da API
cp apps/api/.env.example apps/api/.env

# 3. Subir o banco
docker compose up -d

# 4. Gerar o Prisma Client e aplicar migrations
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate

# 5. Popular o banco com dados de teste
pnpm db:seed

# 6. Rodar a API (terminal 1)
pnpm api

# 7. Rodar o front-end (terminal 2)
pnpm web
```

Acessos:

- Front-end: `http://localhost:5173`
- API: `http://localhost:3011`
- Health check: `http://localhost:3011/health`

Login local sem Google:

```
http://localhost:3011/api/auth/mock-login
http://localhost:3011/api/auth/mock-login?email=admin@cin.ufpe.br
```

> Alternativamente, `pnpm setup` (`scripts/setup-dev.sh`) automatiza a criação dos `.env`, instalação de dependências e subida do banco.

### Scripts do workspace (raiz)

| Script | Ação |
|--------|------|
| `pnpm setup` | Setup completo do ambiente de dev |
| `pnpm api` | Sobe a API em modo dev |
| `pnpm web` | Sobe o front-end em modo dev |
| `pnpm db:seed` | Popula o banco com dados mockados |

---

## 12. Dados de Desenvolvimento (Seed)

O seed (`pnpm db:seed`) é **idempotente** e pode rodar várias vezes. Ele cria usuários com avatar, anúncios com imagens, conversas, mensagens, alertas, denúncias, ações de moderação, logs de auditoria e conteúdo inicial do fórum.

Usuários principais:

| E-mail | Perfil |
|--------|--------|
| `test@cin.ufpe.br` | Aluno padrão |
| `admin@cin.ufpe.br` | Administrador |
| `maria.silva@cin.ufpe.br` | Vendedora |
| `joao.souza@cin.ufpe.br` | Vendedor |
| `carla.melo@cin.ufpe.br` | Acadêmico |

---

## 13. Funcionalidades Principais (resumo)

- ✅ **Autenticação SSO** por domínio institucional `@cin.ufpe.br`.
- ✅ **Anúncios** multi-tipo: venda, doação, achados e perdidos, acadêmico — com upload de imagem, filtros por categoria e busca.
- ✅ **Chat em tempo real** vinculado a anúncios, com contadores de não lidas e conclusão de negociação.
- ✅ **Avaliações** entre usuários após conversas concluídas.
- ✅ **Alertas de interesse** por palavras-chave e notificações.
- ✅ **Fórum** com tópicos, respostas e comentários.
- ✅ **Moderação**: denúncias, ações, suspensão de usuários e remoção de conteúdo.
- ✅ **Auditoria** completa das ações sensíveis.

---

## 14. Planejamento em Sprints

A divisão abaixo é uma **estimativa reconstruída a partir do histórico do projeto** (commits e migrations do banco). As datas e a distribuição de esforço são aproximadas e servem para documentar a evolução do produto.

| Sprint | Tema | Principais entregas | Estimativa |
|--------|------|---------------------|-----------|
| **Sprint 1** | Fundação & Infraestrutura | Monorepo (pnpm workspaces), Docker Compose com PostgreSQL, schema inicial do Prisma, configuração de ambiente, MVP do marketplace e chat, ajuste de porta do banco. | ~20% |
| **Sprint 2** | Marketplace, Chat & Moderação | Fluxos completos de anúncios no front, chat em tempo real (Socket.io), denúncias, ações de moderação, auditoria e notificações/interesses (back-end + web). | ~25% |
| **Sprint 3** | Autenticação & Segurança | Login via Google SSO (Passport + OAuth 2.0), restrição ao domínio `@cin.ufpe.br`, JWT, proteção de rotas por papel, mock login para desenvolvimento. | ~15% |
| **Sprint 4** | Fórum, Avaliações & Perfil | Módulo de fórum (tópicos, respostas, comentários), avaliações entre usuários (reviews/transações concluídas), categorias de anúncio, página "Meus Anúncios", avatar do usuário. | ~25% |
| **Sprint 5** | Polimento & Entrega | Seed de desenvolvimento idempotente com fotos reais, refatoração da landing/home page, documentação de setup, correções de regras de anúncio e seleção de conta no login Google. | ~15% |

> A estimativa de esforço é qualitativa (peso relativo de cada sprint), não uma medição de horas. Sprints 2 e 4 concentraram a maior parte das funcionalidades de produto.

---

*Documento mantido pela equipe do CInplifica — Centro de Informática · UFPE · Recife.*
