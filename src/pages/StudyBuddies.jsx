import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { buddyAPI } from '../api/client';
import StudentCard from '../components/StudentCard';


/* ── Avatar helpers (shared) ──────────────────────────────────────── */
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

/* ── Inline avatar component ──────────────────────────────────────── */
function Avatar({ name, size = 40 }) {
  return (
    <div
      className="sb-avatar"
      style={{
        width: size,
        height: size,
        background: getColor(name),
        fontSize: size * 0.4,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/* =================================================================== */
/*  MAIN PAGE                                                          */
/* =================================================================== */
export default function StudyBuddies() {
  const [tab, setTab] = useState('find');
  const [suggestions, setSuggestions] = useState([]);
  const [myBuddies, setMyBuddies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState('');
  /* Inline "connect over" form state */
  const [connecting, setConnecting] = useState(null);
  const [selectedInterest, setSelectedInterest] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [sugRes, budRes, reqRes] = await Promise.allSettled([
      buddyAPI.getSuggestions(),
      buddyAPI.getMy(),
      buddyAPI.getRequests(),
    ]);
    if (sugRes.status === 'fulfilled') setSuggestions(sugRes.value.data);
    if (budRes.status === 'fulfilled') setMyBuddies(budRes.value.data);
    if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  /* ── Send buddy request ─────────────────────────────────────────── */
  const handleSendRequest = async (user) => {
    if (!selectedInterest && connecting?.id === user.id) return;
    setSendingId(user.id);
    try {
      await buddyAPI.sendRequest({ receiverId: user.id, matchedInterest: selectedInterest || undefined });
      setSuggestions((prev) => prev.filter((s) => s.id !== user.id));
      setConnecting(null);
      setSelectedInterest('');
      showToast('Request sent! +5 credits');
    } catch {
      showToast('Failed to send request');
    } finally {
      setSendingId(null);
    }
  };

  /* ── Accept / reject request ────────────────────────────────────── */
  const handleRespond = async (reqId, action) => {
    try {
      await buddyAPI.respond(reqId, action);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      if (action === 'accept') showToast('+25 credits earned!');
    } catch { /* ignore */ }
  };

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  const reqCount = requests.length;

  return (
    <div className="sb-page fade-in">
      <h1 className="page-title">Study Buddies</h1>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="sb-tabs">
        {[
          { key: 'find', label: 'Find Buddies' },
          { key: 'my', label: 'My Buddies' },
          { key: 'requests', label: `Requests (${reqCount})` },
        ].map((t) => (
          <button
            key={t.key}
            className={`sb-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ================================================================
          TAB: FIND BUDDIES
          ================================================================ */}
      {tab === 'find' && (
        <div>
          {suggestions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                No suggestions right now. Check back after more students join.
              </p>
            </div>
          ) : (
            <div className="sb-grid">
              {suggestions.map((user) => (
                <div key={user.id}>
                  <StudentCard
                    user={user}
                    sharedInterests={user.sharedInterests}
                    actionLabel={connecting?.id === user.id ? 'Connecting...' : 'Send Buddy Request'}
                    actionLoading={sendingId === user.id}
                    onAction={(u) => {
                      if (connecting?.id === u.id) {
                        handleSendRequest(u);
                      } else {
                        setConnecting(u);
                        setSelectedInterest((u.sharedInterests?.[0]) || '');
                      }
                    }}
                  />

                  {/* Inline "connect over" form */}
                  {connecting?.id === user.id && (
                    <div className="sb-connect-form">
                      <label className="sb-connect-label">Connect over:</label>
                      <select
                        className="input"
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                        value={selectedInterest}
                        onChange={(e) => setSelectedInterest(e.target.value)}
                      >
                        {(user.sharedInterests || []).map((si) => (
                          <option key={si} value={si}>{si}</option>
                        ))}
                      </select>
                      <div className="sb-connect-actions">
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => handleSendRequest(user)}
                          disabled={sendingId === user.id}
                        >
                          {sendingId === user.id ? <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} /> : 'Confirm'}
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => { setConnecting(null); setSelectedInterest(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          TAB: MY BUDDIES
          ================================================================ */}
      {tab === 'my' && (
        <div>
          {myBuddies.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                No buddies yet. Send some requests!
              </p>
            </div>
          ) : (
            <div className="sb-list">
              {myBuddies.map((b) => (
                <div key={b.id} className="card sb-buddy-row">
                  <Avatar name={b.partner_name} />
                  <div className="sb-buddy-info">
                    <span className="sb-buddy-name">{b.partner_name}</span>
                    <span className="sb-buddy-id">{b.partner_student_id}</span>
                  </div>
                  <Link to={`/profile`} className="btn btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          TAB: REQUESTS
          ================================================================ */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                No pending requests.
              </p>
            </div>
          ) : (
            <div className="sb-list">
              {requests.map((req) => (
                <div key={req.id} className="card sb-req-row">
                  <Avatar name={req.requester_name} />
                  <div className="sb-req-info">
                    <span className="sb-req-name">{req.requester_name}</span>
                    {req.matched_interest && (
                      <span className="sb-req-interest">
                        Shared interest: <strong>{req.matched_interest}</strong>
                      </span>
                    )}
                  </div>
                  <div className="sb-req-actions">
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => handleRespond(req.id, 'accept')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 1rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                      onClick={() => handleRespond(req.id, 'reject')}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && <div className="sb-toast">{toast}</div>}

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
.sb-page {
  max-width: 800px;
}

/* ── Tabs ──────────────────────────────────── */
.sb-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.25rem;
  border-bottom: 2px solid var(--border);
}

.sb-tab {
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;
}
.sb-tab:hover {
  color: var(--text-primary);
}
.sb-tab.active {
  color: var(--brand);
  border-bottom-color: var(--brand);
  font-weight: 600;
}

/* ── Grid for suggestions ──────────────────── */
.sb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* ── Inline connect form ───────────────────── */
.sb-connect-form {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.sb-connect-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
  display: block;
}

.sb-connect-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* ── Buddy row (my buddies & requests) ─────── */
.sb-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sb-buddy-row,
.sb-req-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1.25rem;
}

.sb-buddy-info,
.sb-req-info {
  flex: 1;
  min-width: 0;
}

.sb-buddy-name,
.sb-req-name {
  font-weight: 600;
  font-size: 0.9rem;
  display: block;
}

.sb-buddy-id {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.sb-req-interest {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: block;
  margin-top: 0.15rem;
}

.sb-req-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* ── Avatar ─────────────────────────────────── */
.sb-avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

/* ── Toast ──────────────────────────────────── */
.sb-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  padding: 0.65rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.3s ease;
  z-index: 100;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sb-grid {
    grid-template-columns: 1fr;
  }

  .sb-req-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .sb-req-actions {
    width: 100%;
  }

  .sb-req-actions button {
    flex: 1;
    justify-content: center;
  }
}
`;
