import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roadmapAPI, studentAPI } from '../api/client';

const PROGRESS_KEY = 'roadmap_progress_';

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getChecked(roadmapId, weekIdx, goalIdx) {
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY + roadmapId) || '{}');
    return !!stored[`w${weekIdx}_g${goalIdx}`];
  } catch { return false; }
}

function toggleChecked(roadmapId, weekIdx, goalIdx, checked) {
  const key = PROGRESS_KEY + roadmapId;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    stored[`w${weekIdx}_g${goalIdx}`] = checked;
    localStorage.setItem(key, JSON.stringify(stored));
  } catch { /* ignore */ }
}

function getWeekProgress(roadmapId, week) {
  if (!week.goals || week.goals.length === 0) return 0;
  const done = week.goals.filter((_, gi) => getChecked(roadmapId, week.week, gi)).length;
  return Math.round((done / week.goals.length) * 100);
}

const resourceIcons = {
  video: '&#127909;',
  article: '&#128214;',
  course: '&#127891;',
  book: '&#128218;',
};

/* =================================================================== */
/*  ROADMAP DETAIL                                                      */
/* =================================================================== */
export default function RoadmapDetail() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openWeeks, setOpenWeeks] = useState(new Set());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [rmRes, intRes] = await Promise.all([
          roadmapAPI.getById(id),
          studentAPI.getMyInterests().catch(() => ({ data: [] })),
        ]);
        setRoadmap(rmRes.data);
        setInterests(intRes.data || []);
      } catch { /* handled by state */ } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleWeek = useCallback((weekNum) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  }, []);

  const handleCheck = useCallback((weekIdx, goalIdx, checked) => {
    toggleChecked(id, weekIdx, goalIdx, checked);
    forceUpdate((n) => n + 1);
  }, [id]);

  /* ── Loading / error ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <p className="text-secondary">Roadmap not found. <Link to="/roadmap">Go back</Link></p>
      </div>
    );
  }

  const content = typeof roadmap.content === 'string' ? JSON.parse(roadmap.content) : roadmap.content;
  const weeks = content.weeks || [];
  const milestones = content.milestones || [];
  const milestoneWeeks = new Set(milestones.map((m) => m.week));
  const totalGoals = weeks.reduce((sum, w) => sum + (w.goals?.length || 0), 0);
  let completedGoals = 0;
  weeks.forEach((w) => {
    if (w.goals) {
      w.goals.forEach((_, gi) => {
        if (getChecked(id, w.week, gi)) completedGoals++;
      });
    }
  });
  const overallPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className="rd-page fade-in">
      <Link to="/roadmap" className="rd-back">&larr; Back to Roadmaps</Link>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="rd-header">
        <h1 className="rd-title">{roadmap.title || content.title}</h1>
        <div className="rd-meta">
          <span className="rd-date">Generated {formatDate(roadmap.generated_at)}</span>
          {interests.length > 0 && (
            <div className="rd-tags">
              {interests.map((i) => (
                <span key={i.id} className="badge badge-rep">{i.label}</span>
              ))}
            </div>
          )}
        </div>
        <div className="rd-progress-bar">
          <div className="rd-progress-fill" style={{ width: `${overallPct}%` }} />
          <span className="rd-progress-label">{overallPct}% complete</span>
        </div>
      </div>

      {/* ── Summary ────────────────────────────────────────────────── */}
      {content.summary && (
        <blockquote className="rd-summary">{content.summary}</blockquote>
      )}

      {/* ── Milestones stepper ────────────────────────────────────── */}
      {milestones.length > 0 && (
        <div className="rd-stepper">
          {milestones.map((m, i) => (
            <button
              key={m.week}
              className="rd-step"
              onClick={() => {
                toggleWeek(m.week);
                const el = document.getElementById(`week-${m.week}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className={`rd-step-dot${i <= milestones.findIndex((m2) => overallPct >= (m2.week / 12) * 100) ? ' done' : ''}`}>
                {m.week}
              </span>
              <span className="rd-step-label">{m.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Weekly accordion ───────────────────────────────────────── */}
      <div className="rd-weeks">
        {weeks.map((week) => {
          const isOpen = openWeeks.has(week.week);
          const hasMilestone = milestoneWeeks.has(week.week);
          const milestone = milestones.find((m) => m.week === week.week);
          const wp = getWeekProgress(id, week);

          return (
            <div
              key={week.week}
              id={`week-${week.week}`}
              className={`rd-week-card${hasMilestone ? ' rd-week-milestone' : ''}`}
            >
              {/* ── Week header (always visible) ────────────────── */}
              <button
                className="rd-week-header"
                onClick={() => toggleWeek(week.week)}
                aria-expanded={isOpen}
              >
                <div className="rd-week-left">
                  <span className="rd-week-badge">Week {week.week}</span>
                  <div>
                    <span className="rd-week-theme">{week.theme}</span>
                    {hasMilestone && <span className="rd-week-milestone-label">&#9733; {milestone.title}</span>}
                  </div>
                </div>
                <div className="rd-week-right">
                  {week.goals && week.goals.length > 0 && (
                    <span className="rd-week-progress">{wp}%</span>
                  )}
                  <span className={`rd-week-chevron${isOpen ? ' open' : ''}`}>&#9660;</span>
                </div>
              </button>

              {/* ── Expanded body ────────────────────────────────── */}
              {isOpen && (
                <div className="rd-week-body fade-in">
                  {/* Goals checklist */}
                  {week.goals && week.goals.length > 0 && (
                    <div className="rd-section">
                      <h4 className="rd-section-title">Goals</h4>
                      {week.goals.map((goal, gi) => {
                        const checked = getChecked(id, week.week, gi);
                        return (
                          <label key={gi} className={`rd-goal${checked ? ' done' : ''}`}>
                            <input
                              type="checkbox"
                              className="rd-checkbox"
                              checked={checked}
                              onChange={(e) => handleCheck(week.week, gi, e.target.checked)}
                            />
                            <span className="rd-goal-text">{goal}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Resources */}
                  {week.resources && week.resources.length > 0 && (
                    <div className="rd-section">
                      <h4 className="rd-section-title">Resources</h4>
                      <div className="rd-resources">
                        {week.resources.map((r, ri) => (
                          <div key={ri} className="rd-resource">
                            <span
                              className="rd-resource-icon"
                              dangerouslySetInnerHTML={{ __html: resourceIcons[r.type] || '&#128196;' }}
                            />
                            <div className="rd-resource-info">
                              <span className="rd-resource-title">{r.title}</span>
                              <span className="rd-resource-type">{r.type}</span>
                            </div>
                            {r.url && (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rd-resource-link"
                                title="Open resource"
                              >
                                &#8599;
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mini project */}
                  {week.project && (
                    <div className="rd-section">
                      <h4 className="rd-section-title">Mini Project</h4>
                      <div className="rd-project">
                        <span className="rd-project-icon">&#128736;</span>
                        <span>{week.project}</span>
                      </div>
                    </div>
                  )}

                  {/* Milestone detail */}
                  {hasMilestone && milestone && (
                    <div className="rd-section">
                      <h4 className="rd-section-title">&#9733; Milestone</h4>
                      <p className="rd-milestone-desc">{milestone.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
.rd-page {
  max-width: 720px;
  margin: 0 auto;
}

.rd-back {
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: inline-block;
  margin-bottom: 1rem;
}
.rd-back:hover {
  color: var(--brand);
}

/* ── Header ─────────────────────────────────── */
.rd-header {
  margin-bottom: 1.25rem;
}

.rd-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.rd-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.rd-date {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.rd-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.rd-progress-bar {
  position: relative;
  height: 10px;
  background: var(--border);
  border-radius: 5px;
  overflow: visible;
}

.rd-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand), var(--accent));
  border-radius: 5px;
  transition: width 0.4s ease;
}

.rd-progress-label {
  position: absolute;
  right: 0;
  top: -1.3rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* ── Summary ────────────────────────────────── */
.rd-summary {
  background: var(--brand-light);
  border-left: 4px solid var(--brand);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-style: italic;
  line-height: 1.6;
}

/* ── Milestone stepper ──────────────────────── */
.rd-stepper {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.rd-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  transition: background 0.15s;
  min-width: 60px;
}
.rd-step:hover {
  background: var(--bg);
}

.rd-step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--border);
  transition: all 0.2s;
}
.rd-step-dot.done {
  background: var(--accent);
  color: #fff;
}

.rd-step-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
  max-width: 70px;
  line-height: 1.2;
}

/* ── Week cards ─────────────────────────────── */
.rd-weeks {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.rd-week-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.rd-week-card:hover {
  box-shadow: var(--shadow-sm);
}

.rd-week-milestone {
  border-left: 4px solid var(--brand);
}

.rd-week-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  gap: 1rem;
}
.rd-week-header:hover {
  background: var(--bg);
}

.rd-week-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.rd-week-badge {
  background: var(--brand-light);
  color: var(--brand);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius);
  white-space: nowrap;
  flex-shrink: 0;
}

.rd-week-theme {
  font-weight: 600;
  font-size: 0.95rem;
  display: block;
}

.rd-week-milestone-label {
  font-size: 0.75rem;
  color: var(--brand);
  font-weight: 500;
  display: block;
  margin-top: 0.1rem;
}

.rd-week-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.rd-week-progress {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
}

.rd-week-chevron {
  font-size: 0.6rem;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.rd-week-chevron.open {
  transform: rotate(180deg);
}

/* ── Week body ──────────────────────────────── */
.rd-week-body {
  padding: 0 1.25rem 1.25rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.rd-section {
  margin-bottom: 1rem;
}

.rd-section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
}

/* ── Goals ──────────────────────────────────── */
.rd-goal {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.35rem 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.rd-checkbox {
  width: 16px;
  height: 16px;
  margin-top: 0.2rem;
  accent-color: var(--accent);
  flex-shrink: 0;
  cursor: pointer;
}

.rd-goal-text {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-primary);
  transition: color 0.15s, text-decoration 0.15s;
}

.rd-goal.done .rd-goal-text {
  color: var(--text-muted);
  text-decoration: line-through;
}

/* ── Resources ──────────────────────────────── */
.rd-resources {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.rd-resource {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.65rem;
  background: var(--bg);
  border-radius: var(--radius);
}

.rd-resource-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.rd-resource-info {
  flex: 1;
  min-width: 0;
}

.rd-resource-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rd-resource-type {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.rd-resource-link {
  font-size: 1rem;
  color: var(--text-muted);
  padding: 0.2rem;
  flex-shrink: 0;
  text-decoration: none;
}
.rd-resource-link:hover {
  color: var(--brand);
}

/* ── Project ────────────────────────────────── */
.rd-project {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem;
  background: var(--bg);
  border-radius: var(--radius);
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.rd-project-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* ── Milestone description ──────────────────── */
.rd-milestone-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  font-style: italic;
}

/* ── Responsive ─────────────────────────────── */
@media (max-width: 768px) {
  .rd-page {
    max-width: 100%;
  }

  .rd-week-header {
    padding: 0.85rem 1rem;
  }

  .rd-week-body {
    padding: 0 1rem 1rem;
  }

  .rd-stepper {
    gap: 0.4rem;
  }

  .rd-step-label {
    display: none;
  }
}
`;
