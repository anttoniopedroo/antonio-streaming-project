import AuthLayout from './AuthLayout';

// Mostrada só enquanto o .env da raiz não tem os dados públicos do Supabase.
export default function SetupPage() {
  return (
    <AuthLayout>
      <h1 className="auth-title">Login não configurado</h1>
      <p className="auth-subtitle">
        Preencha <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo{' '}
        <code>.env</code> da raiz do projeto e reinicie com <code>npm run dev:all</code>.
      </p>
    </AuthLayout>
  );
}
