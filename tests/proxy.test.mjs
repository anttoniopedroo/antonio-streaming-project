// Testa as proteções do proxy da API (lista de caminhos, cache, validação da
// resposta, cabeçalhos e limite de requisições) contra uma API falsa.
// Rode com: npm run test:proxy
import http from 'node:http';
process.env.FAKE_SUPABASE_PORT = '0';
const { tokenOf, url: fakeUrl, close: closeFake } = await import('./fake-supabase.mjs');

// ---- API externa falsa ----
const hits = {};
let lastAuth = null;
const upstream = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  hits[path] = (hits[path] ?? 0) + 1;
  lastAuth = req.headers.authorization ?? null;
  if (path === '/titles') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify([{ id: 1, title: 'Da API' }]));
  }
  if (path === '/titles/redirect') {
    res.writeHead(302, { location: 'http://example.com/roubar' });
    return res.end();
  }
  if (path === '/titles/html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<h1>oi</h1>');
  }
  if (path === '/titles/grande') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ x: 'a'.repeat(6 * 1024 * 1024) }));
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ segredo: 'endpoint que não deveria ser alcançado' }));
});
await new Promise((r) => upstream.listen(0, '127.0.0.1', r));

Object.assign(process.env, {
  SUPABASE_URL: fakeUrl,
  SUPABASE_SECRET_KEY: 'chave-falsa-de-teste',
  API_BASE_URL: `http://127.0.0.1:${upstream.address().port}`,
  API_KEY: 'chave-api-falsa',
  API_KEY_HEADER: 'Authorization',
  API_KEY_PREFIX: 'Bearer',
  API_KEY_QUERY_PARAM: '',
  API_ALLOWED_PATHS: '/titles',
  API_CACHE_SECONDS: '60',
});
const { app } = await import('../server/app.js');
const { isAllowedPath } = await import('../server/catalog.js');

const server = app.listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api`;

let fails = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'OK  ' : 'FALHA'} ${msg}`);
  if (!cond) fails++;
};
const get = async (path, user = 'ok') => {
  const res = await fetch(base + path, { headers: { Authorization: `Bearer ${tokenOf(user)}` } });
  return { status: res.status, headers: res.headers, body: await res.json().catch(() => null) };
};

// ---- Lista de caminhos permitidos ----
ok(isAllowedPath('/titles'), 'permite /titles');
ok(isAllowedPath('/titles/7'), 'permite /titles/7');
ok(isAllowedPath('/titles/search?q=x'), 'permite /titles/search?q=x');
ok(!isAllowedPath('/account'), 'bloqueia /account');
ok(!isAllowedPath('/titlesX'), 'bloqueia /titlesX');
ok(!isAllowedPath('/titles/../account'), 'bloqueia /titles/../account');
ok(!isAllowedPath('//example.com/titles'), 'bloqueia //example.com/titles');

let r = await get('/account');
ok(r.status === 404 && !hits['/account'], 'proxy recusa /account sem chamar a API');

// ---- Catálogo vindo da API, com chave e cache ----
r = await get('/catalog');
ok(r.status === 200 && r.body?.[0]?.title === 'Da API', 'catálogo vem da API quando configurada');
ok(lastAuth === 'Bearer chave-api-falsa', 'a chave vai no cabeçalho para a API');
await get('/catalog');
await get('/titles');
ok(hits['/titles'] === 1, `cache: 3 pedidos, 1 chamada à API (chamadas: ${hits['/titles']})`);

r = await get('/catalog');
ok(r.headers.get('cache-control') === 'no-store', 'resposta com Cache-Control: no-store');
ok(r.headers.get('x-content-type-options') === 'nosniff', 'cabeçalhos de segurança (helmet)');
ok(!r.headers.get('x-powered-by'), 'sem X-Powered-By');

// ---- Respostas perigosas da API ----
r = await get('/titles/redirect');
ok(r.status === 502, 'redirecionamento da API não é seguido (chave não vaza)');
r = await get('/titles/html');
ok(r.status === 502 && r.body?.code === 'resposta_invalida', 'resposta que não é JSON é recusada');
r = await get('/titles/grande');
ok(r.status === 502 && r.body?.code === 'resposta_grande', 'resposta acima de 5 MB é recusada');

// ---- Sem login, nada passa ----
const anon = await fetch(`${base}/titles`);
ok(anon.status === 401, 'proxy exige login');

// ---- Limite de requisições ----
const statuses = [];
for (let i = 0; i < 130; i++) statuses.push((await fetch(`${base}/health`)).status);
ok(statuses.includes(429), `limite de requisições ativo (${statuses.filter((s) => s === 429).length} bloqueadas de 130)`);

server.close();
upstream.close();
closeFake();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTodos os testes passaram.');
process.exit(fails ? 1 : 0);
