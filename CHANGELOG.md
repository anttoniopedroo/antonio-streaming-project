# Histórico de versões

Cada commit no GitHub sobe a versão (V1.2, V1.3, ...). A V2.0 será a versão com a API real conectada.
A versão fica em um único lugar: `version` no `package.json`.

## V1.6

- `.gitattributes`: PDFs, imagens e fontes marcados como binários, para o git nunca converter quebras de linha neles (evita PDF corrompido ao clonar no Windows).
- Tutorial em PDF regerado com a versão atual.

## V1.5

- Pronto para a Vercel (ainda não publicado):
  - `api/index.js`: o mesmo back-end vira uma função da Vercel; `vercel.json` encaminha `/api/*` para ela.
  - Cabeçalhos de segurança em todas as páginas: Content-Security-Policy estrita (só scripts/estilos/fontes do próprio site, conexões só com o Supabase), anti-clickjacking, HSTS, Referrer-Policy, Permissions-Policy. Cache longo para os arquivos com hash.
  - `npm run preview:prod`: prévia local com os MESMOS cabeçalhos do `vercel.json`. Fluxo completo testado sem nenhuma violação de CSP.
- Tutorial em PDF (`docs/Tutorial_Chave_API.pdf`) atualizado para o login, as proteções da chave e os erros novos (404 de caminho não permitido, 429). Gerador em `docs/gerar_tutorial.py` lê a versão do `package.json`.

## V1.4

Segurança (referência: OWASP API Security Top 10 2023):
- Proxy da API só aceita caminhos permitidos (`API_ALLOWED_PATHS`, padrão `/titles`): ninguém consegue usar a sua chave em outros endpoints do provedor (conta, cobrança...).
- Redirecionamentos da API não são seguidos (a chave não vaza para outro host); respostas que não são JSON ou acima de 5 MB são recusadas.
- Cache das respostas da API (`API_CACHE_SECONDS`, padrão 60 s): economiza a cota da chave.
- Limite de requisições por IP (120/min na API, 10 a cada 15 min na troca de senha).
- Cabeçalhos de segurança (helmet) e `Cache-Control: no-store` nas respostas com dados de usuário.
- Tentativas de bloqueados/expirados registradas no máximo 1 vez a cada 10 min por pessoa.
- Vite atualizado para a 8.x: corrige a falha do servidor de desenvolvimento (GHSA-67mh-4wv8-2f99). `npm audit`: 0 vulnerabilidades.

Desempenho:
- Token conferido com `getClaims` (verificação local com as chaves assimétricas do Supabase), sem ida ao servidor de Auth a cada requisição.
- Código inicial do site: 114 KB -> 52 KB (gzip). O catálogo é baixado só depois do login, em segundo plano enquanto a pessoa digita a senha.
- Cards e fileiras memorizados: não re-renderizam a cada toast ou tecla digitada.
- Fontes servidas pelo próprio site (sem Google Fonts): menos uma conexão externa e o IP dos visitantes não vai para o Google.

Outros:
- `npm run dev:demo`: site completo com um Supabase falso, para ver e testar sem configurar nada.
- `npm run test:proxy`: testa todas as proteções acima.

## V1.3

- `supabase/setup.sql` reforçado: além do RLS, as contas públicas (anon/authenticated) perdem qualquer permissão nas tabelas de controle, e a função do gatilho não pode ser chamada pela API.
- Testes automatizados (`npm test`):
  - `test:db`: roda o `setup.sql` num Postgres real (PGlite) e confirma que o navegador não lê nem altera `profiles`/`access_logs`, que contas nascem bloqueadas e que o gatilho funciona para o serviço de autenticação.
  - `test:auth`: testa o back-end contra um Supabase falso (sem sessão, token inválido, bloqueado, expirado, troca de senha, liberado, registros).
- `npm run admin:criar-usuario`: cria uma pessoa já liberada (nome, prazo em dias, troca de senha).
- `npm run verificar`: auditoria automática do Supabase real (cadastro público desligado, tabelas protegidas da chave pública, gatilho).

## V1.2

- Tela de login com Supabase (e-mail e senha), sem cadastro público.
- Troca de senha obrigatória no primeiro acesso, com regras validadas no navegador e no servidor.
- Controle de acesso por usuário na tabela `profiles`: `ativo` (bloquear/liberar), `expira_em` (prazo), `nome`.
- Registro de acessos na tabela `access_logs`: login, logout, troca de senha, tentativas bloqueadas e expiradas.
- Catálogo de demonstração movido para o servidor: só é entregue depois de conferir o login.
- Menu da conta no avatar (nome, e-mail, validade do acesso, Sair).
- Script `npm run admin:resetar-senha` para redefinir a senha de alguém.
- Versão do projeto centralizada no `package.json`.

## V1.1

- Site de streaming em React + Vite, modo escuro, hero rotativo, carrosséis, Top 10, busca, Minha Lista, modal de detalhes.
- Back-end Express que guarda a chave da API em `server/chave_api.env`.
