// Arte do título. Usa a imagem da API (poster/backdrop) quando existir;
// caso contrário, gera uma arte única em CSS a partir de `palette` e `motif`.
export default function Artwork({ item, variant = 'card' }) {
  const wantsWide = variant === 'card' || variant === 'backdrop';
  const src = wantsWide ? item.backdrop ?? item.poster : item.poster ?? item.backdrop;

  if (src) {
    return <img className={`art art-${variant}`} src={src} alt={item.title} loading="lazy" />;
  }

  const [c1, c2, c3] = item.palette ?? ['#7c3aed', '#ff3d5a', '#111118'];

  return (
    <div
      className={`art art-${variant} art-generated motif-${item.motif ?? 'ring'}`}
      style={{ '--c1': c1, '--c2': c2, '--c3': c3 }}
      role="img"
      aria-label={item.title}
    >
      <span className="art-shape" />
      <span className="art-shape art-shape-2" />
      <span className="art-grain" />
      {variant !== 'backdrop' && <span className="art-title">{item.title}</span>}
      <span className="art-badge" title="Original ASP">A</span>
    </div>
  );
}
