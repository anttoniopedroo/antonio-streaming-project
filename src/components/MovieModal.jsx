import { useEffect, useRef } from 'react';
import Artwork from './Artwork';
import Meta from './Meta';
import { CheckIcon, CloseIcon, PlayIcon, PlusIcon, ThumbUpIcon } from './Icons';

export default function MovieModal({ item, catalog, onClose, onOpen, onPlay, isInList, onToggleList }) {
  const closeRef = useRef(null);
  const inList = isInList(item.id);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const similar = catalog
    .filter((t) => t.id !== item.id && t.genres.some((g) => item.genres.includes(g)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon />
        </button>

        <div className="modal-hero">
          <Artwork item={item} variant="backdrop" />
          <div className="modal-hero-fade" />
          <div className="modal-hero-content">
            <span className="hero-eyebrow">
              <span className="eyebrow-mark">A</span>
              {item.type === 'serie' ? 'SÉRIE' : 'FILME'} ORIGINAL
            </span>
            <h2 id="modal-title" className="modal-title">
              {item.title}
            </h2>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => onPlay(item)}>
                <PlayIcon size={22} /> {item.progress ? 'Continuar' : 'Assistir'}
              </button>
              <button
                className={`round-btn round-btn-lg ${inList ? 'is-on' : ''}`}
                onClick={() => onToggleList(item)}
                aria-label={inList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
              >
                {inList ? <CheckIcon /> : <PlusIcon />}
              </button>
              <button className="round-btn round-btn-lg" aria-label="Gostei">
                <ThumbUpIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-main">
            <Meta item={item} />
            {item.progress != null && (
              <div className="modal-progress">
                <span className="card-progress">
                  <span style={{ width: `${item.progress * 100}%` }} />
                </span>
                <small>{Math.round(item.progress * 100)}% assistido</small>
              </div>
            )}
            <p className="modal-synopsis">{item.synopsis}</p>
          </div>
          <aside className="modal-aside">
            <p>
              <span>Elenco:</span> {item.cast.join(', ')}
            </p>
            <p>
              <span>Gêneros:</span> {item.genres.join(', ')}
            </p>
            <p>
              <span>{item.type === 'serie' ? 'Criação:' : 'Direção:'}</span> {item.director}
            </p>
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="modal-similar">
            <h3>Títulos semelhantes</h3>
            <div className="similar-grid">
              {similar.map((s) => (
                <button key={s.id} className="similar-card" onClick={() => onOpen(s)}>
                  <div className="similar-media">
                    <Artwork item={s} variant="card" />
                    <span className="similar-duration">{s.duration}</span>
                  </div>
                  <div className="similar-info">
                    <div className="similar-top">
                      <Meta item={s} compact />
                    </div>
                    <h4>{s.title}</h4>
                    <p>{s.synopsis}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
