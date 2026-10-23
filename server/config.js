import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- Carrega as chaves secretas de server/chave_api.env ----
// (a chave entra lá). Variáveis já definidas no ambiente — por exemplo,
// no painel da Vercel — têm prioridade sobre o arquivo.
const KEY_FILE = path.join(__dirname, 'chave_api.env');
// Na Vercel as chaves vêm das Environment Variables do painel (não há arquivo).
const isVercel = () => Boolean(process.env.VERCEL);

if (existsSync(KEY_FILE)) {
  process.loadEnvFile(KEY_FILE);
} else if (!isVercel()) {
  console.warn(
    '[server] server/chave_api.env não encontrado. Copie server/chave_api.env.example para server/chave_api.env e preencha as chaves.'
  );
}

const env = process.env;
const trimSlash = (url = '') => url.replace(/\/+$/, '');

export const config = {
  port: Number(env.PORT || 3001),
  api: {
    baseUrl: trimSlash(env.API_BASE_URL),
    key: env.API_KEY || '', // a chave entra aqui — via server/chave_api.env (não cole a chave neste arquivo)
    header: env.API_KEY_HEADER || 'Authorization',
    prefix: env.API_KEY_PREFIX || '',
    queryParam: env.API_KEY_QUERY_PARAM || '',
    // Únicos caminhos da API externa que o site pode chamar (separados por vírgula).
    // Impede que alguém use a sua chave em outros endpoints do provedor (conta, cobrança...).
    allowedPaths: (env.API_ALLOWED_PATHS || '/titles')
      .split(',')
      .map((p) => p.trim().replace(/\/+$/, ''))
      .filter(Boolean),
    // Respostas da API ficam guardadas por este tempo (economiza a cota da chave).
    cacheSeconds: Number(env.API_CACHE_SECONDS ?? 60),
    maxResponseBytes: 5 * 1024 * 1024,
  },
  supabase: {
    url: trimSlash(env.SUPABASE_URL),
    secretKey: env.SUPABASE_SECRET_KEY || '', // chave secreta do Supabase — via server/chave_api.env
  },
};

export const apiConfigured = Boolean(config.api.baseUrl && config.api.key);
export const authConfigured = Boolean(config.supabase.url && config.supabase.secretKey);
