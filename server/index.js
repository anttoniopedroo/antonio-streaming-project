// Inicia o back-end local. A lógica fica em server/app.js;
// as chaves ficam em server/chave_api.env.
import { app } from './app.js';
import { apiConfigured, authConfigured, config } from './config.js';

// Escuta só na sua máquina (127.0.0.1), não na rede.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`[server] Back-end rodando em http://localhost:${config.port}`);
  console.log(
    authConfigured
      ? '[server] Login (Supabase) configurado.'
      : '[server] ATENÇÃO: login ainda não configurado (SUPABASE_URL / SUPABASE_SECRET_KEY em server/chave_api.env)'
  );
  console.log(
    apiConfigured
      ? `[server] Chave da API carregada. Repassando -> ${config.api.baseUrl}`
      : '[server] API não configurada: usando o catálogo de demonstração.'
  );
});
