import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  GIG_LEADER_ONLY_MESSAGE,
  GIG_STATUS_OPTIONS,
  computeGigDashboardMetrics,
  createGig,
  formatGigStatus,
  gigStatusPillClass,
  isBandLeaderRole,
  listBandGigs,
  type BandGig,
  type GigStatus,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/gigs.css';

export function GigsDashboardPage() {
  const { bandId } = useParams();
  const navigate = useNavigate();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManage = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [gigs, setGigs] = useState<BandGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    startsAt: '',
    venueName: '',
    status: 'enquiry' as GigStatus,
  });

  const loadGigs = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const rows = await listBandGigs(bandId);
      setGigs(rows);
    } catch (err) {
      setGigs([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load gigs.');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    void loadGigs();
  }, [loadGigs]);

  const metrics = useMemo(() => computeGigDashboardMetrics(gigs), [gigs]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!bandId || !form.title.trim() || !form.startsAt) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const gig = await createGig({
        bandId,
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        venueName: form.venueName,
        status: form.status,
      });
      setShowCreate(false);
      navigate(`/app/${bandId}/gigs/${gig.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create gig.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!bandId) {
    return null;
  }

  if (!canAccessBand) {
    return (
      <div className="gigs-page">
        <div className="panel">
          <p>You do not have access to this band workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gigs-page">
      <SongsBandContextBar
        bandId={bandId}
        bandName={membership?.name}
        sectionNote="Gig pipeline for this band"
        switchPath={(nextBandId) => `/app/${nextBandId}/gigs`}
      />

      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Gig management</p>
          <h1>Track enquiries through to confirmed gigs</h1>
          <p className="my-bands-lead">
            Manage gig status, venue details, and linked setlists as your pipeline progresses.
          </p>
        </div>
        <div className="gigs-header-actions">
          <Link to={`/app/${bandId}/calendar`} className="directory-btn directory-btn-secondary">
            Calendar
          </Link>
          {canManage ? (
            <button type="button" className="auth-button" onClick={() => setShowCreate(true)}>
              New gig
            </button>
          ) : null}
        </div>
      </header>

      <div className="gigs-metrics">
        <article className="gigs-metric-card">
          <span>Active</span>
          <strong>{metrics.active}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Upcoming</span>
          <strong>{metrics.upcoming}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Confirmed</span>
          <strong>{metrics.confirmed}</strong>
        </article>
      </div>

      {!canManage ? <p className="workspace-empty-note">{GIG_LEADER_ONLY_MESSAGE}</p> : null}
      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}

      {showCreate ? (
        <section className="panel gigs-create-panel">
          <h2>New gig</h2>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="auth-field">
              <label htmlFor="gig-title">Title</label>
              <input
                id="gig-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-starts">Date and time</label>
              <input
                id="gig-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startsAt: event.target.value }))
                }
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-venue">Venue</label>
              <input
                id="gig-venue"
                value={form.venueName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, venueName: event.target.value }))
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-status">Status</label>
              <select
                id="gig-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as GigStatus,
                  }))
                }
              >
                {GIG_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatGigStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            {formError ? <div className="auth-message auth-message-error">{formError}</div> : null}
            <div className="gigs-form-actions">
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="auth-button" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create gig'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>All gigs</h2>
        {loading ? <p className="workspace-empty-note">Loading gigs…</p> : null}
        {!loading && gigs.length === 0 ? (
          <p className="workspace-empty-note">No gigs yet.</p>
        ) : null}
        <ul className="gigs-list">
          {gigs.map((gig) => (
            <li key={gig.id}>
              <Link to={`/app/${bandId}/gigs/${gig.id}`} className="gigs-list-item">
                <div>
                  <strong>{gig.title}</strong>
                  <p>
                    {new Date(gig.starts_at).toLocaleString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {gig.venue_name ? ` · ${gig.venue_name}` : ''}
                  </p>
                </div>
                <span className={gigStatusPillClass(gig.status)}>{formatGigStatus(gig.status)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
