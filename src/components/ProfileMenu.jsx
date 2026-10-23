import { useEffect, useRef, useState } from 'react';
import { LogoutIcon } from './Icons';

const initialsOf = (me) => {
  const source = me?.nome?.trim() || me?.email?.split('@')[0] || '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
};

export default function ProfileMenu({ me, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const expires = me?.expiraEm
    ? new Date(me.expiraEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : null;

  return (
    <div className="profile" ref={ref}>
      <button
        className="profile-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu da conta"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="avatar">{initialsOf(me)}</span>
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-info">
            <span className="avatar avatar-lg">{initialsOf(me)}</span>
            <div>
              {me?.nome && <strong>{me.nome}</strong>}
              <span>{me?.email}</span>
            </div>
          </div>
          <p className="profile-access">{expires ? `Acesso liberado até ${expires}` : 'Acesso sem data de expiração'}</p>
          <button className="profile-logout" role="menuitem" onClick={onLogout}>
            <LogoutIcon size={18} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
