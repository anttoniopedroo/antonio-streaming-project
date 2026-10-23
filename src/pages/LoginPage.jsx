import { useState } from 'react';
import { supabase } from '../lib/supabase';
import AuthLayout from './AuthLayout';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/Icons';

function translateError(error) {
  const message = error?.message ?? '';
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Conta ainda não confirmada. Fale com o administrador.';
  if (error?.status === 429 || /rate limit|too many/i.test(message)) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (/failed to fetch|network/i.test(message)) return 'Sem conexão com o servidor de login.';
  return 'Não foi possível entrar. Tente novamente.';
}

export default function LoginPage({ notice, onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(translateError(signInError));
      setLoading(false);
      return;
    }

    await onLoggedIn();
    setLoading(false);
  };

  const checkCaps = (e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  const message = error ?? notice;

  return (
    <AuthLayout>
      <h1 className="auth-title">Entrar</h1>
      <p className="auth-subtitle">Use o e-mail e a senha que você recebeu do administrador.</p>

      {message && (
        <div className="auth-alert" role="alert">
          {message}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">E-mail</span>
          <span className="field-control">
            <MailIcon size={18} />
            <input
              type="email"
              autoComplete="username"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </span>
        </label>

        <label className="field">
          <span className="field-label">Senha</span>
          <span className="field-control">
            <LockIcon size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={checkCaps}
              onKeyDown={checkCaps}
              required
            />
            <button
              type="button"
              className="field-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </span>
          {capsLock && <span className="field-hint">Caps Lock está ativado</span>}
        </label>

        <button className="btn btn-auth" type="submit" disabled={loading || !email || !password}>
          {loading ? <span className="spinner" aria-label="Entrando" /> : 'Entrar'}
        </button>
      </form>

      <p className="auth-help">
        Não tem acesso ou esqueceu a senha? Fale com o administrador do projeto.
      </p>
    </AuthLayout>
  );
}
