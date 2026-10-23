import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { changePassword } from '../services/api';
import AuthLayout from './AuthLayout';
import { CheckIcon, EyeIcon, EyeOffIcon, LockIcon, ShieldIcon } from '../components/Icons';

// Mesmas regras validadas no servidor (server/auth.js).
const RULES = [
  { id: 'len', label: 'Pelo menos 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'letter', label: 'Pelo menos uma letra', test: (p) => /[A-Za-z]/.test(p) },
  { id: 'digit', label: 'Pelo menos um número', test: (p) => /\d/.test(p) },
];

export default function ChangePasswordPage({ me, onDone, onLogout }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allRulesOk = RULES.every((r) => r.test(password)) && password.length <= 72;
  const matches = password.length > 0 && password === confirm;
  const firstName = me?.nome?.split(' ')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesOk || !matches || loading) return;
    setError(null);
    setLoading(true);
    try {
      await changePassword(password);
      // Renova a sessão já com a senha nova.
      await supabase.auth.signInWithPassword({ email: me.email, password });
      await onDone();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-icon">
        <ShieldIcon size={26} />
      </div>
      <h1 className="auth-title">Crie sua senha</h1>
      <p className="auth-subtitle">
        {firstName ? `Olá, ${firstName}! ` : 'Olá! '}
        Por segurança, troque a senha que você recebeu por uma senha só sua antes de continuar.
      </p>

      {error && (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <input type="email" autoComplete="username" value={me?.email ?? ''} readOnly hidden />

        <label className="field">
          <span className="field-label">Nova senha</span>
          <span className="field-control">
            <LockIcon size={18} />
            <input
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="field-toggle"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </span>
        </label>

        <ul className="password-rules" aria-label="Requisitos da senha">
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li key={rule.id} className={ok ? 'is-ok' : ''}>
                <span className="rule-dot">{ok && <CheckIcon size={11} />}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>

        <label className="field">
          <span className="field-label">Confirme a nova senha</span>
          <span className="field-control">
            <LockIcon size={18} />
            <input
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </span>
          {confirm && !matches && <span className="field-hint">As senhas não são iguais</span>}
        </label>

        <button className="btn btn-auth" type="submit" disabled={!allRulesOk || !matches || loading}>
          {loading ? <span className="spinner" aria-label="Salvando" /> : 'Salvar e entrar'}
        </button>
      </form>

      <button className="auth-link" type="button" onClick={onLogout}>
        Sair e entrar com outra conta
      </button>
    </AuthLayout>
  );
}
