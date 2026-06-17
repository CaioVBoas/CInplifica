# CInplifica

O CInplifica é uma plataforma dedicada à comunidade do CIn-UFPE para organizar anúncios, vendas, achados e perdidos, e comunicações acadêmicas.

## Como rodar localmente

Pré-requisitos:

- Node.js instalado
- pnpm instalado
- Docker Desktop aberto

1. Instale as dependências:

```bash
pnpm install
```

2. Crie o arquivo de ambiente da API:

```bash
cp apps/api/.env.example apps/api/.env
```

No Windows PowerShell, se `cp` não funcionar:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

3. Suba o banco de dados:

```bash
docker compose up -d
```

4. Gere o Prisma Client e aplique as migrations:

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

5. Popule o banco com dados de teste:

```bash
pnpm db:seed
```

6. Rode a API em um terminal:

```bash
pnpm api
```

7. Rode o front-end em outro terminal:

```bash
pnpm web
```

Depois acesse:

- Front-end: http://localhost:5173
- API: http://localhost:3011
- Health check: http://localhost:3011/health

Para login local sem Google, use o endpoint de mock login:

```text
http://localhost:3011/api/auth/mock-login
http://localhost:3011/api/auth/mock-login?email=admin@cin.ufpe.br
```

## Dados de desenvolvimento

Para popular o banco local com dados mockados:

```bash
pnpm db:seed
```

O seed é idempotente e pode ser executado mais de uma vez. Ele cria usuários com avatar,
anúncios com imagens, conversas, mensagens, alertas, denúncias, ações de moderação,
logs de auditoria e conteúdo inicial para o fórum.

No ambiente local, você pode gerar token para perfis mockados pelo endpoint:

```bash
http://localhost:3011/api/auth/mock-login
http://localhost:3011/api/auth/mock-login?email=admin@cin.ufpe.br
```

Usuários principais:

- `test@cin.ufpe.br` - aluno padrão
- `admin@cin.ufpe.br` - administrador
- `maria.silva@cin.ufpe.br` - vendedora
- `joao.souza@cin.ufpe.br` - vendedor
- `carla.melo@cin.ufpe.br` - acadêmico

## Arquitetura

O projeto segue uma arquitetura de três camadas:
1. **Client**: SPA responsiva em React (TypeScript) com arquitetura baseada em features.
2. **API Server**: API RESTful em Node.js com Express (TypeScript).
3. **Database**: PostgreSQL gerenciado pelo Prisma ORM.

## Tecnologias

- **Linguagem**: TypeScript (Padronizado em todo o projeto)
- **Front-end**: React + Tailwind CSS (Estilização utilitária e responsiva)
- **Back-end**: Node.js + Express (Simplicidade e performance)
- **Banco de Dados**: PostgreSQL + Prisma ORM (Type-safety e produtividade)
- **Real-time**: WebSockets com Socket.io (Chat em tempo real)

## Estrutura do Projeto Detalhada

```
/
├── apps/
│   ├── api/                    # Camada de Back-end (Node.js + Express)
│   │   ├── prisma/             # Configurações do Banco de Dados
│   │   │   └── schema.prisma   # Modelagem das entidades (User, Listing, Chat)
│   │   ├── src/
│   │   │   ├── controllers/    # Controladores: Recebem requisições HTTP e enviam para os serviços
│   │   │   ├── services/       # Serviços: Onde reside a lógica de negócio e chamadas ao Prisma Client
│   │   │   ├── middleware/     # Middlewares: Autenticação (CIn-SSO), Validação e Tratamento de Erros
│   │   │   ├── websocket/      # Lógica de WebSockets para o chat em tempo real
│   │   │   └── index.ts        # Ponto de entrada da aplicação
│   │   └── package.json
│   └── web/                    # Camada de Front-end (React + Tailwind)
│       ├── src/
│       │   ├── features/        # Arquitetura baseada em Funcionalidades (Vertical Slicing)
│       │   │   ├── listings/    # Ex: Módulo de Anúncios e Achados/Perdidos
│       │   │   │   ├── components/ # Componentes exclusivos da funcionalidade
│       │   │   │   ├── hooks/      # Hooks de estado e lógica da funcionalidade
│       │   │   │   ├── services/   # Integração com a API específica da funcionalidade
│       │   │   │   └── ListingsPage.tsx # Página principal da funcionalidade
│       │   │   ├── chat/        # Módulo de Chat em Tempo Real
│       │   │   └── auth/        # Módulo de Autenticação (CIn-SSO)
│       │   ├── shared/          # Recursos Compartilhados
│       │   │   ├── components/  # UI Kit (Botões, Inputs, Modais - Estilizados com Tailwind)
│       │   │   ├── hooks/       # Hooks globais (useAuth, useLocalStorage)
│       │   │   └── context/     # Contextos globais do React
│       │   └── App.tsx          # Roteamento e Setup Global
│       ├── tailwind.config.js   # Configurações do Tailwind CSS
│       └── package.json
├── docker-compose.yml           # Orquestração do PostgreSQL e Redis
└── package.json                 # Configuração do Workspace (Monorepo)
```
