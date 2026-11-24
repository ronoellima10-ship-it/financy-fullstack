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
