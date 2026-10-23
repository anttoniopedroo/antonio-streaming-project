import { config } from './config.js';
import { mockTitles } from './data/mockTitles.js';

const normalize = (text = '') =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Busca nos dados de demonstração (usada enquanto a API não está configurada).
export function searchMocks(query) {
  const q = normalize(query);
  if (!q) return [];
  return mockTitles.filter((t) =>
    [t.title, t.director, ...t.genres, ...t.cast].some((field) => normalize(field).includes(q))
  );
}

export { mockTitles };

// O caminho só pode ser um dos permitidos (ou um subcaminho dele) e sem "..".
export function isAllowedPath(path) {
  const pathname = path.split('?')[0];
  if (pathname.includes('..') || pathname.includes('//') || pathname.includes('\\')) return false;
  return config.api.allowedPaths.some((allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`));
}

// ---- Cache em memória das respostas da API (só respostas 200) ----
const cache = new Map();
const CACHE_MAX_ENTRIES = 200;

function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key, value) {
  if (config.api.cacheSeconds <= 0) return;
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expires: Date.now() + config.api.cacheSeconds * 1000 });
}

class UpstreamError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Chama a API autorizada anexando a chave. Retorna { status, type, body }.
async function fetchFromApi(path) {
  const cached = readCache(path);
  if (cached) return cached;

  const { baseUrl, key, header, prefix, queryParam, maxResponseBytes } = config.api;
  const target = new URL(baseUrl + path);
  const headers = { Accept: 'application/json' };

  // Aqui a chave é anexada à requisição (no cabeçalho ou na URL).
  if (queryParam) {
    target.searchParams.set(queryParam, key);
  } else {
    headers[header] = prefix ? `${prefix} ${key}` : key;
  }

  const upstream = await fetch(target, {
    headers,
    redirect: 'error', // não segue redirecionamentos (a chave poderia ir para outro host)
    signal: AbortSignal.timeout(10_000),
  });

  const declared = Number(upstream.headers.get('content-length') ?? 0);
  if (declared > maxResponseBytes) throw new UpstreamError(502, 'resposta_grande', 'Resposta da API grande demais.');

  const body = await upstream.text();
  if (Buffer.byteLength(body) > maxResponseBytes) {
    throw new UpstreamError(502, 'resposta_grande', 'Resposta da API grande demais.');
  }

  const type = upstream.headers.get('content-type') ?? '';
  if (upstream.ok && !type.includes('json')) {
    throw new UpstreamError(502, 'resposta_invalida', 'A API respondeu em um formato inesperado.');
  }

  const result = { status: upstream.status, type: type || 'application/json', body };
  if (upstream.status === 200) writeCache(path, result);
  return result;
}

// Repassa a chamada para a API autorizada e devolve a resposta ao site.
export async function proxyToApi(req, res, path) {
  if (!isAllowedPath(path)) {
    return res.status(404).json({ code: 'caminho_nao_permitido', error: 'Recurso não encontrado.' });
  }
  try {
    const { status, type, body } = await fetchFromApi(path);
    res.status(status).type(type).send(body);
  } catch (err) {
    // Loga só o caminho, nunca a URL completa (que pode conter a chave).
    console.error(`[server] Falha ao chamar a API em ${path.split('?')[0]}:`, err.message);
    if (err instanceof UpstreamError) {
      return res.status(err.status).json({ code: err.code, error: err.message });
    }
    res.status(502).json({ code: 'api_indisponivel', error: 'Não foi possível contactar a API externa.' });
  }
}

// Só para os testes.
export const _clearCache = () => cache.clear();
