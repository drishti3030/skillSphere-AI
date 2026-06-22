export function SkeletonCard({ lines = 3, height }) {
  return (
    <div className="sk-card" style={height ? { height } : {}}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="sk-line"
          style={{
            width: i === lines - 1 ? '55%' : '100%',
            marginBottom: i < lines - 1 ? '0.75rem' : 0,
          }}
        />
      ))}
      <style>{skStyles}</style>
    </div>
  );
}

export function SkeletonRow({ width = '100%', height = '0.85rem' }) {
  return <div className="sk-row" style={{ width, height }} />;
}

export function SkeletonAvatar({ size = 44 }) {
  return <div className="sk-avatar" style={{ width: size, height: size }} />;
}

const skStyles = `
.sk-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}
.sk-line, .sk-row {
  height: 0.85rem; border-radius: var(--radius);
  background: linear-gradient(90deg, var(--border) 25%, #f3f4f6 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: skPulse 1.5s ease infinite;
}
@keyframes skPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.sk-avatar {
  border-radius: 50%;
  background: linear-gradient(90deg, var(--border) 25%, #f3f4f6 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: skPulse 1.5s ease infinite;
}
.sk-card > .sk-line:last-child { margin-bottom: 0; }
`;
