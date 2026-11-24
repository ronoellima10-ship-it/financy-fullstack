# Financy

Projeto final da Pós-Graduação em Desenvolvimento Full Stack com IA da Rocketseat.

O Financy é uma aplicação para gerenciamento de finanças pessoais. Cada usuário pode criar uma conta, autenticar-se e gerenciar apenas as próprias transações e categorias.

## Tecnologias

- Frontend: React, TypeScript, Vite, Apollo Client e CSS Modules
- Backend: Node.js, TypeScript, GraphQL, Apollo Server, Prisma e SQLite
- Autenticação: JWT
- Gerenciador de pacotes: npm workspaces

## Estrutura

```text
financy-fullstack/
├── frontend/
└── backend/
```

## Configuração

1. Instale as dependências na raiz:

   ```bash
   npm install
   ```

2. Copie os arquivos de ambiente:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Prepare o banco de dados:

   ```bash
   npm run prisma:generate --workspace backend
   npm run prisma:migrate --workspace backend
   ```

4. Inicie frontend e backend:

   ```bash
   npm run dev
   ```

## Requisitos do desafio

- Cadastro e login de usuários
- Isolamento de transações e categorias por usuário
- CRUD de transações
- CRUD de categorias
- API GraphQL
- Interface baseada no Figma oficial do Financy

## Operações iniciais da API

- `register(input: RegisterInput!)`: cria uma conta e retorna o JWT
- `login(input: LoginInput!)`: autentica o usuário e retorna o JWT
- `me`: retorna o usuário autenticado usando `Authorization: Bearer <token>`
- `health`: verifica se a API está disponível

