import { createClient } from '@supabase/supabase-js';

// Valores públicos do Supabase, definidos no arquivo .env da raiz.
// A chave SECRETA do Supabase nunca fica aqui: ela fica em server/chave_api.env.
const url = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && publicKey);
export const supabase = supabaseConfigured ? createClient(url, publicKey) : null;
