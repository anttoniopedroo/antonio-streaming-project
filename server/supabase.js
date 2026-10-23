import { createClient } from '@supabase/supabase-js';
import { authConfigured, config } from './config.js';

// Cliente administrativo (chave secreta). Só existe no servidor.
export const admin = authConfigured
  ? createClient(config.supabase.url, config.supabase.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
