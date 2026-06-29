import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GIG_ORGANISER_ONLY_MESSAGE,
  computeBandGigInviteMetrics,
  formatGigInviteStatus,
  formatGigStatus,
  gigInviteStatusPillClass,
  listBandGigInvitations,
  type BandGigInvitation,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/gigs.css';

export function GigsDashboardPage() {
  const { bandId } = useParams();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;

  const [invitations, setInvitations] = useState<BandGigInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const rows = await listBandGigInvitations(bandId);
      setInvitations(rows);
    } catch (err) {
      setInvitations([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load gig invitations.');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  const metrics = useMemo(() => computeBandGigInviteMetrics(invitations), [invitations]);

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
        sectionNote="Gig invitations for this band"
        switchPath={(nextBandId) => `/app/${nextBandId}/gigs`}
      />

      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Gig invitations</p>
          <h1>Organiser invites and setlists</h1>
          <p className="my-bands-lead">
            Organisers create gigs and invite your band. Band leaders accept or reject invites and
            assign a setlist from your library.
          </p>
        </div>
        <div className="gigs-header-actions">
          <Link to={`/app/${bandId}/setlists`} className="directory-btn directory-btn-secondary">
            Setlists
          </Link>
          <Link to={`/app/${bandId}/calendar`} className="directory-btn directory-btn-secondary">
            Calendar
          </Link>
        </div>
      </header>

      <p className="workspace-empty-note">{GIG_ORGANISER_ONLY_MESSAGE}</p>

      <div className="gigs-metrics">
        <article className="gigs-metric-card">
          <span>Pending</span>
          <strong>{metrics.pending}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Accepted</span>
          <strong>{metrics.accepted}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Upcoming</span>
          <strong>{metrics.upcoming}</strong>
        </article>
      </div>

      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}

      <section className="panel">
        <h2>All invitations</h2>
        {loading ? <p className="workspace-empty-note">Loading invitations…</p> : null}
        {!loading && invitations.length === 0 ? (
          <p className="workspace-empty-note">No gig invitations yet.</p>
        ) : null}
        <ul className="gigs-list">
          {invitations.map((item) => (
            <li key={item.invite.id}>
              <Link to={`/app/${bandId}/gigs/${item.gig.id}`} className="gigs-list-item">
                <div>
                  <strong>{item.gig.title}</strong>
                  <p>
                    {new Date(item.gig.starts_at).toLocaleString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {item.gig.venue_name ? ` · ${item.gig.venue_name}` : ''}
                    {' · '}
                    {formatGigStatus(item.gig.status)}
                  </p>
                </div>
                <span className={gigInviteStatusPillClass(item.invite.invite_status)}>
                  {formatGigInviteStatus(item.invite.invite_status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
