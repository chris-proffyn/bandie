import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GIG_LEADER_ONLY_MESSAGE,
  GIG_STATUS_OPTIONS,
  archiveGig,
  formatGigStatus,
  formatSetlistDuration,
  getGig,
  isBandLeaderRole,
  listBandSetlists,
  updateGig,
  type GigStatus,
  type GigWithSetlistContext,
  type SetlistLibraryEntry,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import '../../styles/gigs.css';

export function GigDetailPage() {
  const { bandId, gigId } = useParams();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManage = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [gig, setGig] = useState<GigWithSetlistContext | null>(null);
  const [setlists, setSetlists] = useState<SetlistLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGig = useCallback(async () => {
    if (!bandId || !gigId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [gigRow, setlistRows] = await Promise.all([
        getGig(gigId),
        listBandSetlists(bandId, { includeArchived: false }),
      ]);
      setGig(gigRow);
      setSetlists(setlistRows);
    } catch (err) {
      setGig(null);
      setError(err instanceof Error ? err.message : 'Unable to load gig.');
    } finally {
      setLoading(false);
    }
  }, [bandId, gigId]);

  useEffect(() => {
    void loadGig();
  }, [loadGig]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gigId || !gig) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);

    try {
      await updateGig(gigId, {
        title: String(formData.get('title') ?? ''),
        startsAt: new Date(String(formData.get('startsAt'))).toISOString(),
        venueName: String(formData.get('venueName') ?? ''),
        venueAddress: String(formData.get('venueAddress') ?? ''),
        status: String(formData.get('status')) as GigStatus,
        setlistId: String(formData.get('setlistId') || '') || null,
        notes: String(formData.get('notes') ?? ''),
        feeNotes: String(formData.get('feeNotes') ?? ''),
      });
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save gig.');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!gigId || !window.confirm('Archive this gig?')) {
      return;
    }

    try {
      await archiveGig(gigId);
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive gig.');
    }
  }

  if (!bandId || !gigId) {
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

  if (loading) {
    return <p className="workspace-empty-note">Loading gig…</p>;
  }

  if (!gig) {
    return (
      <div className="gigs-page">
        <div className="panel">
          <p>Gig not found.</p>
          <Link to={`/app/${bandId}/gigs`}>Back to gigs</Link>
        </div>
      </div>
    );
  }

  const startsLocal = new Date(gig.starts_at);
  const startsValue = `${startsLocal.getFullYear()}-${String(startsLocal.getMonth() + 1).padStart(2, '0')}-${String(startsLocal.getDate()).padStart(2, '0')}T${String(startsLocal.getHours()).padStart(2, '0')}:${String(startsLocal.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Gig detail</p>
          <h1>{gig.title}</h1>
          <p className="my-bands-lead">{formatGigStatus(gig.status)}</p>
        </div>
        <Link to={`/app/${bandId}/gigs`} className="directory-btn directory-btn-secondary">
          Back to gigs
        </Link>
      </header>

      {!canManage ? <p className="workspace-empty-note">{GIG_LEADER_ONLY_MESSAGE}</p> : null}
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <section className="panel">
        <form className="auth-form" onSubmit={handleSave}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="gig-title">Title</label>
              <input id="gig-title" name="title" defaultValue={gig.title} disabled={!canManage} />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-starts">Starts</label>
              <input
                id="gig-starts"
                name="startsAt"
                type="datetime-local"
                defaultValue={startsValue}
                disabled={!canManage}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-status">Status</label>
              <select id="gig-status" name="status" defaultValue={gig.status} disabled={!canManage}>
                {GIG_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatGigStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="gig-setlist">Linked setlist</label>
              <select
                id="gig-setlist"
                name="setlistId"
                defaultValue={gig.setlist_id ?? ''}
                disabled={!canManage}
              >
                <option value="">No setlist linked</option>
                {setlists.map((setlist) => (
                  <option key={setlist.id} value={setlist.id}>
                    {setlist.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="gig-venue">Venue name</label>
            <input
              id="gig-venue"
              name="venueName"
              defaultValue={gig.venue_name ?? ''}
              disabled={!canManage}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-address">Venue address</label>
            <input
              id="gig-address"
              name="venueAddress"
              defaultValue={gig.venue_address ?? ''}
              disabled={!canManage}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-notes">Notes</label>
            <textarea id="gig-notes" name="notes" rows={3} defaultValue={gig.notes ?? ''} disabled={!canManage} />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-fee-notes">Fee notes</label>
            <textarea
              id="gig-fee-notes"
              name="feeNotes"
              rows={2}
              defaultValue={gig.fee_notes ?? ''}
              disabled={!canManage}
            />
          </div>

          {gig.setlistMetrics ? (
            <div className="panel surface-light">
              <h3>Setlist readiness</h3>
              <p>
                {gig.setlistTitle}: {gig.setlistMetrics.songCount} songs ·{' '}
                {formatSetlistDuration(gig.setlistMetrics.totalDurationSeconds)} ·{' '}
                {gig.setlistMetrics.readinessPercent}% ready
              </p>
            </div>
          ) : null}

          {canManage ? (
            <div className="gig-detail-actions">
              <button type="submit" className="auth-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="auth-button auth-button-secondary" onClick={() => void handleArchive()}>
                Archive gig
              </button>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}
