// Cria um usuário já liberado no Supabase.
// Uso:
//   npm run admin:criar-usuario -- email@exemplo.com SenhaInicial1
//   npm run admin:criar-usuario -- email@exemplo.com SenhaInicial1 --nome "Maria Silva" --dias 30
//   npm run admin:criar-usuario -- email@exemplo.com SenhaInicial1 --sem-troca
//
// --nome      nome exibido no site
// --dias N    acesso expira em N dias (sem a opção: não expira)
// --sem-troca não obriga a trocar a senha no primeiro login
// --bloqueado cria a conta bloqueada (ativo = false)
import { authConfigured } from '../config.js';
import { admin } from '../supabase.js';
import { validatePassword } from '../auth.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const [email, password] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.match(/^--(nome|dias)$/));

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!authConfigured) fail('Login não configurado: preencha SUPABASE_URL e SUPABASE_SECRET_KEY em server/chave_api.env.');
if (!email || !password) fail('Uso: npm run admin:criar-usuario -- email@exemplo.com SenhaInicial1 [--nome "Nome"] [--dias 30]');
const problem = validatePassword(password);
if (problem) fail(problem);

const dias = option('--dias') ? Number(option('--dias')) : null;
if (dias !== null && !(dias > 0)) fail('--dias precisa ser um número maior que zero.');

const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) fail(`Erro ao criar o usuário: ${error.message}`);

const profile = {
  nome: option('--nome') ?? null,
  ativo: !flag('--bloqueado'),
  trocar_senha: !flag('--sem-troca'),
  expira_em: dias ? new Date(Date.now() + dias * 86_400_000).toISOString() : null,
};

const { data: rows, error: profileError } = await admin
  .from('profiles')
  .update(profile)
  .eq('id', data.user.id)
  .select('id');

if (profileError || !rows?.length) {
  fail(
    `Usuário criado, mas o perfil não foi atualizado (${profileError?.message ?? 'perfil não encontrado'}).\n` +
      'Confira se o supabase/setup.sql foi executado no SQL Editor.'
  );
}

console.log(`Usuário ${email} criado.`);
console.log(`  ativo: ${profile.ativo ? 'sim' : 'não (bloqueado)'}`);
console.log(`  troca de senha no 1º acesso: ${profile.trocar_senha ? 'sim' : 'não'}`);
console.log(`  expira em: ${profile.expira_em ? new Date(profile.expira_em).toLocaleDateString('pt-BR') : 'nunca'}`);
