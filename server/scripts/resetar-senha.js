// Redefine a senha de um usuário e obriga a troca no próximo login.
// Uso: npm run admin:resetar-senha -- email@exemplo.com SenhaTemporaria1
import { authConfigured } from '../config.js';
import { admin } from '../supabase.js';
import { validatePassword } from '../auth.js';

const [email, password] = process.argv.slice(2);

if (!authConfigured) {
  console.error('Login não configurado: preencha SUPABASE_URL e SUPABASE_SECRET_KEY em server/chave_api.env.');
  process.exit(1);
}
if (!email || !password) {
  console.error('Uso: npm run admin:resetar-senha -- email@exemplo.com SenhaTemporaria1');
  process.exit(1);
}
const problem = validatePassword(password);
if (problem) {
  console.error(problem);
  process.exit(1);
}

// Procura o usuário pelo e-mail (página por página).
let user = null;
for (let page = 1; !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error('Erro ao listar usuários:', error.message);
    process.exit(1);
  }
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 1000) break;
}

if (!user) {
  console.error(`Nenhum usuário com o e-mail ${email}.`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, { password });
if (error) {
  console.error('Erro ao redefinir a senha:', error.message);
  process.exit(1);
}
await admin.from('profiles').update({ trocar_senha: true }).eq('id', user.id);

console.log(`Senha de ${email} redefinida. A pessoa vai precisar criar uma nova senha no próximo login.`);
