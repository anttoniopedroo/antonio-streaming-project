# ANTONIO STREAMING PROJECT V1.1

Site de streaming de filmes e séries em React + Vite, com modo escuro, carrosséis, Top 10, busca, Minha Lista e modal de detalhes. Inclui um back-end Express que guarda a chave da API fora do navegador.

## Rodar localmente

```powershell
npm install
npm run dev:all
```

Abre em http://localhost:5173. Sem configuração, o site usa um catálogo fictício de demonstração (`src/data/mockTitles.js`).

## Conectar a sua API

1. Copie `server/chave_api.env.example` para `server/chave_api.env`.
2. Em `server/chave_api.env`, preencha `API_BASE_URL` e `API_KEY` (a chave entra aqui) e ajuste como a API recebe a chave.
3. Crie um `.env` na raiz com `VITE_API_BASE_URL=/api`.
4. Reinicie com `npm run dev:all`. Confira em http://localhost:5173/api/health.

`server/chave_api.env` e `.env` estão no `.gitignore` e nunca devem ser enviados ao repositório.

## Estrutura

```
server/index.js          back-end (proxy que adiciona a chave)
server/chave_api.env     sua chave (local, ignorado pelo git)
src/services/api.js      chamadas de rede do site
src/data/mockTitles.js   dados de demonstração
src/components/          Header, Hero, Row, MovieCard, MovieModal...
src/index.css            design system e animações
```
