import { useEffect, useState } from 'react';
import Artwork from './Artwork';
import Meta from './Meta';
import { CheckIcon, InfoIcon, PlayIcon, PlusIcon, VolumeIcon } from './Icons';

const ROTATE_MS = 9000;

// Banner de destaque com rotação automática entre os títulos em destaque.
export default function Hero({ items, onPlay, onOpen, isInList, onToggleList }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, items.length]);

  useEffect(() => setIndex(0), [items]);

  const item = items[index];
  if (!item) return null;
  const inList = isInList(item.id);

  return (
    <section className="hero" aria-label="Destaques">
      {items.map((it, i) => (
        <div key={it.id} className={`hero-bg ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index}>
          <Artwork item={it} variant="backdrop" />
        </div>
      ))}
      <div className="hero-vignette" />

      <div className="hero-content" key={item.id}>
        <span className="hero-eyebrow">
          <span className="eyebrow-mark">A</span>
          {item.type === 'serie' ? 'SÉRIE' : 'FILME'} ORIGINAL
        </span>
        <h1 className="hero-title">{item.title}</h1>
        {item.isNew && <span className="hero-new">Novidade • Disponível agora</span>}
        <Meta item={item} />
        <p className="hero-synopsis">{item.synopsis}</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => onPlay(item)}>
            <PlayIcon size={22} /> Assistir
          </button>
          <button className="btn btn-secondary" onClick={() => onOpen(item)}>
            <InfoIcon size={22} /> Mais informações
          </button>
          <button
            className={`round-btn round-btn-lg ${inList ? 'is-on' : ''}`}
            onClick={() => onToggleList(item)}
            aria-label={inList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
            data-tooltip={inList ? 'Na sua lista' : 'Minha Lista'}
          >
            {inList ? <CheckIcon /> : <PlusIcon />}
          </button>
        </div>
      </div>

      <div className="hero-side">
        <button className="round-btn" aria-label="Som">
          <VolumeIcon size={18} />
        </button>
        <span className={`hero-age age-${item.ageRating}`}>{item.ageRating}</span>
      </div>

      {items.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Escolher destaque">
          {items.map((it, i) => (
            <button
              key={it.id}
              role="tab"
              aria-selected={i === index}
              aria-label={it.title}
              className={`hero-dot ${i === index ? 'is-active' : ''}`}
              style={{ '--duration': `${ROTATE_MS}ms` }}
              onClick={() => setIndex(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
