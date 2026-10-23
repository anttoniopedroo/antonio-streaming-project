import { authConfigured } from './config.js';
import { admin } from './supabase.js';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

// Registra um evento em access_logs (login, logout, troca_senha, bloqueado, expirado).
export async function logAccess(req, { userId = null, email = null, evento }) {
  if (!admin) return;
  const { error } = await admin.from('access_logs').insert({
    user_id: userId,
    email,
    evento,
    ip: req.ip ?? null,
    user_agent: req.get('user-agent')?.slice(0, 300) ?? null,
  });
  if (error) console.error('[auth] Falha ao registrar acesso:', error.message);
}

// Middleware: confere a sessão do Supabase e as regras da tabela profiles.
// allowPasswordChange: deixa passar quem ainda precisa trocar a senha.
export function requireUser({ allowPasswordChange = false } = {}) {
  return async (req, res, next) => {
    if (!authConfigured) {
      return res.status(503).json({
        code: 'login_nao_configurado',
        error: 'Login não configurado. Preencha SUPABASE_URL e SUPABASE_SECRET_KEY em server/chave_api.env.',
      });
    }

    const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) {
      return res.status(401).json({ code: 'sem_sessao', error: 'Faça login para continuar.' });
    }

    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ code: 'sessao_invalida', error: 'Sua sessão expirou. Entre novamente.' });
    }
    const user = data.user;

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[auth] Falha ao ler o perfil:', profileError.message);
      return res.status(500).json({ code: 'erro_perfil', error: 'Não foi possível verificar seu acesso.' });
    }

    if (!profile?.ativo) {
      await logAccess(req, { userId: user.id, email: user.email, evento: 'bloqueado' });
      return res.status(403).json({
        code: 'bloqueado',
        error: 'Seu acesso está bloqueado. Fale com o administrador do projeto.',
      });
    }

    if (profile.expira_em && new Date(profile.expira_em) <= new Date()) {
      await logAccess(req, { userId: user.id, email: user.email, evento: 'expirado' });
      return res.status(403).json({
        code: 'expirado',
        error: `Seu acesso expirou em ${formatDate(profile.expira_em)}. Fale com o administrador do projeto.`,
      });
    }

    if (profile.trocar_senha && !allowPasswordChange) {
      return res.status(403).json({ code: 'trocar_senha', error: 'Crie uma nova senha para continuar.' });
    }

    req.user = user;
    req.profile = profile;
    next();
  };
}

// Regras mínimas para a nova senha. Retorna a mensagem do problema ou null.
export function validatePassword(password) {
  if (typeof password !== 'string') return 'Informe a nova senha.';
  if (password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (password.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'A senha precisa ter letras e números.';
  return null;
}
