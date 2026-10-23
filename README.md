# ANTONIO STREAMING PROJECT

Versão atual: veja `version` no `package.json` (exibida no site como V1.x).

Site de streaming de filmes e séries em React + Vite, com modo escuro, carrosséis, Top 10, busca, Minha Lista e modal de detalhes. O acesso é restrito: login com Supabase e controle de cada usuário (bloqueio, expiração, troca de senha no primeiro acesso e registro de acessos). Um back-end Express confere o login e guarda as chaves secretas fora do navegador.

## Rodar localmente

```powershell
npm install
npm run dev:all
```

Abre em http://localhost:5173. Sem configuração, o site mostra a tela "Login não configurado".

## Configurar o login (Supabase)

1. Crie um projeto gratuito em https://supabase.com.
2. **SQL Editor:** cole e rode o conteúdo de `supabase/setup.sql`.
3. **Authentication > Sign In / Providers:** desligue "Allow new users to sign up".
4. Copie os modelos e preencha com os dados de **Project Settings > API Keys**:
   - `.env.example` -> `.env`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave pública).
   - `server/chave_api.env.example` -> `server/chave_api.env`: `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (chave secreta).
5. Reinicie com `npm run dev:all`.

## Gerenciar usuários

| Ação | Onde |
|---|---|
| Criar usuário | Authentication > Users > Add user > Create new user (marque "Auto Confirm User") |
| Liberar / bloquear | Table Editor > `profiles` > coluna `ativo` (toda conta nasce bloqueada) |
| Data de expiração | Table Editor > `profiles` > coluna `expira_em` (vazio = sem expiração) |
| Nome exibido | Table Editor > `profiles` > coluna `nome` |
| Ver acessos | Table Editor > `access_logs` |
| Redefinir senha | `npm run admin:resetar-senha -- email@exemplo.com SenhaTemporaria1` |

## Conectar a sua API do catálogo

Preencha `API_BASE_URL` e `API_KEY` em `server/chave_api.env`. Enquanto estiver vazio, o back-end entrega o catálogo de demonstração (`server/data/mockTitles.js`).

`server/chave_api.env` e `.env` estão no `.gitignore` e nunca devem ser enviados ao repositório.

## Estrutura

```
server/app.js            rotas: login, catálogo, proxy da API
server/auth.js           regras de acesso (ativo, expiração, troca de senha, registros)
server/chave_api.env     chaves secretas (local, ignorado pelo git)
server/data/             catálogo de demonstração
supabase/setup.sql       tabelas profiles e access_logs
src/Root.jsx             decide entre login, troca de senha e catálogo
src/pages/               telas de login e troca de senha
src/services/api.js      chamadas do site ao back-end
src/components/          Header, Hero, Row, MovieCard, MovieModal...
```
