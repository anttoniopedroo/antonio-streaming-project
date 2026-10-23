import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCatalog, searchTitles, USE_MOCKS } from './services/api';
import { useMyList } from './hooks/useMyList';
import Header from './components/Header';
import Hero from './components/Hero';
import Row from './components/Row';
import Grid from './components/Grid';
import MovieModal from './components/MovieModal';
import Footer from './components/Footer';
import { HeroSkeleton, RowSkeleton } from './components/Skeletons';

const VIEW_LABELS = { home: 'Início', filme: 'Filmes', serie: 'Séries' };

export default function App() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('home');
  const [genre, setGenre] = useState('Todos');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const myList = useMyList();

  const loadCatalog = useCallback(() => {
    setLoading(true);
    setError(null);
    getCatalog()
      .then(setCatalog)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadCatalog, [loadCatalog]);

  // Busca com debounce, sempre passando pelo módulo de API.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(() => {
      searchTitles(q)
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message) => setToast({ message, id: Date.now() });

  const handlePlay = (item) =>
    showToast(`▶  "${item.title}": o player será liberado quando a API for conectada.`);

  const handleToggleList = (item) => {
    const added = myList.toggle(item.id);
    showToast(added ? `"${item.title}" adicionado à Minha Lista` : `"${item.title}" removido da Minha Lista`);
  };

  const handleNavigate = (id) => {
    setView(id);
    setGenre('Todos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeModal = useCallback(() => setSelected(null), []);

  const scoped = useMemo(
    () => (view === 'filme' || view === 'serie' ? catalog.filter((t) => t.type === view) : catalog),
    [catalog, view]
  );

  const genres = useMemo(() => {
    const count = {};
    scoped.forEach((t) => t.genres.forEach((g) => (count[g] = (count[g] || 0) + 1)));
    return Object.keys(count).sort((a, b) => count[b] - count[a]);
  }, [scoped]);

  const featured = useMemo(() => {
    const list = scoped.filter((t) => t.featured);
    return list.length ? list : [...scoped].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [scoped]);

  const rows = useMemo(() => {
    const byScore = [...scoped].sort((a, b) => b.score - a.score);
    const label = view === 'serie' ? 'séries' : view === 'filme' ? 'filmes' : 'títulos';
    return [
      { key: 'continue', title: 'Continue assistindo', items: scoped.filter((t) => t.progress != null) },
      { key: 'top', title: `Top 10 ${label} hoje`, subtitle: 'Os mais vistos no ASP', items: byScore.slice(0, 10), ranked: true },
      { key: 'new', title: 'Lançamentos', items: scoped.filter((t) => t.isNew) },
      { key: 'acclaimed', title: 'Aclamados pela crítica', items: byScore.filter((t) => t.score >= 8.5) },
      ...genres.map((g) => ({ key: g, title: g, items: scoped.filter((t) => t.genres.includes(g)) })),
    ].filter((r) => r.items.length >= 2);
  }, [scoped, genres, view]);

  const myListItems = myList.ids.map((id) => catalog.find((t) => t.id === id)).filter(Boolean);

  const cardProps = {
    onOpen: setSelected,
    onPlay: handlePlay,
    isInList: myList.has,
    onToggleList: handleToggleList,
  };

  const renderPage = () => {
    if (loading) {
      return (
        <>
          <HeroSkeleton />
          <div className="content">
            <RowSkeleton />
            <RowSkeleton />
          </div>
        </>
      );
    }

    if (error) {
      return (
        <div className="page">
          <div className="empty-state">
            <h2>Não foi possível carregar o catálogo</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadCatalog}>
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    if (query.trim()) {
      return (
        <div className="page">
          <Grid
            title={`Resultados para "${query.trim()}"`}
            subtitle={results ? `${results.length} título(s) encontrado(s)` : 'Buscando...'}
            items={results ?? []}
            empty={
              results && (
                <>
                  <h2>Nada encontrado</h2>
                  <p>Tente buscar por outro título, gênero ou nome do elenco.</p>
                </>
              )
            }
            {...cardProps}
          />
        </div>
      );
    }

    if (view === 'mylist') {
      return (
        <div className="page">
          <Grid
            title="Minha Lista"
            subtitle={myListItems.length ? `${myListItems.length} título(s) salvos` : null}
            items={myListItems}
            empty={
              <>
                <h2>Sua lista está vazia</h2>
                <p>Use o botão + em qualquer título para salvá-lo aqui e assistir depois.</p>
                <button className="btn btn-primary" onClick={() => handleNavigate('home')}>
                  Explorar o catálogo
                </button>
              </>
            }
            {...cardProps}
          />
        </div>
      );
    }

    return (
      <>
        <Hero items={featured} {...cardProps} />
        <div className="content">
          <div className="chips" role="toolbar" aria-label="Filtrar por gênero">
            <span className="chips-label">{VIEW_LABELS[view]}</span>
            {['Todos', ...genres].map((g) => (
              <button
                key={g}
                className={`chip ${genre === g ? 'is-active' : ''}`}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {genre === 'Todos' ? (
            rows.map(({ key, ...row }) => <Row key={key} {...row} {...cardProps} />)
          ) : (
            <Grid
              title={genre}
              subtitle={`${scoped.filter((t) => t.genres.includes(genre)).length} título(s)`}
              items={scoped.filter((t) => t.genres.includes(genre))}
              {...cardProps}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <Header
        view={view}
        onNavigate={handleNavigate}
        query={query}
        onQueryChange={setQuery}
        myListCount={myList.ids.length}
      />

      <main>{renderPage()}</main>

      <Footer />

      {USE_MOCKS && !loading && <div className="mock-flag">Modo demonstração · dados mockados</div>}

      {selected && (
        <MovieModal
          key={selected.id}
          item={selected}
          catalog={catalog}
          onClose={closeModal}
          {...cardProps}
        />
      )}

      {toast && (
        <div className="toast" key={toast.id} role="status">
          {toast.message}
        </div>
      )}
    </>
  );
}
