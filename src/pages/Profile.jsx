import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { studentAPI, roadmapAPI, creditsAPI } from '../api/client';
import CreditBadge from '../components/CreditBadge';

/* ── Avatar helpers ────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#059669'];
function hashName(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function getInitials(name) {
  return (name || '?').split(' ').map((n) => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}
function getColor(name) {
  return AVATAR_COLORS[hashName(name || '') % AVATAR_COLORS.length];
}

/* ── Reason label mapping ──────────────────────────────────────────── */
const REASON_LABELS = {
  registration_bonus: 'Account created',
  interests_selected: 'Set learning interests',
  roadmap_generated: 'Generated learning roadmap',
  buddy_request_sent: 'Sent study buddy request',
  buddy_matched: 'Study buddy matched',
  skill_exchange_matched: 'Skill exchange matched',
  profile_complete: 'Profile activity',
};

function formatReason(reason) {
  return REASON_LABELS[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Interest Picker Overlay ───────────────────────────────────────── */
function InterestPickerOverlay({ onClose, onSave }) {
  const [allInterests, setAllInterests] = useState([]);
  const [myInterests, setMyInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [allRes, myRes] = await Promise.all([
          studentAPI.getInterests(),
          studentAPI.getMyInterests(),
        ]);
        setAllInterests(allRes.data);
        const myIds = myRes.data.map((i) => i.id);
        setMyInterests(myRes.data);
        setSelected(myIds);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
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
      onSave(selected);
      onClose();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-overlay" onClick={onClose}>
      <div className="p-overlay-card slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-overlay-header">
          <h3>Edit Interests</h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.25rem 0.5rem', fontSize: '1.2rem' }}>
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="p-interest-grid">
              {allInterests.map((i) => (
                <button
                  key={i.id}
                  className={`p-interest-pill${selected.includes(i.id) ? ' selected' : ''}`}
                  onClick={() => toggle(i.id)}
                >
                  {i.label}
                </button>
              ))}
            </div>
            <p className="p-selected-count">
              {selected.length} of {allInterests.length} selected
            </p>
            <button
              className="btn btn-primary p-overlay-save"
              onClick={handleSave}
              disabled={selected.length < 1 || saving}
            >
              {saving ? <span className="spinner" style={{ width: '1rem', height: '1rem' }} /> : 'Save Interests'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =================================================================== */
/*  PROFILE PAGE                                                       */
/* =================================================================== */
export default function Profile() {
  const { user } = useAuthStore();

  /* ── Interests ──────────────────────────────────────────────────── */
  const [interests, setInterests] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  /* ── Recommendation profile ─────────────────────────────────────── */
  const [profile, setProfile] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Credit history ─────────────────────────────────────────────── */
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  /* ── Load interests & history on mount ──────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const intRes = await studentAPI.getMyInterests();
        setInterests(intRes.data);
      } catch { /* ignore */ }

      try {
        const histRes = await creditsAPI.getHistory();
        setHistory(histRes.data.slice(0, 20));
      } catch { /* ignore */ } finally {
        setLoadingHistory(false);
      }
    })();
  }, []);

  /* ── Generate recommendation profile ────────────────────────────── */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await roadmapAPI.recommendationProfile();
      setProfile(res.data.profile);
    } catch { /* ignore */ } finally {
      setGenerating(false);
    }
  };

  /* ── Copy to clipboard ──────────────────────────────────────────── */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profile);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  /* ── Interest picker onSave callback ────────────────────────────── */
  const handleInterestsSaved = async (newIds) => {
    try {
      const intRes = await studentAPI.getMyInterests();
      setInterests(intRes.data);
    } catch { /* ignore */ }
  };

  if (!user) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  const initials = getInitials(user.full_name);
  const avatarColor = getColor(user.full_name);

  return (
    <div className="p-page fade-in">
      {/* ================================================================
          PROFILE HEADER
          ================================================================ */}
      <div className="card p-header">
        <div className="p-header-main">
          <div className="p-avatar" style={{ background: avatarColor }}>
            {initials}
          </div>
          <div className="p-header-info">
            <h1 className="p-name">{user.full_name}</h1>
            <div className="p-id-row">
              {user.student_id && (
                <span className="badge badge-rep" style={{ fontSize: '0.78rem' }}>
                  {user.student_id}
                </span>
              )}
              {user.email && (
                <span className="p-email">{user.email}</span>
              )}
            </div>
            <div className="p-stats-row">
              <CreditBadge amount={user.credits ?? 0} label="credits" />
              <span className="badge badge-rep" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}>
                RP {user.reputation ?? 0}
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-outline p-edit-btn" onClick={() => setShowPicker(true)}>
          Edit Interests
        </button>
      </div>

      {/* ================================================================
          MY INTERESTS
          ================================================================ */}
      <div className="card p-section">
        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
          <h2 className="p-section-title">My Interests</h2>
          <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowPicker(true)}>
            Edit
          </button>
        </div>
        {interests.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>No interests selected yet.</p>
        ) : (
          <div className="p-tags">
            {interests.map((i) => (
              <span key={i.id} className="badge badge-rep" style={{ fontSize: '0.82rem' }}>
                {i.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================
          RECOMMENDATION PROFILE
          ================================================================ */}
      <div className="card p-section">
        <h2 className="p-section-title">Recommendation Profile</h2>
        <p className="p-section-desc">
          Generate an AI-powered professional summary about your learning journey. You can copy and share it.
        </p>

        {!profile && !generating && (
          <button className="btn btn-primary" onClick={handleGenerate}>
            Generate Recommendation Profile
          </button>
        )}

        {generating && (
          <div className="p-gen-loading">
            <div className="spinner" style={{ width: '1.2rem', height: '1.2rem' }} />
            <span>Generating your recommendation profile...</span>
          </div>
        )}

        {profile && !generating && (
          <div className="p-profile-card">
            <div className="p-profile-text">{profile}</div>
            <div className="p-profile-actions">
              <button
                className={`btn ${copied ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={handleCopy}
              >
                {copied ? 'Copied! ✓' : 'Copy to clipboard'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={handleGenerate}
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          CREDIT HISTORY
          ================================================================ */}
      <div className="card p-section">
        <h2 className="p-section-title">Credit History</h2>

        {loadingHistory ? (
          <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
        ) : history.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>No activity yet.</p>
        ) : (
          <div className="p-history-table">
            <div className="p-history-header">
              <span>Amount</span>
              <span>Reason</span>
              <span>Date</span>
            </div>
            {history.map((tx) => (
              <div key={tx.id} className="p-history-row">
                <span className={`p-history-amount${tx.amount > 0 ? ' positive' : ' negative'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
                <span className="p-history-reason">{formatReason(tx.reason)}</span>
                <span className="p-history-date">{formatDate(tx.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Interest picker overlay ───────────────────────────────── */}
      {showPicker && (
        <InterestPickerOverlay
          onClose={() => setShowPicker(false)}
          onSave={handleInterestsSaved}
        />
      )}

      <style>{pageStyles}</style>
    </div>
  );
}

/* =================================================================== */
/*  STYLES                                                             */
/* =================================================================== */
const pageStyles = `
.p-page {
  max-width: 720px;
}

/* ── Profile header ───────────────────────── */
.p-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 1.5rem;
}

.p-header-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  min-width: 0;
}

.p-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  color: #fff;
  flex-shrink: 0;
}

.p-header-info {
  flex: 1;
  min-width: 0;
}

.p-name {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.p-id-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.p-email {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.p-stats-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.p-edit-btn {
  flex-shrink: 0;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
}

/* ── Sections ─────────────────────────────── */
.p-section {
  margin-bottom: 1rem;
  padding: 1.25rem 1.5rem;
}

.p-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.p-section-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.85rem;
}

/* ── Interest tags ─────────────────────────── */
.p-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* ── Recommendation profile ────────────────── */
.p-gen-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0.5rem 0;
}

.p-profile-card {
  background: var(--brand-light);
  border: 1px solid #D0D7FF;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  animation: slideUp 0.35s ease;
}

.p-profile-text {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-line;
  margin-bottom: 1rem;
}

.p-profile-actions {
  display: flex;
  gap: 0.5rem;
}

/* ── Credit history table ──────────────────── */
.p-history-table {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.p-history-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.p-history-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  align-items: center;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.p-history-row:last-child {
  border-bottom: none;
}
.p-history-row:hover {
  background: var(--brand-light);
}

.p-history-amount {
  font-weight: 600;
  font-size: 0.88rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.p-history-amount.positive {
  color: var(--accent);
}
.p-history-amount.negative {
  color: var(--danger);
}

.p-history-reason {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.p-history-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: right;
}

/* ── Interest picker overlay ───────────────── */
.p-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.p-overlay-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}

.p-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.p-overlay-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
}

.p-interest-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
}

.p-interest-pill {
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}
.p-interest-pill:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.p-interest-pill.selected {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.p-selected-count {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.p-overlay-save {
  width: 100%;
  justify-content: center;
  padding: 0.6rem;
}

/* ── Responsive ───────────────────────────── */
@media (max-width: 600px) {
  .p-header {
    flex-direction: column;
    text-align: center;
  }

  .p-header-main {
    flex-direction: column;
    text-align: center;
  }

  .p-id-row {
    justify-content: center;
  }

  .p-stats-row {
    justify-content: center;
  }

  .p-edit-btn {
    width: 100%;
    justify-content: center;
  }

  .p-history-header,
  .p-history-row {
    grid-template-columns: 60px 1fr 80px;
    padding: 0.5rem 0.75rem;
  }
}
`;
