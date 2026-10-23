import { mockTitles } from '../data/mockTitles';

// Defina VITE_API_BASE_URL=/api no arquivo .env para usar o back-end (server/index.js).
// Enquanto estiver vazia, todas as funções retornam os mocks.
// A chave da API NÃO fica aqui — ela fica no back-end, em server/chave_api.env.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const USE_MOCKS = !BASE_URL;

const mockDelay = (data, ms = 400) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

// Wrapper de fetch: centraliza headers, JSON e tratamento de erro.
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status} em ${path}`);
  }
  return response.status === 204 ? null : response.json();
}

const normalize = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---- Endpoints (ajuste os caminhos conforme a sua API) ----

// Catálogo completo (filmes e séries).
export async function getCatalog() {
  if (USE_MOCKS) return mockDelay(mockTitles, 700);
  return request('/titles');
}

export async function getTitleById(id) {
  if (USE_MOCKS) return mockDelay(mockTitles.find((t) => t.id === Number(id)) ?? null);
  return request(`/titles/${id}`);
}

// Busca por título, gênero ou elenco.
export async function searchTitles(query) {
  if (USE_MOCKS) {
    const q = normalize(query);
    const results = mockTitles.filter((t) =>
      [t.title, t.director, ...t.genres, ...t.cast].some((field) => normalize(field).includes(q))
    );
    return mockDelay(results, 150);
  }
  return request(`/titles/search?q=${encodeURIComponent(query)}`);
}

export const api = { getCatalog, getTitleById, searchTitles };
