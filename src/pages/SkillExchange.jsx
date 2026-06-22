import { useState, useEffect, useCallback } from 'react';
import { skillAPI, buddyAPI } from '../api/client';
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

function Avatar({ name, size = 40 }) {
  return (
    <div
      className="sx-avatar"
      style={{ width: size, height: size, background: getColor(name), fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </div>
  );
}

/* =================================================================== */
/*  MAIN PAGE                                                          */
/* =================================================================== */
export default function SkillExchange() {

  /* ── Post form state ──────────────────────────────────────────── */
  const [offering, setOffering] = useState('');
  const [seeking, setSeeking] = useState('');
  const [posting, setPosting] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  /* ── My exchanges ─────────────────────────────────────────────── */
  const [myExchanges, setMyExchanges] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);

  /* ── Open exchanges ───────────────────────────────────────────── */
  const [openExchanges, setOpenExchanges] = useState([]);
  const [loadingOpen, setLoadingOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Send request state ───────────────────────────────────────── */
  const [sendingId, setSendingId] = useState(null);

  /* ── Toast ────────────────────────────────────────────────────── */
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* ── Fetch data ──────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    const [myRes, openRes] = await Promise.allSettled([
      skillAPI.getMy(),
      skillAPI.getOpen(),
    ]);
    if (myRes.status === 'fulfilled') setMyExchanges(myRes.value.data);
    if (openRes.status === 'fulfilled') setOpenExchanges(openRes.value.data);
    setLoadingMy(false);
    setLoadingOpen(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Post exchange ────────────────────────────────────────────── */
  const handlePost = async () => {
    if (!offering.trim() || !seeking.trim()) return;
    setPosting(true);
    setMatchResult(null);
    try {
      const res = await skillAPI.post({ offering: offering.trim(), seeking: seeking.trim() });
      const { match } = res.data;

      if (match) {
        setMatchResult(match);
        showToast('+30 credits earned!');
      } else {
        showToast("Posted! We'll notify you when a match is found.");
      }

      setOffering('');
      setSeeking('');

      // Refresh lists
      const [myRes, openRes] = await Promise.allSettled([
        skillAPI.getMy(),
        skillAPI.getOpen(),
      ]);
      if (myRes.status === 'fulfilled') setMyExchanges(myRes.value.data);
      if (openRes.status === 'fulfilled') setOpenExchanges(openRes.value.data);
    } catch {
      showToast('Failed to post exchange');
    } finally {
      setPosting(false);
    }
  };

  /* ── Send buddy request from an open exchange ────────────────── */
  const handleRequestMatch = async (exchange) => {
    setSendingId(exchange.id);
    try {
      await buddyAPI.sendRequest({
        receiverId: exchange.userId,
        matchedInterest: exchange.offering,
      });
      showToast('Request sent!');
    } catch {
      showToast('Failed to send request');
    } finally {
      setSendingId(null);
    }
  };

  /* ── Filter open exchanges ───────────────────────────────────── */
  const filteredOpen = openExchanges.filter((ex) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      ex.offering.toLowerCase().includes(term) ||
      ex.seeking.toLowerCase().includes(term)
    );
  });

  /* ── Match found card dismiss ────────────────────────────────── */
  const dismissMatch = () => setMatchResult(null);

  return (
    <div className="sx-page fade-in">
      <h1 className="page-title">Skill Exchange</h1>

      {/* ================================================================
          SECTION: POST A SKILL EXCHANGE
          ================================================================ */}
      <div className="card sx-post-card">
        <h2 className="sx-section-title">Post a Skill Exchange</h2>

        <div className="sx-form">
          <div className="sx-field">
            <label>I can teach / offer:</label>
            <input
              className="input"
              placeholder="e.g. Python, UI Design, Data Analysis"
              value={offering}
              onChange={(e) => setOffering(e.target.value)}
            />
          </div>

          <div className="sx-field">
            <label>I want to learn / get help with:</label>
            <input
              className="input"
              placeholder="e.g. Machine Learning, React, Statistics"
              value={seeking}
              onChange={(e) => setSeeking(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary sx-post-btn"
            onClick={handlePost}
            disabled={posting || !offering.trim() || !seeking.trim()}
          >
            {posting ? (
              <span className="spinner" style={{ width: '1rem', height: '1rem' }} />
            ) : (
              'Post Exchange'
            )}
          </button>
        </div>

        {/* Match found! card */}
        {matchResult && (
          <div className="sx-match-card">
            <div className="sx-match-header">
              <span className="sx-match-icon">&#9889;</span>
              <span className="sx-match-title">Match Found!</span>
              <button className="sx-match-close" onClick={dismissMatch}>&times;</button>
            </div>
            <div className="sx-match-body">
              <div className="sx-match-user">
                <Avatar name={matchResult.full_name} size={44} />
                <div>
                  <p className="sx-match-name">{matchResult.full_name}</p>
                  <p className="sx-match-id">{matchResult.student_id}</p>
                </div>
              </div>
              <div className="sx-match-details">
                <p><span className="badge badge-credit" style={{ fontSize: '0.8rem' }}>Offers</span> {matchResult.offering}</p>
                <p><span className="badge badge-status" data-status="pending" style={{ fontSize: '0.8rem' }}>Seeks</span> {matchResult.seeking}</p>
              </div>
              <div className="sx-match-credits">
                <CreditBadge amount={30} label="credits earned!" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION: MY EXCHANGES
          ================================================================ */}
      <div className="sx-section">
        <h2 className="sx-section-title">My Exchanges</h2>
        {loadingMy ? (
          <div className="card" style={{ padding: '1rem' }}>
            <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
          </div>
        ) : myExchanges.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>No exchanges yet. Post one above!</p>
          </div>
        ) : (
          <div className="sx-my-list">
            {myExchanges.map((ex) => (
              <div key={ex.id} className="card sx-my-row">
                <span className={`badge badge-status`} data-status={ex.status}>
                  {ex.status}
                </span>
                <div className="sx-my-info">
                  <span className="sx-my-skills">
                    <strong>{ex.offering}</strong> &harr; <strong>{ex.seeking}</strong>
                  </span>
                  {ex.status === 'matched' && ex.matched_user_name && (
                    <span className="sx-my-matched">
                      Matched with {ex.matched_user_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION: OPEN EXCHANGES FEED
          ================================================================ */}
      <div className="sx-section">
        <div className="sx-feed-header">
          <h2 className="sx-section-title" style={{ marginBottom: 0 }}>Open Exchanges</h2>
        </div>

        {/* Search / filter bar */}
        <div className="sx-search-bar">
          <input
            className="input"
            placeholder="Search by offering or seeking skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
          />
        </div>

        {loadingOpen ? (
          <div className="sx-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ padding: '1.25rem' }}>
                <div className="skeleton" style={{ height: '2.5rem', width: '2.5rem', borderRadius: '50%', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: '0.85rem', width: '70%', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: '1.5rem', width: '100%', marginBottom: '0.4rem' }} />
                <div className="skeleton" style={{ height: '1.5rem', width: '80%', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: '2rem', width: '100%' }} />
              </div>
            ))}
          </div>
        ) : filteredOpen.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>&#128260;</p>
            {searchTerm ? (
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No exchanges match your search.</p>
            ) : (
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No open exchanges yet. Be the first to post!</p>
            )}
          </div>
        ) : (
          <div className="sx-grid">
            {filteredOpen.map((ex) => (
              <div key={ex.id} className="card sx-exchange-card">
                {/* User info */}
                <div className="sx-ex-user">
                  <Avatar name={ex.full_name} />
                  <div className="sx-ex-user-info">
                    <span className="sx-ex-name">{ex.full_name}</span>
                    <span className="sx-ex-id">{ex.student_id}</span>
                  </div>
                  {ex.reputation > 0 && (
                    <span className="badge badge-rep" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', marginLeft: 'auto' }}>
                      RP {ex.reputation}
                    </span>
                  )}
                </div>

                {/* Skills */}
                <div className="sx-ex-skills">
                  <div className="sx-ex-skill-row">
                    <span className="sx-ex-label">Offers:</span>
                    <span className="badge badge-credit" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                      {ex.offering}
                    </span>
                  </div>
                  <div className="sx-ex-skill-row">
                    <span className="sx-ex-label">Seeks:</span>
                    <span className="badge badge-status" data-status="pending" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                      {ex.seeking}
                    </span>
                  </div>
                </div>

                {/* Request Match button */}
                <button
                  className="btn btn-primary sx-ex-btn"
                  onClick={() => handleRequestMatch(ex)}
                  disabled={sendingId === ex.id}
                >
                  {sendingId === ex.id ? (
                    <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} />
                  ) : (
                    'Request Match'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && <div className="sx-toast">{toast}</div>}

      <style>{pageStyles}</style>
    </div>
  );
}

/* =================================================================== */
/*  STYLES                                                             */
/* =================================================================== */
const pageStyles = `
.sx-page {
  max-width: 900px;
}

/* ── Section title ──────────────────────── */
.sx-section-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

/* ── Post card ──────────────────────────── */
.sx-post-card {
  margin-bottom: 1.25rem;
}

.sx-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.sx-field {
  flex: 1;
}

.sx-post-btn {
  align-self: flex-start;
  padding: 0.6rem 1.5rem;
}

@media (min-width: 601px) {
  .sx-form {
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .sx-field {
    min-width: 200px;
  }
}

/* ── Match card ─────────────────────────── */
.sx-match-card {
  margin-top: 1rem;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  animation: slideUp 0.35s ease;
}

.sx-match-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.sx-match-icon {
  font-size: 1.3rem;
}

.sx-match-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--accent);
  flex: 1;
}

.sx-match-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}
.sx-match-close:hover {
  color: var(--text-primary);
}

.sx-match-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sx-match-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sx-match-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.sx-match-id {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.sx-match-details {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.sx-match-details p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sx-match-credits {
  margin-top: 0.25rem;
}

/* ── My exchanges ───────────────────────── */
.sx-section {
  margin-bottom: 1.5rem;
}

.sx-my-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sx-my-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.sx-my-info {
  flex: 1;
  min-width: 0;
}

.sx-my-skills {
  display: block;
  font-size: 0.88rem;
  color: var(--text-primary);
}

.sx-my-matched {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

/* ── Open exchanges feed ────────────────── */
.sx-feed-header {
  margin-bottom: 0.5rem;
}

.sx-search-bar {
  margin-bottom: 0.85rem;
}

.sx-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.sx-exchange-card {
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.sx-ex-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.sx-ex-user-info {
  flex: 1;
  min-width: 0;
}

.sx-ex-name {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
}

.sx-ex-id {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.sx-ex-skills {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sx-ex-skill-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.sx-ex-label {
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 48px;
}

.sx-ex-btn {
  width: 100%;
  justify-content: center;
  padding: 0.5rem;
  font-size: 0.85rem;
}

/* ── Toast ──────────────────────────────── */
.sx-toast {
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

/* ── Responsive ─────────────────────────── */
@media (max-width: 768px) {
  .sx-grid {
    grid-template-columns: 1fr;
  }

  .sx-post-btn {
    width: 100%;
    justify-content: center;
  }

  .sx-match-details p {
    flex-wrap: wrap;
  }
}
`;
