import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../api/client';

export default function InterestPicker() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    studentAPI.getInterests()
      .then((r) => setInterests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await studentAPI.saveInterests(selected);
      setToast('+20 credits earned!');
      setTimeout(() => {
        navigate('/roadmap', { state: { firstTime: true } });
      }, 1200);
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '2rem auto' }} />
          <p className="text-secondary">Loading interests...</p>
        </div>
        <style>{authPageStyles}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">&#9670;</div>
        <h2 className="auth-title" style={{ textAlign: 'center' }}>What interests you?</h2>
        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
          Select at least 3 topics to personalize your learning roadmap
        </p>

        <div className="interest-grid">
          {interests.map((i) => (
            <button
              key={i.id}
              className={`interest-pill${selected.includes(i.id) ? ' selected' : ''}`}
              onClick={() => toggle(i.id)}
            >
              {i.label}
            </button>
          ))}
        </div>

        <p className="selected-count">
          {selected.length} of {interests.length} selected
        </p>

        <button
          className="btn btn-primary auth-submit"
          onClick={handleSave}
          disabled={selected.length < 3 || saving}
        >
          {saving ? (
            <span className="spinner" />
          ) : (
            `Generate My Roadmap`
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}

      <style>{`
        ${authPageStyles}

        .interest-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .interest-pill {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }
        .interest-pill:hover {
          border-color: var(--brand);
          color: var(--brand);
        }
        .interest-pill.selected {
          background: var(--brand);
          border-color: var(--brand);
          color: #fff;
        }

        .selected-count {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent);
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          animation: fadeIn 0.3s ease;
          z-index: 100;
        }
      `}</style>
    </div>
  );
}

const authPageStyles = `
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
}

.auth-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2.5rem;
}

.auth-logo {
  font-size: 2rem;
  color: var(--brand);
  text-align: center;
  margin-bottom: 0.5rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.auth-submit {
  width: 100%;
  justify-content: center;
  padding: 0.7rem;
  margin-top: 0.5rem;
}
`;
