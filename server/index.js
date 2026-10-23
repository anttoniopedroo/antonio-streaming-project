// =========================================================
//  Back-end (proxy) do ANTONIO STREAMING PROJECT
// =========================================================
//  O site chama  /api/...  -> este servidor adiciona a chave
//  e repassa para a sua API autorizada. Assim a chave nunca
//  aparece no navegador.
//
//  A chave NÃO fica neste arquivo: ela fica em server/chave_api.env
// =========================================================

import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- Carrega a chave do arquivo chave_api.env ----
// (a chave entra lá, em API_KEY=)
const KEY_FILE = path.join(__dirname, 'chave_api.env');

if (existsSync(KEY_FILE)) {
  process.loadEnvFile(KEY_FILE);
} else {
  console.warn('[server] server/chave_api.env não encontrado. Copie server/chave_api.env.example para server/chave_api.env e preencha a chave.');
}

const {
  API_BASE_URL = '',
  API_KEY = '', // a chave entra aqui — via server/chave_api.env (não cole a chave neste arquivo)
  API_KEY_HEADER = 'Authorization',
  API_KEY_PREFIX = '',
  API_KEY_QUERY_PARAM = '',
  PORT = '3001',
} = process.env;

const isConfigured = Boolean(API_BASE_URL && API_KEY);
const baseUrl = API_BASE_URL.replace(/\/+$/, '');

const app = express();
app.disable('x-powered-by');

// Status do back-end (nunca revela a chave).
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: isConfigured });
});

// Proxy: /api/qualquer/caminho?x=1  ->  API_BASE_URL/qualquer/caminho?x=1
app.use('/api', async (req, res) => {
  // O catálogo só lê dados; outros métodos ficam bloqueados.
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!isConfigured) {
    return res.status(503).json({
      error: 'Back-end sem chave configurada. Preencha API_BASE_URL e API_KEY em server/chave_api.env.',
    });
  }

  const target = new URL(baseUrl + req.url);
  const headers = { Accept: 'application/json' };

  // Aqui a chave é anexada à requisição (no cabeçalho ou na URL).
  if (API_KEY_QUERY_PARAM) {
    target.searchParams.set(API_KEY_QUERY_PARAM, API_KEY);
  } else {
    headers[API_KEY_HEADER] = API_KEY_PREFIX ? `${API_KEY_PREFIX} ${API_KEY}` : API_KEY;
  }

  try {
    const upstream = await fetch(target, { headers, signal: AbortSignal.timeout(10_000) });
    const body = await upstream.text();
    res
      .status(upstream.status)
      .type(upstream.headers.get('content-type') ?? 'application/json')
      .send(body);
  } catch (err) {
    // Loga só o caminho, nunca a URL completa (que pode conter a chave).
    console.error(`[server] Falha ao chamar a API em ${req.path}:`, err.message);
    res.status(502).json({ error: 'Não foi possível contactar a API externa.' });
  }
});

// Escuta só na sua máquina (127.0.0.1), não na rede.
app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`[server] Back-end rodando em http://localhost:${PORT}`);
  console.log(
    isConfigured
      ? `[server] Chave carregada. Repassando /api -> ${baseUrl}`
      : '[server] ATENÇÃO: chave ainda não configurada em server/chave_api.env'
  );
});
