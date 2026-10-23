// Auditoria de segurança do Supabase REAL configurado no projeto.
// Uso: npm run verificar
//
// Confere, sem alterar nada de forma permanente:
//  1. variáveis preenchidas (.env e server/chave_api.env)
//  2. cadastro público desligado
//  3. chave pública (navegador) NÃO lê nem escreve nas tabelas de controle
//  4. gatilho cria perfil bloqueado para usuário novo (cria e apaga um usuário temporário)
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { authConfigured, config } from '../config.js';
import { admin } from '../supabase.js';

const rootEnv = new URL('../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

let fails = 0;
const ok = (cond, msg, hint = '') => {
  console.log(`${cond ? 'OK   ' : 'FALHA'} ${msg}${!cond && hint ? `\n      -> ${hint}` : ''}`);
  if (!cond) fails++;
  return cond;
};

const publicUrl = process.env.VITE_SUPABASE_URL;
const publicKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n== 1. Configuração');
ok(authConfigured, 'server/chave_api.env tem SUPABASE_URL e SUPABASE_SECRET_KEY');
ok(Boolean(publicUrl && publicKey), '.env tem VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
if (!authConfigured || !publicUrl || !publicKey) {
  console.log('\nPreencha as variáveis acima e rode de novo.');
  process.exit(1);
}
ok(publicUrl.replace(/\/+$/, '') === config.supabase.url, 'as duas URLs do Supabase são iguais');
ok(publicKey !== config.supabase.secretKey, 'a chave do .env NÃO é a chave secreta', 'troque VITE_SUPABASE_ANON_KEY pela chave pública (publishable/anon)');
ok(!/^sb_secret_/.test(publicKey), 'a chave do .env não começa com sb_secret_', 'a chave secreta nunca pode ir para o .env da raiz');

const browser = createClient(publicUrl, publicKey, { auth: { persistSession: false } });

console.log('\n== 2. Cadastro público');
const probeEmail = `verificacao-${randomUUID().slice(0, 8)}@example.com`;
const signUp = await browser.auth.signUp({ email: probeEmail, password: `Teste-${randomUUID()}` });
const signUpBlocked = ok(
  Boolean(signUp.error),
  'cadastro público está desligado',
  'Authentication > Sign In / Providers > desligue "Allow new users to sign up"'
);
if (!signUpBlocked && signUp.data?.user) {
  await admin.auth.admin.deleteUser(signUp.data.user.id);
  console.log('      (usuário criado pelo teste foi apagado)');
}

console.log('\n== 3. Tabelas protegidas da chave pública');
for (const table of ['profiles', 'access_logs']) {
  const sel = await browser.from(table).select('*').limit(1);
  ok(Boolean(sel.error) || sel.data.length === 0, `navegador não lê ${table}`, 'rode de novo o supabase/setup.sql');
  const ins = await browser.from(table).insert(table === 'profiles' ? { id: randomUUID(), ativo: true } : { evento: 'teste' });
  ok(Boolean(ins.error), `navegador não escreve em ${table}`, 'rode de novo o supabase/setup.sql');
}
const rpc = await browser.rpc('handle_new_user');
ok(Boolean(rpc.error), 'navegador não chama a função interna handle_new_user');

console.log('\n== 4. Tabelas e gatilho');
const count = await admin.from('profiles').select('id', { count: 'exact', head: true });
ok(!count.error, 'tabela profiles existe', count.error?.message);
const logs = await admin.from('access_logs').select('id', { count: 'exact', head: true });
ok(!logs.error, 'tabela access_logs existe', logs.error?.message);

const temp = await admin.auth.admin.createUser({
  email: `gatilho-${randomUUID().slice(0, 8)}@example.com`,
  password: `Teste-${randomUUID()}`,
  email_confirm: true,
});
if (ok(!temp.error, 'criar usuário temporário', temp.error?.message)) {
  const { data: prof } = await admin.from('profiles').select('ativo, trocar_senha').eq('id', temp.data.user.id).maybeSingle();
  ok(Boolean(prof), 'gatilho criou o perfil automaticamente', 'rode de novo o supabase/setup.sql');
  ok(prof?.ativo === false, 'usuário novo nasce bloqueado');
  ok(prof?.trocar_senha === true, 'usuário novo precisa trocar a senha');
  await admin.auth.admin.deleteUser(temp.data.user.id);
  console.log('      (usuário temporário apagado)');
}

console.log(fails ? `\n${fails} problema(s) encontrado(s).` : '\nTudo certo: o Supabase está configurado com segurança.');
process.exit(fails ? 1 : 0);
