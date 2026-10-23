const LINKS = [
  ['Central de ajuda', 'Termos de uso', 'Privacidade'],
  ['Conta', 'Dispositivos compatíveis', 'Preferências de cookies'],
  ['Sobre o projeto', 'Contato', 'Informações corporativas'],
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <span className="brand-mark">A</span>
        <div>
          <strong>ANTONIO STREAMING PROJECT</strong>
          <span className="brand-version">V1.1</span>
          <p>Projeto autoral de streaming. Catálogo fictício para demonstração.</p>
        </div>
      </div>

      <div className="footer-links">
        {LINKS.map((col, i) => (
          <ul key={i}>
            {col.map((label) => (
              <li key={label}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <p className="footer-copy">
        © {new Date().getFullYear()} ANTONIO STREAMING PROJECT V1.1. Todos os direitos reservados.
      </p>
    </footer>
  );
}
