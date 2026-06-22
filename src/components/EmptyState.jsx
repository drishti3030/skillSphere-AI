export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      {icon && <p className="es-icon">{icon}</p>}
      {title && <h3 className="es-title">{title}</h3>}
      {description && <p className="es-desc">{description}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary es-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <style>{esStyles}</style>
    </div>
  );
}

const esStyles = `
.es-icon { font-size: 2.5rem; margin-bottom: 0.5rem; line-height: 1; }
.es-title {
  font-size: 1.05rem; font-weight: 600; color: var(--text-primary);
  margin-bottom: 0.35rem;
}
.es-desc {
  font-size: 0.88rem; color: var(--text-muted);
  max-width: 320px; margin: 0 auto 1rem; line-height: 1.5;
}
.es-btn { margin-top: 0.25rem; }
`;
