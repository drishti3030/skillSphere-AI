/* ── Deterministic color from name ────────────────────────────────── */
const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#059669',
];

function hashName(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name) {
  return AVATAR_COLORS[hashName(name || '') % AVATAR_COLORS.length];
}

/* ── Component ────────────────────────────────────────────────────── */
export default function StudentCard({ user, sharedInterests, onAction, actionLabel, actionLoading }) {
  const initials = getInitials(user?.full_name);
  const color = getColor(user?.full_name);
  const sharedSet = new Set((sharedInterests || []).map((s) => s?.toLowerCase()));

  return (
    <div className="card sc-card">
      <div className="sc-row">
        {/* Avatar */}
        <div className="sc-avatar" style={{ background: color }}>
          {initials}
        </div>

        {/* Info */}
        <div className="sc-info">
          <div className="sc-name-row">
            <span className="sc-name">{user?.full_name}</span>
            {user?.reputation > 0 && (
              <span className="badge badge-rep" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                RP {user.reputation}
              </span>
            )}
          </div>
          {user?.student_id && (
            <span className="sc-id">{user.student_id}</span>
          )}
        </div>
      </div>

      {/* Interest tags */}
      {user?.sharedInterests && user.sharedInterests.length > 0 && (
        <div className="sc-interests">
          {user.sharedInterests.map((interest, i) => (
            <span
              key={i}
              className={`sc-interest-tag${sharedSet.has(interest?.toLowerCase()) ? ' sc-interest-shared' : ''}`}
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Action button */}
      {onAction && (
        <button
          className="btn btn-primary sc-action"
          onClick={() => onAction(user)}
          disabled={actionLoading}
        >
          {actionLoading ? <span className="spinner" style={{ width: '1rem', height: '1rem' }} /> : (actionLabel || 'Send Buddy Request')}
        </button>
      )}

      <style>{`
        .sc-card {
          padding: 1.25rem;
        }

        .sc-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .sc-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: #fff;
          flex-shrink: 0;
        }

        .sc-info {
          flex: 1;
          min-width: 0;
        }

        .sc-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .sc-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .sc-id {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-family: 'SF Mono', 'Fira Code', monospace;
          margin-top: 0.1rem;
        }

        .sc-interests {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.75rem;
        }

        .sc-interest-tag {
          font-size: 0.72rem;
          padding: 0.2rem 0.55rem;
          border-radius: 9999px;
          background: var(--bg);
          color: var(--text-muted);
          font-weight: 500;
        }

        .sc-interest-shared {
          background: var(--accent-light);
          color: var(--accent);
          font-weight: 600;
        }

        .sc-action {
          width: 100%;
          justify-content: center;
          margin-top: 0.85rem;
          padding: 0.55rem;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
