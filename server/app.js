// =========================================================
//  Back-end do ANTONIO STREAMING PROJECT
// =========================================================
//  - Confere o login (Supabase) e as regras de acesso de cada pessoa.
//  - Entrega o catálogo só para quem está liberado.
//  - Guarda a chave da API e repassa as chamadas para ela.
//
//  As chaves NÃO ficam neste arquivo: elas ficam em server/chave_api.env
// =========================================================

import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { apiConfigured, authConfigured } from './config.js';
import { admin } from './supabase.js';
import { logAccess, requireUser, validatePassword } from './auth.js';
import { mockTitles, proxyToApi, searchMocks } from './catalog.js';

export const app = express();
app.disable('x-powered-by');
// IP real do visitante: atrás do Vite (local) ou do proxy da Vercel (produção).
app.set('trust proxy', process.env.VERCEL ? 1 : 'loopback');

// Cabeçalhos de segurança nas respostas da API.
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Limite de requisições por IP (proteção contra abuso e raspagem do catálogo).
const tooMany = { code: 'muitas_requisicoes', error: 'Muitas requisições. Aguarde um pouco e tente de novo.' };
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: tooMany,
});
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: tooMany,
});
app.use('/api', apiLimiter);
app.use('/api/change-password', sensitiveLimiter);

// Respostas com dados de usuário nunca ficam em cache de navegador/proxy.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Status do back-end (nunca revela chaves).
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, login: authConfigured, api: apiConfigured });
});

// Dados da pessoa logada. ?evento=login registra o acesso.
app.get('/api/me', requireUser({ allowPasswordChange: true }), async (req, res) => {
  const { user, profile } = req;

  if (req.query.evento === 'login') {
    await logAccess(req, { userId: user.id, email: user.email, evento: 'login' });
    await admin.from('profiles').update({ ultimo_acesso: new Date().toISOString() }).eq('id', user.id);
  }

  res.json({
    email: user.email,
    nome: profile.nome,
    expiraEm: profile.expira_em,
    trocarSenha: profile.trocar_senha,
    demo: !apiConfigured,
  });
});

// Troca de senha obrigatória do primeiro acesso.
app.post('/api/change-password', requireUser({ allowPasswordChange: true }), async (req, res) => {
  const password = req.body?.novaSenha;
  const problem = validatePassword(password);
  if (problem) return res.status(400).json({ code: 'senha_invalida', error: problem });

  const { error } = await admin.auth.admin.updateUserById(req.user.id, { password });
  if (error) {
    console.error('[auth] Falha ao trocar a senha:', error.message);
    const sameAsOld = /different from the old/i.test(error.message);
    return res.status(400).json({
      code: 'erro_senha',
      error: sameAsOld ? 'A nova senha precisa ser diferente da senha atual.' : 'Não foi possível trocar a senha. Tente outra senha.',
    });
  }

  await admin.from('profiles').update({ trocar_senha: false }).eq('id', req.user.id);
  await logAccess(req, { userId: req.user.id, email: req.user.email, evento: 'troca_senha' });
  res.json({ ok: true });
});

app.post('/api/logout', requireUser({ allowPasswordChange: true }), async (req, res) => {
  await logAccess(req, { userId: req.user.id, email: req.user.email, evento: 'logout' });
  res.json({ ok: true });
});

// Catálogo: demonstração enquanto a API não está configurada.
app.get('/api/catalog', requireUser(), async (req, res) => {
  if (!apiConfigured) return res.json(mockTitles);
  return proxyToApi(req, res, '/titles');
});

app.get('/api/search', requireUser(), async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 100);
  if (!apiConfigured) return res.json(searchMocks(q));
  return proxyToApi(req, res, `/titles/search?q=${encodeURIComponent(q)}`);
});

// Demais caminhos: repassa para a API autorizada (só leitura, só logado,
// só caminhos permitidos em API_ALLOWED_PATHS).
app.use('/api', requireUser(), async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 'metodo_nao_permitido', error: 'Método não permitido.' });
  }
  if (!apiConfigured) {
    return res.status(503).json({
      code: 'api_nao_configurada',
      error: 'API não configurada. Preencha API_BASE_URL e API_KEY em server/chave_api.env.',
    });
  }
  return proxyToApi(req, res, req.url);
});

// Erros inesperados: resposta genérica, detalhe só no terminal.
app.use((err, _req, res, _next) => {
  console.error('[server] Erro inesperado:', err);
  res.status(500).json({ code: 'erro_interno', error: 'Erro interno no servidor.' });
});
