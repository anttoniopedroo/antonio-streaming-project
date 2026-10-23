import { StarIcon } from './Icons';

// Linha de metadados: relevância, classificação, ano, duração, nota.
export default function Meta({ item, compact = false }) {
  return (
    <div className={`meta ${compact ? 'meta-compact' : ''}`}>
      <span className="meta-match">{item.match}% relevante</span>
      <span className={`age age-${item.ageRating}`} title="Classificação indicativa">
        {item.ageRating}
      </span>
      <span>{item.year}</span>
      <span>{item.duration}</span>
      {!compact && <span className="meta-tag">4K</span>}
      {!compact && <span className="meta-tag">5.1</span>}
      <span className="meta-score">
        <StarIcon size={14} />
        {item.score.toFixed(1)}
      </span>
    </div>
  );
}
