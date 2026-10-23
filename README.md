# ANTONIO STREAMING PROJECT

Versão atual: veja `version` no `package.json` (exibida no site como V1.x).

Site de streaming de filmes e séries em React + Vite, com modo escuro, carrosséis, Top 10, busca, Minha Lista e modal de detalhes. O acesso é restrito: login com Supabase e controle de cada usuário (bloqueio, expiração, troca de senha no primeiro acesso e registro de acessos). Um back-end Express confere o login e guarda as chaves secretas fora do navegador.

## Rodar localmente

```powershell
npm install
npm run dev:all
```

Abre em http://localhost:5173. Sem configuração, o site mostra a tela "Login não configurado".

Para ver o site funcionando sem configurar nada, use o modo demonstração (Supabase falso local):

```powershell
npm run dev:demo
```

Contas de teste (senha `Senha123`): `ok@teste.com` (liberada), `novo@teste.com` (primeiro acesso), `bloq@teste.com` (bloqueada), `exp@teste.com` (expirada).

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
| Criar pessoa já liberada | `npm run admin:criar-usuario -- email@exemplo.com SenhaInicial1 --nome "Maria" --dias 30` |
| Redefinir senha | `npm run admin:resetar-senha -- email@exemplo.com SenhaTemporaria1` |

Depois de configurar, rode `npm run verificar`: ele confere se o cadastro público está desligado, se a chave pública não acessa as tabelas de controle e se o gatilho funciona.

## Testes

```powershell
npm test
```

`test:db` valida o `supabase/setup.sql` num Postgres real (PGlite). `test:auth` testa as regras de acesso do back-end contra um Supabase falso. `test:proxy` testa as proteções da chave da API.

## Conectar a sua API do catálogo

Preencha `API_BASE_URL` e `API_KEY` em `server/chave_api.env`. Enquanto estiver vazio, o back-end entrega o catálogo de demonstração (`server/data/mockTitles.js`).

Proteções da chave (também em `server/chave_api.env`):
- `API_ALLOWED_PATHS`: únicos caminhos da API que o site pode chamar (padrão `/titles`).
- `API_CACHE_SECONDS`: tempo de cache das respostas (padrão 60).
- Redirecionamentos não são seguidos; respostas que não são JSON ou acima de 5 MB são recusadas; limite de 120 requisições por minuto por IP.

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
