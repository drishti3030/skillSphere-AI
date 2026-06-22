import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { roadmapAPI, studentAPI } from '../api/client';

const LOADING_MSGS = [
  'Analyzing your interests...',
  'Building your weekly plan...',
  'Adding resources...',
  'Almost ready...',
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function Roadmap() {
  const navigate = useNavigate();
  const location = useLocation();

  const [roadmaps, setRoadmaps] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  const [genError, setGenError] = useState('');
  const [toast, setToast] = useState('');
  const newRoadmapRef = useRef(null);

  /* ── Fetch roadmaps & interests ─────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const [rmRes, intRes] = await Promise.all([
        roadmapAPI.getMy(),
        studentAPI.getMyInterests(),
      ]);
      setRoadmaps(rmRes.data);
      setInterests(intRes.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Auto-generate if navigated from InterestPicker ─────────────── */
  useEffect(() => {
    if (location.state?.firstTime && roadmaps.length === 0 && !loading) {
      handleGenerate();
    }
  }, [location.state, roadmaps.length, loading]);

  /* ── Rotate loading messages ────────────────────────────────────── */
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => {
      setGenMsgIdx((p) => (p + 1) % LOADING_MSGS.length);
    }, 2500);
    return () => clearInterval(id);
  }, [generating]);

  /* ── Generate ───────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    setGenMsgIdx(0);
    try {
      const res = await roadmapAPI.generate();
      const newRm = res.data.roadmap
        ? { id: res.data.roadmapId, ...res.data.roadmap, content: JSON.stringify(res.data.roadmap) }
        : res.data;
      setRoadmaps((prev) => [newRm, ...prev]);
      setToast(`+${res.data.creditsEarned || 50} credits earned!`);
      setTimeout(() => {
        setToast('');
        if (newRoadmapRef.current) {
          newRoadmapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    } catch (err) {
      setGenError(err.response?.data?.error || 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  };

  /* ── Full-page loading ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  const parsedRoadmaps = roadmaps.map((r) => ({
    ...r,
    parsed: typeof r.content === 'string' ? JSON.parse(r.content) : r.content,
  }));

  return (
    <div className="rm-page fade-in">
      <div className="rm-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Learning Roadmap</h1>
      </div>

      {/* ── Generate section ──────────────────────────────────────── */}
      <div className="card rm-gen-card">
        <h2 className="rm-gen-title">Generate Your Roadmap</h2>
        <p className="rm-gen-desc">
          Our AI will create a personalized 12-week plan based on your interests.
        </p>

        {interests.length > 0 && (
          <div className="rm-interests-row">
            {interests.map((i) => (
              <span key={i.id} className="badge badge-rep">{i.label}</span>
            ))}
          </div>
        )}

        {genError && (
          <div className="rm-error">
            {genError}
            <button className="btn btn-ghost" style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--brand)' }} onClick={handleGenerate}>
              Retry
            </button>
          </div>
        )}

        <button
          className="btn btn-primary rm-gen-btn"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <span className="rm-gen-msg">{LOADING_MSGS[genMsgIdx]}</span>
          ) : (
            'Generate Now'
          )}
        </button>
      </div>

      {/* ── Roadmap list ──────────────────────────────────────────── */}
      {parsedRoadmaps.length === 0 && !generating ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginTop: '1rem' }}>
          <p className="text-muted">No roadmaps yet. Generate one above!</p>
        </div>
      ) : (
        <div className="rm-list">
          {parsedRoadmaps.map((rm, idx) => (
            <div
              key={rm.id}
              className="card rm-card"
              ref={idx === 0 ? newRoadmapRef : null}
            >
              <div className="rm-card-top">
                <div>
                  <h3 className="rm-card-title">
                    <Link to={`/roadmap/${rm.id}`}>{rm.parsed?.title || rm.title}</Link>
                  </h3>
                  <p className="rm-card-date">Created {formatDate(rm.generated_at)}</p>
                </div>
                <Link to={`/roadmap/${rm.id}`} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  View &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && <div className="rm-toast">{toast}</div>}

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
.rm-page {
  max-width: 720px;
}

.rm-header {
  margin-bottom: 1.25rem;
}

/* ── Generate card ─────────────────────────── */
.rm-gen-card {
  margin-bottom: 1.25rem;
}

.rm-gen-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.rm-gen-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.rm-interests-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.rm-gen-btn {
  width: 100%;
  justify-content: center;
  padding: 0.7rem;
}

.rm-gen-msg {
  font-size: 0.9rem;
}

.rm-error {
  background: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: var(--radius);
  padding: 0.6rem 1rem;
  margin-bottom: 0.75rem;
  color: var(--danger);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Roadmap list ──────────────────────────── */
.rm-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rm-card {
  padding: 1.25rem;
}

.rm-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.rm-card-title {
  font-size: 1rem;
  font-weight: 600;
}

.rm-card-title a {
  color: var(--text-primary);
}
.rm-card-title a:hover {
  color: var(--brand);
}

.rm-card-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

/* ── Toast ─────────────────────────────────── */
.rm-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.3s ease;
  z-index: 100;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .rm-page {
    max-width: 100%;
  }
}
`;
