// Testa as regras de acesso do back-end (server/app.js) contra um Supabase falso.
// Rode com: npm run test:auth
import './fake-supabase.mjs';

// Antes de importar o app: aponta para o Supabase falso e garante modo demonstração.
Object.assign(process.env, {
  SUPABASE_URL: 'http://127.0.0.1:5056',
  SUPABASE_SECRET_KEY: 'chave-falsa-de-teste',
  API_BASE_URL: '',
  API_KEY: '',
});
const { app } = await import('../server/app.js');

const server = app.listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api`;

// Tokens do Supabase falso: a "chave" do usuário dentro de um JWT de mentira.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (key) => `${b64({ alg: 'HS256' })}.${b64({ key })}.sig`;

let fails = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'OK  ' : 'FALHA'} ${msg}`);
  if (!cond) fails++;
};
const call = async (path, { user, method = 'GET', body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(user ? { Authorization: `Bearer ${token(user)}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

let r = await call('/health');
ok(r.status === 200 && r.body.login === true, 'health responde e indica login configurado');

r = await call('/catalog');
ok(r.status === 401 && r.body.code === 'sem_sessao', 'sem token: 401');

r = await call('/catalog', { user: 'inexistente' });
ok(r.status === 401 && r.body.code === 'sessao_invalida', 'token inválido: 401');

r = await call('/catalog', { user: 'blocked' });
ok(r.status === 403 && r.body.code === 'bloqueado', 'usuário bloqueado: 403');

r = await call('/catalog', { user: 'expired' });
ok(r.status === 403 && r.body.code === 'expirado', 'usuário expirado: 403');

r = await call('/catalog', { user: 'trocar' });
ok(r.status === 403 && r.body.code === 'trocar_senha', 'troca de senha pendente: catálogo bloqueado');

r = await call('/me', { user: 'trocar' });
ok(r.status === 200 && r.body.trocarSenha === true, 'troca de senha pendente: /me informa');

r = await call('/change-password', { user: 'trocar', method: 'POST', body: { novaSenha: 'abc' } });
ok(r.status === 400 && r.body.code === 'senha_invalida', 'senha fraca recusada');

r = await call('/change-password', { user: 'trocar', method: 'POST', body: { novaSenha: 'SenhaNova123' } });
ok(r.status === 200, 'senha válida aceita');

r = await call('/me?evento=login', { user: 'ok' });
ok(r.status === 200 && r.body.email === 'ok@teste.com' && r.body.demo === true, 'usuário liberado: /me');

r = await call('/catalog', { user: 'ok' });
ok(r.status === 200 && Array.isArray(r.body) && r.body.length > 0, 'usuário liberado recebe o catálogo');

r = await call('/search?q=lua', { user: 'ok' });
ok(r.status === 200 && r.body.some((t) => t.title === 'Lua de Papel'), 'busca funciona');

r = await call('/titles/1', { user: 'ok' });
ok(r.status === 503 && r.body.code === 'api_nao_configurada', 'proxy sem API configurada: 503');

r = await call('/titles', { user: 'ok', method: 'POST', body: {} });
ok(r.status === 405, 'proxy só aceita GET');

r = await call('/logout', { user: 'ok', method: 'POST' });
ok(r.status === 200, 'logout registrado');

// Registros gravados no "banco" falso
const log = await (await fetch('http://127.0.0.1:5056/__log')).json();
const eventos = log.filter((e) => e.tipo === 'access_log').map((e) => e.body.evento);
for (const ev of ['bloqueado', 'expirado', 'troca_senha', 'login', 'logout']) {
  ok(eventos.includes(ev), `access_logs registrou "${ev}"`);
}
ok(log.some((e) => e.tipo === 'update_profile' && e.body.trocar_senha === false), 'troca de senha desmarca trocar_senha');
ok(log.some((e) => e.tipo === 'update_profile' && e.body.ultimo_acesso), 'login atualiza ultimo_acesso');

server.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTodos os testes passaram.');
process.exit(fails ? 1 : 0);
