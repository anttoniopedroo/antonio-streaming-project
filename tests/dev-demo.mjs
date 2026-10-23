// Modo demonstração: sobe o site + back-end ligados a um Supabase FALSO local.
// Serve para ver e testar o site sem configurar o Supabase real.
// Uso: npm run dev:demo
//
// Contas de teste (senha de todas: Senha123):
//   ok@teste.com    liberada
//   novo@teste.com  primeiro acesso (pede troca de senha)
//   bloq@teste.com  bloqueada
//   exp@teste.com   acesso expirado
import { spawn } from 'node:child_process';
import './fake-supabase.mjs';

const env = {
  ...process.env,
  VITE_SUPABASE_URL: 'http://127.0.0.1:5056',
  VITE_SUPABASE_ANON_KEY: 'chave-publica-falsa',
  SUPABASE_URL: 'http://127.0.0.1:5056',
  SUPABASE_SECRET_KEY: 'chave-secreta-falsa',
  API_BASE_URL: '',
  API_KEY: '',
};

const run = (cmd) => spawn(cmd, { env, stdio: 'inherit', shell: true });
const children = [run('npx vite'), run('node server/index.js')];

console.log('\n[demo] Supabase FALSO em http://127.0.0.1:5056');
console.log('[demo] Contas: ok@teste.com | novo@teste.com | bloq@teste.com | exp@teste.com  (senha: Senha123)\n');

const stop = () => {
  children.forEach((c) => c.kill());
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
