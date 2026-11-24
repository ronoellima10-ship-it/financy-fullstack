# Publicação do Financy

## Variáveis obrigatórias

### Backend

| Variável | Exemplo | Observação |
| --- | --- | --- |
| `DATABASE_URL` | `file:/data/financy.db` | Necessária na execução local ou em contêiner persistente |
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

## Hospedagem convencional em serviços separados

1. Publique o backend usando `backend/Dockerfile` e associe um volume persistente em `/data`.
2. Configure `DATABASE_URL=file:/data/financy.db` e um `JWT_SECRET` secreto.
3. Publique o frontend usando `frontend/Dockerfile`.
4. Passe a URL pública do GraphQL como argumento `VITE_BACKEND_URL` no build do frontend.
5. Recompile o frontend sempre que a URL da API mudar.

O contêiner do backend aplica as migrations automaticamente antes de iniciar a API. Para uma aplicação real, o arquivo SQLite deve ficar em armazenamento persistente.

## Backend acadêmico gratuito na Vercel

O backend está publicado como uma Vercel Function no plano Hobby. Em cada nova
instância, a função prepara o banco demonstrativo no diretório temporário
`/tmp`. Os dados criados durante o uso podem ser reiniciados em um novo cold
start, comportamento adotado exclusivamente para esta demonstração acadêmica.

1. Importe o repositório `ronoellima10-ship-it/financy-fullstack` na Vercel.
2. Selecione `backend` em **Root Directory**.
3. Mantenha **Other** como framework.
4. Cadastre somente `JWT_SECRET`, usando uma chave longa e aleatória.
5. Faça o deploy e use o endpoint público `/graphql`.

Endereços publicados:

- Frontend: <https://financy-frontend-beryl.vercel.app/login>
- API GraphQL: <https://financy-backend.vercel.app/graphql>

Conta demonstrativa:

- E-mail: `demo@financy.com`
- Senha: `Financy123`

