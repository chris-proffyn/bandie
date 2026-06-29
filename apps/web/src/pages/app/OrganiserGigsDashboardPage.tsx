import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GIG_STATUS_OPTIONS,
  computeGigDashboardMetrics,
  createOrganiserGig,
  createOrganiserVenue,
  formatGigStatus,
  formatOrganiserVenueAddress,
  gigStatusPillClass,
  listMyOrganiserVenues,
  listOrganiserGigs,
  type GigStatus,
  type OrganiserGig,
  type OrganiserVenue,
} from '@bandie/data';
import '../../styles/gigs.css';

type VenueChoice = '' | 'new' | string;

export function OrganiserGigsDashboardPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<OrganiserGig[]>([]);
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    startsAt: '',
    venueChoice: '' as VenueChoice,
    newVenueName: '',
    newVenueAddress: '',
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

  const loadVenues = useCallback(async () => {
    try {
      const rows = await listMyOrganiserVenues();
      setVenues(rows);
    } catch {
      setVenues([]);
    }
  }, []);

  useEffect(() => {
    void loadGigs();
  }, [loadGigs]);

  useEffect(() => {
    if (showCreate) {
      void loadVenues();
    }
  }, [showCreate, loadVenues]);

  const metrics = useMemo(() => computeGigDashboardMetrics(gigs), [gigs]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === form.venueChoice) ?? null,
    [form.venueChoice, venues],
  );

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt) {
      return;
    }

    if (form.venueChoice === 'new' && !form.newVenueName.trim()) {
      setFormError('Enter a name for the new venue or choose a saved venue.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      let venueId: string | null = null;
      let venueName: string | null = null;
      let venueAddress: string | null = null;

      if (form.venueChoice === 'new') {
        const venue = await createOrganiserVenue({
          name: form.newVenueName.trim(),
          address_line1: form.newVenueAddress.trim() || null,
        });
        venueId = venue.id;
        venueName = venue.name;
        venueAddress = formatOrganiserVenueAddress(venue);
        await loadVenues();
      } else if (selectedVenue) {
        venueId = selectedVenue.id;
        venueName = selectedVenue.name;
        venueAddress = formatOrganiserVenueAddress(selectedVenue);
      }

      const gig = await createOrganiserGig({
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        venueId,
        venueName,
        venueAddress,
        status: form.status,
      });
      setShowCreate(false);
      setForm({
        title: '',
        startsAt: '',
        venueChoice: '',
        newVenueName: '',
        newVenueAddress: '',
        status: 'enquiry',
      });
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
              <select
                id="organiser-gig-venue"
                value={form.venueChoice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    venueChoice: event.target.value as VenueChoice,
                  }))
                }
              >
                <option value="">No venue yet</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                    {venue.city ? ` · ${venue.city}` : ''}
                  </option>
                ))}
                <option value="new">Add new venue…</option>
              </select>
            </div>
            {form.venueChoice === 'new' ? (
              <>
                <div className="auth-field">
                  <label htmlFor="organiser-gig-new-venue-name">New venue name</label>
                  <input
                    id="organiser-gig-new-venue-name"
                    value={form.newVenueName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, newVenueName: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="organiser-gig-new-venue-address">Address (optional)</label>
                  <input
                    id="organiser-gig-new-venue-address"
                    value={form.newVenueAddress}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, newVenueAddress: event.target.value }))
                    }
                    placeholder="Street, city or postcode"
                  />
                </div>
                <p className="workspace-empty-note">
                  The venue will be saved to My venues and linked to this gig.
                </p>
              </>
            ) : selectedVenue ? (
              <p className="workspace-empty-note">
                {formatOrganiserVenueAddress(selectedVenue) ?? 'No address saved for this venue.'}
              </p>
            ) : null}
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
