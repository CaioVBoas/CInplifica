# CInplifica

O CInplifica é uma plataforma dedicada à comunidade do CIn-UFPE para organizar anúncios, vendas, achados e perdidos, e comunicações acadêmicas.

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
