import Artwork from './Artwork';
import Meta from './Meta';
import { CheckIcon, ChevronDownIcon, PlayIcon, PlusIcon } from './Icons';

export default function MovieCard({ item, onOpen, onPlay, isInList, onToggleList, variant = 'landscape' }) {
  const inList = isInList(item.id);
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn(item);
  };

  return (
    <article
      className={`card card-${variant}`}
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
      aria-label={item.title}
    >
      <div className="card-media">
        <Artwork item={item} variant={variant === 'portrait' ? 'poster' : 'card'} />
        {item.isNew && <span className="card-flag">Novo</span>}
        {item.progress != null && (
          <span className="card-progress">
            <span style={{ width: `${item.progress * 100}%` }} />
          </span>
        )}
      </div>

      <div className="card-overlay">
        <div className="card-actions">
          <button className="round-btn round-btn-light" onClick={stop(onPlay)} aria-label="Assistir">
            <PlayIcon size={16} />
          </button>
          <button
            className={`round-btn ${inList ? 'is-on' : ''}`}
            onClick={stop(onToggleList)}
            aria-label={inList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
          >
            {inList ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
          </button>
          <button className="round-btn push-right" onClick={stop(onOpen)} aria-label="Mais informações">
            <ChevronDownIcon size={16} />
          </button>
        </div>
        <h3 className="card-title">{item.title}</h3>
        <Meta item={item} compact />
        <ul className="card-genres">
          {item.genres.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
