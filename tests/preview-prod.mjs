// Prévia "igual à produção": serve o build (dist/) com os MESMOS cabeçalhos de
// segurança do vercel.json (incluindo a CSP) e o back-end pela função api/index.js,
// ligado ao Supabase falso. Serve para pegar problemas de CSP antes de publicar.
// Uso: npm run preview:prod   (gera o build em dist-preview/ e abre em http://localhost:4173)
import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const FAKE = 'http://127.0.0.1:5056';
Object.assign(process.env, {
  SUPABASE_URL: FAKE,
  SUPABASE_SECRET_KEY: 'chave-secreta-falsa',
  API_BASE_URL: '',
  API_KEY: '',
  VITE_SUPABASE_URL: FAKE,
  VITE_SUPABASE_ANON_KEY: 'chave-publica-falsa',
});

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = fileURLToPath(new URL('../dist-preview', import.meta.url));
await build({ root, logLevel: 'warn', build: { outDir, emptyOutDir: true } });

await import('./fake-supabase.mjs');
const { default: apiHandler } = await import('../api/index.js');

const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf-8'));
const toRegex = (source) => new RegExp(`^${source.replace(/\(\.\*\)/g, '.*')}$`);

const site = express();
site.use((req, res, next) => {
  for (const rule of vercel.headers) {
    if (!toRegex(rule.source).test(req.path)) continue;
    for (const { key, value } of rule.headers) {
      // Só na prévia local: libera o Supabase falso (http) e não força https.
      const v =
        key === 'Content-Security-Policy'
          ? value.replace('connect-src', `connect-src ${FAKE}`).replace('; upgrade-insecure-requests', '')
          : value;
      if (key !== 'Strict-Transport-Security') res.setHeader(key, v);
    }
  }
  next();
});
site.use('/api', (req, res) => {
  req.url = req.originalUrl; // como na Vercel: o app recebe o caminho original
  apiHandler(req, res);
});
site.use(express.static(outDir));

site.listen(4173, '127.0.0.1', () => {
  console.log('[preview-prod] http://localhost:4173  (CSP do vercel.json ativa, Supabase falso)');
  console.log('[preview-prod] Contas: ok@teste.com | novo@teste.com | bloq@teste.com | exp@teste.com  (senha: Senha123)');
});
