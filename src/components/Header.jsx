import { useEffect, useRef, useState } from 'react';
import { BellIcon, CloseIcon, SearchIcon } from './Icons';
import ProfileMenu from './ProfileMenu';
import { APP_FULL_NAME, APP_VERSION } from '../version';

const NAV = [
  { id: 'home', label: 'Início' },
  { id: 'filme', label: 'Filmes' },
  { id: 'serie', label: 'Séries' },
  { id: 'mylist', label: 'Minha Lista' },
];

export default function Header({ view, onNavigate, query, onQueryChange, myListCount, me, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => {
    onQueryChange('');
    setSearchOpen(false);
  };

  const navigate = (id) => {
    closeSearch();
    onNavigate(id);
  };

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
          aria-label={`${APP_FULL_NAME} — página inicial`}
        >
          <span className="brand-mark">A</span>
          <span className="brand-text">
            <span className="brand-name">ANTONIO</span>
            <span className="brand-sub">
              STREAMING PROJECT <span className="brand-version">{APP_VERSION}</span>
            </span>
          </span>
        </a>

        <nav className="nav" aria-label="Navegação principal">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${view === item.id && !query ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
              {item.id === 'mylist' && myListCount > 0 && (
                <span className="nav-count">{myListCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <div className={`search ${searchOpen || query ? 'is-open' : ''}`}>
            <button
              className="icon-btn"
              aria-label="Buscar"
              onClick={() => (searchOpen ? inputRef.current?.focus() : setSearchOpen(true))}
            >
              <SearchIcon />
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Títulos, gêneros, elenco..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onBlur={() => !query && setSearchOpen(false)}
              onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
              aria-label="Buscar títulos"
              tabIndex={searchOpen || query ? 0 : -1}
            />
            {query && (
              <button className="icon-btn search-clear" aria-label="Limpar busca" onClick={closeSearch}>
                <CloseIcon size={16} />
              </button>
            )}
          </div>

          <button className="icon-btn has-dot" aria-label="Notificações">
            <BellIcon />
          </button>

          <ProfileMenu me={me} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
