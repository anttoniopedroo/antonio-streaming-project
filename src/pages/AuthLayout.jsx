import { APP_VERSION } from '../version';

// Moldura das telas de acesso (login, troca de senha, configuração).
export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-blob auth-blob-1" />
        <span className="auth-blob auth-blob-2" />
        <span className="auth-blob auth-blob-3" />
        <span className="auth-grid" />
      </div>

      <main className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">A</span>
          <span className="brand-text">
            <span className="brand-name">ANTONIO</span>
            <span className="brand-sub">
              STREAMING PROJECT <span className="brand-version">{APP_VERSION}</span>
            </span>
          </span>
        </div>
        {children}
      </main>

      <p className="auth-footer">Acesso restrito · versão {APP_VERSION.slice(1)} para convidados</p>
    </div>
  );
}
