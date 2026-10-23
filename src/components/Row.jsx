import { memo, useCallback, useEffect, useRef, useState } from 'react';
import MovieCard from './MovieCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

// Carrossel horizontal. `ranked` exibe o estilo "Top 10" com números grandes.
function Row({ title, subtitle, items, ranked = false, ...cardProps }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [items, update]);

  const scroll = (dir) => {
    const el = trackRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className={`row ${ranked ? 'row-ranked' : ''}`}>
      <header className="row-header">
        <h2 className="row-title">
          {title}
          <span className="row-explore">
            Explorar tudo <ChevronRightIcon size={14} />
          </span>
        </h2>
        {subtitle && <p className="row-subtitle">{subtitle}</p>}
      </header>

      <div className="row-viewport">
        <button
          className={`row-arrow row-arrow-prev ${canPrev ? '' : 'is-hidden'}`}
          onClick={() => scroll(-1)}
          aria-label="Anterior"
          tabIndex={canPrev ? 0 : -1}
        >
          <ChevronLeftIcon size={34} />
        </button>

        <div className="row-track" ref={trackRef} onScroll={update}>
          {items.map((item, i) =>
            ranked ? (
              <div className="ranked-item" key={item.id}>
                <span className="rank-number" aria-hidden="true">
                  {i + 1}
                </span>
                <MovieCard item={item} variant="portrait" {...cardProps} />
              </div>
            ) : (
              <MovieCard key={item.id} item={item} {...cardProps} />
            )
          )}
        </div>

        <button
          className={`row-arrow row-arrow-next ${canNext ? '' : 'is-hidden'}`}
          onClick={() => scroll(1)}
          aria-label="Próximo"
          tabIndex={canNext ? 0 : -1}
        >
          <ChevronRightIcon size={34} />
        </button>
      </div>
    </section>
  );
}

export default memo(Row);
