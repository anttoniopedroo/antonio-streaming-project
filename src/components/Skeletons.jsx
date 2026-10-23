export function HeroSkeleton() {
  return (
    <section className="hero hero-skeleton" aria-busy="true" aria-label="Carregando destaques">
      <div className="hero-content">
        <span className="skeleton skeleton-line" style={{ width: 140 }} />
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-line" style={{ width: '60%' }} />
        <span className="skeleton skeleton-line" style={{ width: '80%' }} />
        <span className="skeleton skeleton-line" style={{ width: '50%' }} />
        <div className="hero-actions">
          <span className="skeleton skeleton-btn" />
          <span className="skeleton skeleton-btn" />
        </div>
      </div>
    </section>
  );
}

export function RowSkeleton() {
  return (
    <section className="row" aria-hidden="true">
      <header className="row-header">
        <span className="skeleton skeleton-line" style={{ width: 200, height: 20 }} />
      </header>
      <div className="row-track skeleton-track">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="skeleton skeleton-card" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </section>
  );
}
