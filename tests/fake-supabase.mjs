// Supabase falso (Auth + tabelas) para testar o back-end sem um projeto real.
// Usado por tests/auth.test.mjs. Senha de todos os usuários falsos: Senha123
import http from 'node:http';

const users = {
  ok: { id: '11111111-1111-1111-1111-111111111111', email: 'ok@teste.com', profile: { ativo: true, expira_em: null, trocar_senha: false, nome: 'Ana Teste' } },
  blocked: { id: '22222222-2222-2222-2222-222222222222', email: 'bloq@teste.com', profile: { ativo: false, expira_em: null, trocar_senha: false } },
  expired: { id: '33333333-3333-3333-3333-333333333333', email: 'exp@teste.com', profile: { ativo: true, expira_em: '2026-01-10T12:00:00Z', trocar_senha: false } },
  trocar: { id: '44444444-4444-4444-4444-444444444444', email: 'novo@teste.com', profile: { ativo: true, expira_em: null, trocar_senha: true } },
};
const byId = Object.fromEntries(Object.values(users).map((u) => [u.id, u]));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const tokenOf = (key) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: users[key].id, email: users[key].email, key, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const keyOfToken = (t) => { try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url')).key; } catch { return t; } };
const log = [];

http
  .createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
      const send = (status, obj, type = 'application/json') => {
        res.writeHead(status, { 'content-type': type, ...cors });
        res.end(obj === undefined ? '' : JSON.stringify(obj));
      };

      if (url.pathname === '/auth/v1/user') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const u = users[keyOfToken(token)];
        return u ? send(200, { id: u.id, email: u.email, aud: 'authenticated', role: 'authenticated' }) : send(401, { code: 401, msg: 'invalid JWT' });
      }
      if (url.pathname === '/auth/v1/token') {
        const { email, password } = JSON.parse(body || '{}');
        const key = Object.keys(users).find((k) => users[k].email === email);
        if (!key || password !== 'Senha123') return send(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        const u = users[key];
        return send(200, { access_token: tokenOf(key), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r-' + key, user: { id: u.id, email: u.email, aud: 'authenticated', role: 'authenticated' } });
      }
      if (url.pathname === '/auth/v1/logout') return send(204);
      if (url.pathname.startsWith('/auth/v1/admin/users/') && req.method === 'PUT') {
        log.push({ tipo: 'senha', id: url.pathname.split('/').pop(), body: JSON.parse(body) });
        const u = byId[url.pathname.split('/').pop()];
        return send(200, { id: u.id, email: u.email });
      }
      if (url.pathname === '/rest/v1/profiles' && req.method === 'GET') {
        const id = url.searchParams.get('id')?.replace('eq.', '');
        const u = byId[id];
        const row = u ? { id: u.id, email: u.email, ...u.profile } : null;
        const wantsObject = (req.headers.accept ?? '').includes('vnd.pgrst.object');
        return wantsObject ? (row ? send(200, row) : send(406, { code: 'PGRST116' })) : send(200, row ? [row] : []);
      }
      if (url.pathname === '/rest/v1/profiles' && req.method === 'PATCH') {
        log.push({ tipo: 'update_profile', id: url.searchParams.get('id'), body: JSON.parse(body) });
        return send(204);
      }
      if (url.pathname === '/rest/v1/access_logs' && req.method === 'POST') {
        log.push({ tipo: 'access_log', body: JSON.parse(body) });
        return send(201);
      }
      if (url.pathname === '/__log') return send(200, log);
      send(404, { error: 'nao simulado: ' + req.method + ' ' + url.pathname });
    });
  })
  .listen(5056, '127.0.0.1');
