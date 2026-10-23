import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from './lib/supabase';
import { getMe, registerLogout } from './services/api';
import App from './App';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SetupPage from './pages/SetupPage';

// De quanto em quanto tempo o acesso é conferido de novo (bloqueio/expiração).
const RECHECK_MS = 5 * 60 * 1000;

// Porteiro do site: decide entre login, troca de senha e catálogo.
export default function Root() {
  const [status, setStatus] = useState('carregando'); // carregando | deslogado | trocar-senha | ok
  const [me, setMe] = useState(null);
  const [notice, setNotice] = useState(null);

  const signOutLocal = useCallback(async (message = null) => {
    await supabase.auth.signOut().catch(() => null);
    setMe(null);
    setNotice(message);
    setStatus('deslogado');
  }, []);

  const loadMe = useCallback(
    async (evento) => {
      setNotice(null);
      try {
        const data = await getMe(evento);
        setMe(data);
        setStatus(data.trocarSenha ? 'trocar-senha' : 'ok');
      } catch (err) {
        await signOutLocal(err.message);
      }
    },
    [signOutLocal]
  );

  // Sessão já existente (pessoa voltando ao site).
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadMe();
      else setStatus('deslogado');
    });
  }, [loadMe]);

  // Saiu em outra aba ou a sessão não pôde ser renovada.
  useEffect(() => {
    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setMe(null);
        setStatus('deslogado');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Qualquer chamada recusada pelo back-end (bloqueio, expiração, sessão inválida).
  useEffect(() => {
    const onDenied = (e) => {
      const err = e.detail;
      if (err.code === 'trocar_senha') setStatus('trocar-senha');
      else signOutLocal(err.message);
    };
    window.addEventListener('asp:acesso-negado', onDenied);
    return () => window.removeEventListener('asp:acesso-negado', onDenied);
  }, [signOutLocal]);

  // Reconfere o acesso periodicamente: bloqueios valem sem esperar o próximo login.
  useEffect(() => {
    if (status !== 'ok') return undefined;
    const timer = setInterval(() => getMe().catch(() => null), RECHECK_MS);
    return () => clearInterval(timer);
  }, [status]);

  const handleLogout = useCallback(async () => {
    await registerLogout();
    await signOutLocal(null);
  }, [signOutLocal]);

  if (!supabaseConfigured) return <SetupPage />;

  if (status === 'carregando') {
    return (
      <div className="splash" aria-busy="true">
        <span className="brand-mark">A</span>
      </div>
    );
  }

  if (status === 'deslogado') {
    return <LoginPage notice={notice} onLoggedIn={() => loadMe('login')} />;
  }

  if (status === 'trocar-senha') {
    return <ChangePasswordPage me={me} onDone={() => loadMe()} onLogout={handleLogout} />;
  }

  return <App me={me} onLogout={handleLogout} />;
}
