import MovieCard from './MovieCard';

export default function Grid({ title, subtitle, items, empty, ...cardProps }) {
  return (
    <section className="grid-section">
      <header className="grid-header">
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </header>

      {items.length === 0 ? (
        <div className="empty-state">{empty}</div>
      ) : (
        <div className="grid">
          {items.map((item, i) => (
            <div className="grid-cell" key={item.id} style={{ '--i': i }}>
              <MovieCard item={item} {...cardProps} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
