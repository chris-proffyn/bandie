import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GIG_STATUS_OPTIONS,
  computeGigDashboardMetrics,
  createOrganiserGig,
  formatGigStatus,
  gigStatusPillClass,
  listOrganiserGigs,
  type GigStatus,
  type OrganiserGig,
} from '@bandie/data';
import '../../styles/gigs.css';

export function OrganiserGigsDashboardPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<OrganiserGig[]>([]);
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
    setLoading(true);
    setLoadError(null);

    try {
      const rows = await listOrganiserGigs();
      setGigs(rows);
    } catch (err) {
      setGigs([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load gigs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGigs();
  }, [loadGigs]);

  const metrics = useMemo(() => computeGigDashboardMetrics(gigs), [gigs]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const gig = await createOrganiserGig({
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        venueName: form.venueName,
        status: form.status,
      });
      setShowCreate(false);
      navigate(`/app/gigs/${gig.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create gig.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Gig management</p>
          <h1>Plan events and invite bands</h1>
          <p className="my-bands-lead">
            Create gigs, choose venues, invite bands and set the running order. Band leaders accept
            invites and assign setlists.
          </p>
        </div>
        <div className="gigs-header-actions">
          <Link to="/app/venues" className="directory-btn directory-btn-secondary">
            My venues
          </Link>
          <button type="button" className="auth-button" onClick={() => setShowCreate(true)}>
            New gig
          </button>
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

      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}

      {showCreate ? (
        <section className="panel gigs-create-panel">
          <h2>New gig</h2>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="auth-field">
              <label htmlFor="organiser-gig-title">Title</label>
              <input
                id="organiser-gig-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="organiser-gig-starts">Date and time</label>
              <input
                id="organiser-gig-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startsAt: event.target.value }))
                }
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="organiser-gig-venue">Venue (optional)</label>
              <input
                id="organiser-gig-venue"
                value={form.venueName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, venueName: event.target.value }))
                }
                placeholder="Or pick a saved venue on the gig detail page"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="organiser-gig-status">Status</label>
              <select
                id="organiser-gig-status"
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
        <h2>Your gigs</h2>
        {loading ? <p className="workspace-empty-note">Loading gigs…</p> : null}
        {!loading && gigs.length === 0 ? (
          <p className="workspace-empty-note">No gigs yet. Create one to invite bands.</p>
        ) : null}
        <ul className="gigs-list">
          {gigs.map((gig) => (
            <li key={gig.id}>
              <Link to={`/app/gigs/${gig.id}`} className="gigs-list-item">
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
