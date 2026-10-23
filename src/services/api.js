import { supabase } from '../lib/supabase';

// Todas as chamadas vão para o back-end do projeto (server/app.js), que confere
// o login, aplica as regras de acesso e só então entrega os dados.
// Nenhuma chave secreta fica aqui: elas ficam em server/chave_api.env.
const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new ApiError(response.status, body?.code, body?.error ?? `Erro ${response.status} em ${path}`);
    // Sessão inválida, conta bloqueada/expirada ou troca de senha pendente:
    // avisa o Root, que decide para qual tela mandar a pessoa.
    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(new CustomEvent('asp:acesso-negado', { detail: error }));
    }
    throw error;
  }
  return body;
}

// ---- Conta ----
export const getMe = (evento) => request(evento ? `/me?evento=${evento}` : '/me');

export const changePassword = (novaSenha) =>
  request('/change-password', { method: 'POST', body: JSON.stringify({ novaSenha }) });

export const registerLogout = () => request('/logout', { method: 'POST' }).catch(() => null);

// ---- Catálogo (ajuste os caminhos da sua API em server/app.js) ----
export const getCatalog = () => request('/catalog');

export const getTitleById = (id) => request(`/titles/${encodeURIComponent(id)}`);

export const searchTitles = (query) => request(`/search?q=${encodeURIComponent(query)}`);
