import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { creditsAPI, buddyAPI, roadmapAPI, skillAPI } from '../api/client';

/* ── Helpers ────────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60); if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60); if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24); return `${d}d ago`;
}

function formatAmount(n) {
  return n > 0 ? `+${n}` : `${n}`;
}

function capitalize(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Skeleton placeholder ───────────────────────────────────────────── */
function SkeletonCard({ lines = 3, height }) {
  return (
    <div className="card" style={height ? { height } : {}}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: '0.85rem',
            marginBottom: i < lines - 1 ? '0.75rem' : 0,
            width: i === lines - 1 ? '55%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

/* ── Error placeholder ──────────────────────────────────────────────── */
function ErrorCard({ message = "Couldn't load this section" }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{message}</p>
    </div>
  );
}

/* =================================================================== */
/*  DASHBOARD                                                           */
/* =================================================================== */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [data, setData] = useState({
    balance: null,
    history: [],
    leaderboard: [],
    requests: [],
    roadmaps: [],
    openSkills: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      /* Fetch balance separately so we can update the store */
      try {
        const balRes = await creditsAPI.getBalance();
        setData((p) => ({ ...p, balance: balRes.data }));
        if (user) setUser({ ...user, credits: balRes.data.credits, reputation: balRes.data.reputation });
      } catch { /* ignore — Layout also fetches this */ }

      const [historyRes, lbRes, reqRes, rmRes, skRes] = await Promise.allSettled([
        creditsAPI.getHistory(),
        creditsAPI.getLeaderboard(),
        buddyAPI.getRequests(),
        roadmapAPI.getMy(),
        skillAPI.getOpen(),
      ]);

      setData((p) => ({
        ...p,
        history: historyRes.status === 'fulfilled' ? historyRes.value.data.slice(0, 5) : [],
        leaderboard: lbRes.status === 'fulfilled' ? lbRes.value.data : [],
        requests: reqRes.status === 'fulfilled' ? reqRes.value.data : [],
        roadmaps: rmRes.status === 'fulfilled' ? rmRes.value.data : [],
        openSkills: skRes.status === 'fulfilled' ? skRes.value.data.slice(0, 3) : [],
      }));

      setErrors({
        history: historyRes.status === 'rejected',
        leaderboard: lbRes.status === 'rejected',
        requests: reqRes.status === 'rejected',
        roadmaps: rmRes.status === 'rejected',
        openSkills: skRes.status === 'rejected',
      });

      setLoading(false);
    })();
  }, []);

  const { balance, history, leaderboard, requests, roadmaps, openSkills } = data;
  const latestRoadmap = roadmaps.length > 0 ? roadmaps[0] : null;
  const latestContent = latestRoadmap
    ? (typeof latestRoadmap.content === 'string'
        ? JSON.parse(latestRoadmap.content)
        : latestRoadmap.content)
    : null;

  /* ── Full-page loading state ──────────────────────────────────────── */
  if (loading && !balance) {
    return (
      <div className="d-grid">
        <div className="d-left">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
        <div className="d-right">
          <SkeletonCard lines={7} />
          <SkeletonCard lines={4} />
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="d-grid">
      {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
      <div className="d-left">
        {/* Welcome card */}
        <div className="card d-welcome">
          <div className="d-welcome-top">
            <div>
              <h1 className="d-greeting">Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!</h1>
              {user?.student_id && (
                <span className="badge badge-rep" style={{ marginTop: '0.25rem' }}>{user.student_id}</span>
              )}
            </div>
            <div className="d-balance-chip">
              <span className="d-coin">&#9679;</span>
              <span className="d-balance-val">{balance?.credits ?? 0}</span>
              <span className="d-balance-label">credits</span>
            </div>
          </div>

          <div className="d-stats-row">
            <div className="d-stat">
              <span className="d-stat-icon" style={{ color: 'var(--accent)' }}>&#9679;</span>
              <div>
                <p className="d-stat-val">{balance?.credits ?? 0}</p>
                <p className="d-stat-label">Credits</p>
              </div>
            </div>
            <div className="d-stat">
              <span className="d-stat-icon" style={{ color: 'var(--brand)' }}>&#9733;</span>
              <div>
                <p className="d-stat-val">{balance?.reputation ?? 0}</p>
                <p className="d-stat-label">Reputation</p>
              </div>
            </div>
            <div className="d-stat">
              <span className="d-stat-icon" style={{ color: '#F59E0B' }}>&#128101;</span>
              <div>
                <p className="d-stat-val">{requests.length}</p>
                <p className="d-stat-label">Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap CTA or latest roadmap */}
        {errors.roadmaps ? (
          <ErrorCard />
        ) : latestRoadmap ? (
          <div className="card d-cta-card">
            <div className="d-cta-content">
              <div>
                <p className="d-cta-label">Continue Learning</p>
                <h3 className="d-cta-title">{latestRoadmap.title}</h3>
                {latestContent?.weeks?.[0] && (
                  <p className="d-cta-sub">
                    Week 1: {latestContent.weeks[0].theme}
                  </p>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => navigate(`/roadmap/${latestRoadmap.id}`)}>
                Continue Roadmap &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="card d-cta-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>&#128218;</p>
            <h3 className="d-section-title" style={{ textAlign: 'center' }}>Generate Your Learning Roadmap</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
              Let AI create a personalized 12-week study plan based on your interests.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/roadmap')}>
              Get Started &rarr;
            </button>
          </div>
        )}

        {/* Active Buddy Requests */}
        <div className="d-section">
          <h2 className="d-section-title">Active Buddy Requests</h2>
          {errors.requests ? (
            <ErrorCard />
          ) : requests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No pending requests
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="card d-request-row">
                <div>
                  <p className="d-req-name">{req.requester_name}</p>
                  {req.matched_interest && (
                    <p className="d-req-interest">{req.matched_interest}</p>
                  )}
                </div>
                <div className="d-req-actions">
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }}
                    onClick={async () => {
                      try {
                        await buddyAPI.respond(req.id, 'accept');
                        setData((p) => ({ ...p, requests: p.requests.filter((r) => r.id !== req.id) }));
                      } catch {}
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 1rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                    onClick={async () => {
                      try {
                        await buddyAPI.respond(req.id, 'reject');
                        setData((p) => ({ ...p, requests: p.requests.filter((r) => r.id !== req.id) }));
                      } catch {}
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Credit Activity */}
        <div className="d-section">
          <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
            <h2 className="d-section-title" style={{ marginBottom: 0 }}>Recent Credits</h2>
            <Link to="/profile" className="text-muted" style={{ fontSize: '0.85rem' }}>View all</Link>
          </div>
          {errors.history ? (
            <ErrorCard />
          ) : history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No activity yet
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {history.map((tx, i) => (
                <div key={tx.id} className="d-tx-row" style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="d-tx-left">
                    <span className={`badge badge-credit`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                      {formatAmount(tx.amount)}
                    </span>
                    <span className="d-tx-reason">{capitalize(tx.reason)}</span>
                  </div>
                  <span className="d-tx-time">{timeAgo(tx.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN ───────────────────────────────────────────── */}
      <div className="d-right">
        {/* Leaderboard */}
        <div className="d-section">
          <h2 className="d-section-title">&#127942; Leaderboard</h2>
          {errors.leaderboard ? (
            <ErrorCard />
          ) : (
            <div className="card d-lb-card">
              {leaderboard.map((entry, i) => {
                const isMe = entry.student_id === user?.student_id;
                return (
                  <div key={entry.student_id || i} className={`d-lb-row${isMe ? ' d-lb-me' : ''}`}>
                    <span className={`d-lb-rank${i < 3 ? ' d-lb-top' : ''}`}>{i + 1}</span>
                    <div className="d-lb-info">
                      <span className="d-lb-name">{entry.full_name}{isMe ? ' (You)' : ''}</span>
                      <span className="d-lb-id">{entry.student_id}</span>
                    </div>
                    <div className="d-lb-rep">
                      <span className="badge badge-rep" style={{ fontSize: '0.7rem' }}>RP {entry.reputation}</span>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>
                  No data yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Skill Exchange Feed */}
        <div className="d-section">
          <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
            <h2 className="d-section-title" style={{ marginBottom: 0 }}>&#128260; Skill Exchange</h2>
            <Link to="/skills" className="text-muted" style={{ fontSize: '0.85rem' }}>See all</Link>
          </div>
          {errors.openSkills ? (
            <ErrorCard />
          ) : openSkills.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No open exchanges
            </div>
          ) : (
            openSkills.map((sk) => (
              <div key={sk.id} className="card d-sk-row">
                <div className="d-sk-header">
                  <span className="d-sk-icon">&#128736;</span>
                  <span className="d-sk-user">{sk.full_name}</span>
                </div>
                <p className="d-sk-desc">
                  offers <strong>{sk.offering}</strong> &middot; seeks <strong>{sk.seeking}</strong>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = `
.d-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.d-left, .d-right {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Welcome card ────────────────────────────── */
.d-welcome {
  padding: 1.5rem;
}

.d-welcome-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.d-greeting {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.d-balance-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--accent-light);
  border-radius: 9999px;
  padding: 0.35rem 0.85rem 0.35rem 0.7rem;
  flex-shrink: 0;
}

.d-coin {
  font-size: 1rem;
  color: var(--accent);
}

.d-balance-val {
  font-weight: 700;
  font-size: 1rem;
  color: var(--accent);
}

.d-balance-label {
  font-size: 0.75rem;
  color: var(--accent);
  opacity: 0.8;
}

.d-stats-row {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.d-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.d-stat-icon {
  font-size: 1.5rem;
}

.d-stat-val {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.d-stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ── CTA card ────────────────────────────────── */
.d-cta-card {
  padding: 1.5rem;
}

.d-cta-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.d-cta-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.d-cta-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.d-cta-sub {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* ── Section title ───────────────────────────── */
.d-section {
  margin-bottom: 0;
}

.d-section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

/* ── Buddy requests ──────────────────────────── */
.d-request-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
}

.d-req-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.d-req-interest {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.d-req-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* ── Credit transactions ─────────────────────── */
.d-tx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.25rem;
}

.d-tx-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.d-tx-reason {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.d-tx-time {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ── Leaderboard ─────────────────────────────── */
.d-lb-card {
  padding: 0.5rem 0;
}

.d-lb-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 1rem;
  border-radius: var(--radius);
  transition: background 0.15s;
}

.d-lb-me {
  background: var(--brand-light);
}

.d-lb-rank {
  width: 24px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  flex-shrink: 0;
}

.d-lb-top {
  color: #D97706;
}

.d-lb-info {
  flex: 1;
  min-width: 0;
}

.d-lb-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.d-lb-id {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.d-lb-rep {
  flex-shrink: 0;
}

/* ── Skill exchange feed ─────────────────────── */
.d-sk-row {
  padding: 0.85rem 1rem;
  margin-bottom: 0.5rem;
}

.d-sk-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.d-sk-icon {
  font-size: 0.9rem;
}

.d-sk-user {
  font-weight: 600;
  font-size: 0.85rem;
}

.d-sk-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* ── Responsive ──────────────────────────────── */
@media (max-width: 768px) {
  .d-grid {
    grid-template-columns: 1fr;
  }

  .d-cta-content {
    flex-direction: column;
    text-align: center;
  }

  .d-stats-row {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .d-welcome-top {
    flex-direction: column;
    gap: 0.75rem;
  }

  .d-request-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .d-req-actions {
    width: 100%;
  }

  .d-req-actions button {
    flex: 1;
    justify-content: center;
  }
}
`;
