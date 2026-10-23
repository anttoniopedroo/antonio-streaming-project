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

// Repassa a chamada para a API autorizada, anexando a chave.
export async function proxyToApi(req, res, path) {
  const { baseUrl, key, header, prefix, queryParam } = config.api;
  const target = new URL(baseUrl + path);
  const headers = { Accept: 'application/json' };

  // Aqui a chave é anexada à requisição (no cabeçalho ou na URL).
  if (queryParam) {
    target.searchParams.set(queryParam, key);
  } else {
    headers[header] = prefix ? `${prefix} ${key}` : key;
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
    console.error(`[server] Falha ao chamar a API em ${path.split('?')[0]}:`, err.message);
    res.status(502).json({ code: 'api_indisponivel', error: 'Não foi possível contactar a API externa.' });
  }
}
