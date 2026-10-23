# Histórico de versões

Cada commit no GitHub sobe a versão (V1.2, V1.3, ...). A V2.0 será a versão com a API real conectada.
A versão fica em um único lugar: `version` no `package.json`.

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
