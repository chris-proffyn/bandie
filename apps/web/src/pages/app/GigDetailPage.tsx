import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GIG_BAND_LEADER_MESSAGE,
  assignGigSetlist,
  formatGigInviteStatus,
  formatGigStatus,
  formatSetlistDuration,
  getBandGigInvitation,
  gigInviteStatusPillClass,
  isBandLeaderRole,
  listBandSetlists,
  respondToGigInvitation,
  type BandGigInvitation,
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

  const [invitation, setInvitation] = useState<BandGigInvitation | null>(null);
  const [setlists, setSetlists] = useState<SetlistLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvitation = useCallback(async () => {
    if (!bandId || !gigId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [invitationRow, setlistRows] = await Promise.all([
        getBandGigInvitation(bandId, gigId),
        listBandSetlists(bandId, { includeArchived: false }),
      ]);
      setInvitation(invitationRow);
      setSetlists(setlistRows);
    } catch (err) {
      setInvitation(null);
      setError(err instanceof Error ? err.message : 'Unable to load gig invitation.');
    } finally {
      setLoading(false);
    }
  }, [bandId, gigId]);

  useEffect(() => {
    void loadInvitation();
  }, [loadInvitation]);

  async function handleAssignSetlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const setlistId = String(formData.get('setlistId') || '') || null;

    setSaving(true);
    setError(null);

    try {
      await assignGigSetlist(invitation.invite.id, setlistId);
      await loadInvitation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign setlist.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRespond(accept: boolean) {
    if (!invitation) {
      return;
    }

    setResponding(true);
    setError(null);

    try {
      await respondToGigInvitation(invitation.invite.id, accept);
      await loadInvitation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to respond to invite.');
    } finally {
      setResponding(false);
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

  if (!invitation) {
    return (
      <div className="gigs-page">
        <div className="panel">
          <p>Gig invitation not found.</p>
          <Link to={`/app/${bandId}/gigs`}>Back to gig invitations</Link>
        </div>
      </div>
    );
  }

  const { gig, invite } = invitation;
  const isPending = invite.invite_status === 'pending';
  const isAccepted = invite.invite_status === 'accepted';

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Gig invitation</p>
          <h1>{gig.title}</h1>
          <p className="my-bands-lead">
            {formatGigStatus(gig.status)} ·{' '}
            <span className={gigInviteStatusPillClass(invite.invite_status)}>
              {formatGigInviteStatus(invite.invite_status)}
            </span>
          </p>
        </div>
        <Link to={`/app/${bandId}/gigs`} className="directory-btn directory-btn-secondary">
          Back to invitations
        </Link>
      </header>

      {!canManage ? <p className="workspace-empty-note">{GIG_BAND_LEADER_MESSAGE}</p> : null}
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <section className="panel">
        <h2>Event details</h2>
        <dl className="gig-readonly-details">
          <div>
            <dt>When</dt>
            <dd>
              {new Date(gig.starts_at).toLocaleString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
          {gig.venue_name ? (
            <div>
              <dt>Venue</dt>
              <dd>{gig.venue_name}</dd>
            </div>
          ) : null}
          {gig.venue_address ? (
            <div>
              <dt>Address</dt>
              <dd>{gig.venue_address}</dd>
            </div>
          ) : null}
          {gig.notes ? (
            <div>
              <dt>Notes</dt>
              <dd>{gig.notes}</dd>
            </div>
          ) : null}
          {gig.fee_notes ? (
            <div>
              <dt>Fee notes</dt>
              <dd>{gig.fee_notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {canManage && isPending ? (
        <section className="panel">
          <h2>Respond to invite</h2>
          <p className="workspace-empty-note">
            Accept to confirm your band for this gig, or reject if you cannot play.
          </p>
          <div className="gig-detail-actions">
            <button
              type="button"
              className="auth-button"
              disabled={responding}
              onClick={() => void handleRespond(true)}
            >
              {responding ? 'Saving…' : 'Accept invite'}
            </button>
            <button
              type="button"
              className="auth-button auth-button-secondary"
              disabled={responding}
              onClick={() => void handleRespond(false)}
            >
              Reject invite
            </button>
          </div>
        </section>
      ) : null}

      {isAccepted ? (
        <section className="panel">
          <h2>Setlist for this gig</h2>
          {canManage ? (
            <form className="auth-form" onSubmit={handleAssignSetlist}>
              <div className="auth-field">
                <label htmlFor="gig-setlist">Linked setlist</label>
                <select id="gig-setlist" name="setlistId" defaultValue={invite.setlist_id ?? ''}>
                  <option value="">No setlist linked</option>
                  {setlists.map((setlist) => (
                    <option key={setlist.id} value={setlist.id}>
                      {setlist.title}
                    </option>
                  ))}
                </select>
              </div>

              {invitation.setlistMetrics ? (
                <div className="panel surface-light">
                  <h3>Setlist readiness</h3>
                  <p>
                    {invitation.setlistTitle}: {invitation.setlistMetrics.songCount} songs ·{' '}
                    {formatSetlistDuration(invitation.setlistMetrics.totalDurationSeconds)} ·{' '}
                    {invitation.setlistMetrics.readinessPercent}% ready
                  </p>
                </div>
              ) : null}

              <button type="submit" className="auth-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save setlist'}
              </button>
            </form>
          ) : (
            <p className="workspace-empty-note">
              {invitation.setlistTitle
                ? `Setlist: ${invitation.setlistTitle}`
                : 'No setlist assigned yet.'}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
