# Publicação do Financy

## Variáveis obrigatórias

### Backend

| Variável | Exemplo | Observação |
| --- | --- | --- |
| `DATABASE_URL` | `file:/data/financy.db` | Use um diretório persistente |
| `JWT_SECRET` | chave aleatória longa | Nunca envie a chave ao GitHub |
| `PORT` | `4000` | Porta da API |

### Frontend

| Variável | Exemplo | Observação |
| --- | --- | --- |
| `VITE_BACKEND_URL` | `https://api.exemplo.com/graphql` | É incorporada durante o build |

## Execução com Docker Compose

Defina uma chave JWT no terminal e inicie os serviços:

```bash
export JWT_SECRET="substitua-por-uma-chave-segura"
docker compose up --build -d
```

- Frontend: `http://localhost:8080`
- GraphQL: `http://localhost:4000/graphql`
- Banco: volume persistente `financy_data`

Para carregar a conta demonstrativa dentro do contêiner:

```bash
docker compose exec backend npm run seed --workspace backend
```

## Hospedagem em serviços separados

1. Publique o backend usando `backend/Dockerfile` e associe um volume persistente em `/data`.
2. Configure `DATABASE_URL=file:/data/financy.db` e um `JWT_SECRET` secreto.
3. Publique o frontend usando `frontend/Dockerfile`.
4. Passe a URL pública do GraphQL como argumento `VITE_BACKEND_URL` no build do frontend.
5. Recompile o frontend sempre que a URL da API mudar.

O contêiner do backend aplica as migrations automaticamente antes de iniciar a API. O SQLite não deve ser hospedado em um sistema de arquivos efêmero.

## Backend acadêmico gratuito na Vercel

O backend pode ser publicado como uma Vercel Function no plano Hobby. Em cada
nova instância, a função copia o banco demonstrativo para o diretório temporário
`/tmp`. Os dados criados durante o uso podem ser reiniciados em um novo cold
start, comportamento aceitável para esta demonstração acadêmica.

1. Importe o repositório `ronoellima10-ship-it/financy-fullstack` na Vercel.
2. Selecione `backend` em **Root Directory**.
3. Mantenha **Other** como framework.
4. Cadastre somente `JWT_SECRET`, usando uma chave longa e aleatória.
5. Faça o deploy e use o endpoint público `/graphql`.

Conta demonstrativa:

- E-mail: `demo@financy.com`
- Senha: `Financy123`

## Demonstração acadêmica no Koyeb (indisponível para novas contas gratuitas)

O plano gratuito do Koyeb não oferece volume persistente. Para uma demonstração acadêmica, configure o serviço para recriar os dados de exemplo sempre que um novo contêiner for iniciado.

Configuração do serviço:

| Campo | Valor |
| --- | --- |
| Repositório | `ronoellima10-ship-it/financy-fullstack` |
| Branch | `main` |
| Builder | Dockerfile |
| Dockerfile | `backend/Dockerfile` |
| Porta | `4000` |
| Rota | `/` |

Variáveis:

```env
DATABASE_URL=file:/app/backend/prisma/financy.db
JWT_SECRET=gere-uma-chave-secreta-forte
PORT=4000
NODE_ENV=production
SEED_ON_START=true
```

Com `SEED_ON_START=true`, o processo aplica as migrations, cria a conta demonstrativa e inicia a API. Caso o armazenamento temporário seja apagado, os dados necessários para a apresentação são restaurados automaticamente.
