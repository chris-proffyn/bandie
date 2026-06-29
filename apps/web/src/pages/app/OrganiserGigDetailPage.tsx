import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GIG_STATUS_OPTIONS,
  archiveOrganiserGig,
  cancelGigBandInvite,
  filterDirectoryBands,
  formatGigInviteStatus,
  formatGigStatus,
  formatOrganiserVenueAddress,
  getOrganiserGig,
  gigInviteStatusPillClass,
  inviteBandToGig,
  listMyOrganiserVenues,
  listPublishedBandsForDirectory,
  DEFAULT_DIRECTORY_FILTERS,
  updateGigBandRunningOrder,
  updateOrganiserGig,
  type DirectoryBandListing,
  type GigStatus,
  type OrganiserGigDetail,
  type OrganiserVenue,
} from '@bandie/data';
import '../../styles/gigs.css';

export function OrganiserGigDetailPage() {
  const { gigId: resolvedGigId } = useParams();

  const [gig, setGig] = useState<OrganiserGigDetail | null>(null);
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [directoryBands, setDirectoryBands] = useState<DirectoryBandListing[]>([]);
  const [bandSearch, setBandSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGig = useCallback(async () => {
    if (!resolvedGigId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [gigRow, venueRows, bandRows] = await Promise.all([
        getOrganiserGig(resolvedGigId),
        listMyOrganiserVenues(),
        listPublishedBandsForDirectory(),
      ]);
      setGig(gigRow);
      setVenues(venueRows);
      setDirectoryBands(bandRows);
    } catch (err) {
      setGig(null);
      setError(err instanceof Error ? err.message : 'Unable to load gig.');
    } finally {
      setLoading(false);
    }
  }, [resolvedGigId]);

  useEffect(() => {
    void loadGig();
  }, [loadGig]);

  const invitedBandIds = useMemo(
    () => new Set((gig?.bands ?? []).map((item) => item.band_id)),
    [gig?.bands],
  );

  const bandOptions = useMemo(() => {
    const available = directoryBands.filter((band) => !invitedBandIds.has(band.id));
    if (!bandSearch.trim()) {
      return available.slice(0, 12);
    }
    return filterDirectoryBands(available, {
      ...DEFAULT_DIRECTORY_FILTERS,
      name: bandSearch.trim(),
    }).slice(0, 12);
  }, [bandSearch, directoryBands, invitedBandIds]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedGigId || !gig) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const venueId = String(formData.get('venueId') || '') || null;
    const selectedVenue = venueId ? venues.find((venue) => venue.id === venueId) : null;

    setSaving(true);
    setError(null);

    try {
      await updateOrganiserGig(resolvedGigId, {
        title: String(formData.get('title') ?? ''),
        startsAt: new Date(String(formData.get('startsAt'))).toISOString(),
        venueId,
        venueName: selectedVenue?.name ?? String(formData.get('venueName') ?? ''),
        venueAddress:
          (selectedVenue ? formatOrganiserVenueAddress(selectedVenue) : null) ??
          String(formData.get('venueAddress') ?? ''),
        status: String(formData.get('status')) as GigStatus,
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

  async function handleInviteBand(bandId: string) {
    if (!resolvedGigId) {
      return;
    }

    setInviting(true);
    setError(null);

    try {
      await inviteBandToGig(resolvedGigId, bandId);
      setBandSearch('');
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to invite band.');
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvite(gigBandId: string) {
    if (!window.confirm('Cancel this band invitation?')) {
      return;
    }

    try {
      await cancelGigBandInvite(gigBandId);
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel invite.');
    }
  }

  async function handleRunningOrderChange(gigBandId: string, value: string) {
    if (!resolvedGigId) {
      return;
    }

    const runningOrder = value ? Number(value) : null;
    try {
      await updateGigBandRunningOrder(resolvedGigId, [{ gigBandId, runningOrder }]);
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update running order.');
    }
  }

  async function handleArchive() {
    if (!resolvedGigId || !window.confirm('Archive this gig?')) {
      return;
    }

    try {
      await archiveOrganiserGig(resolvedGigId);
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive gig.');
    }
  }

  if (loading) {
    return <p className="workspace-empty-note">Loading gig…</p>;
  }

  if (!gig) {
    return (
      <div className="gigs-page">
        <div className="panel">
          <p>Gig not found.</p>
          <Link to="/app/gigs">Back to gigs</Link>
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
        <Link to="/app/gigs" className="directory-btn directory-btn-secondary">
          Back to gigs
        </Link>
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <section className="panel">
        <h2>Event details</h2>
        <form className="auth-form" onSubmit={handleSave}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="gig-title">Title</label>
              <input id="gig-title" name="title" defaultValue={gig.title} />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-starts">Starts</label>
              <input id="gig-starts" name="startsAt" type="datetime-local" defaultValue={startsValue} />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-status">Status</label>
              <select id="gig-status" name="status" defaultValue={gig.status}>
                {GIG_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatGigStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="gig-venue-id">Saved venue</label>
              <select id="gig-venue-id" name="venueId" defaultValue={gig.venue_id ?? ''}>
                <option value="">No saved venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="gig-venue">Venue name</label>
            <input id="gig-venue" name="venueName" defaultValue={gig.venue_name ?? ''} />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-address">Venue address</label>
            <input id="gig-address" name="venueAddress" defaultValue={gig.venue_address ?? ''} />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-notes">Notes</label>
            <textarea id="gig-notes" name="notes" rows={3} defaultValue={gig.notes ?? ''} />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-fee-notes">Fee notes</label>
            <textarea id="gig-fee-notes" name="feeNotes" rows={2} defaultValue={gig.fee_notes ?? ''} />
          </div>

          <div className="gig-detail-actions">
            <button type="submit" className="auth-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="auth-button auth-button-secondary" onClick={() => void handleArchive()}>
              Archive gig
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Bands and running order</h2>
        <p className="workspace-empty-note">
          Invite bands from the directory. Band leaders accept or reject; they assign setlists after accepting.
        </p>

        <div className="auth-field">
          <label htmlFor="band-search">Find band to invite</label>
          <input
            id="band-search"
            value={bandSearch}
            onChange={(event) => setBandSearch(event.target.value)}
            placeholder="Search by band name"
          />
        </div>

        {bandOptions.length > 0 ? (
          <ul className="gigs-band-picker">
            {bandOptions.map((band) => (
              <li key={band.id}>
                <div>
                  <strong>{band.name}</strong>
                  {band.location ? <p>{band.location}</p> : null}
                </div>
                <button
                  type="button"
                  className="directory-btn directory-btn-secondary"
                  disabled={inviting}
                  onClick={() => void handleInviteBand(band.id)}
                >
                  Invite
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="workspace-empty-note">No matching bands to invite.</p>
        )}

        {gig.bands.length === 0 ? (
          <p className="workspace-empty-note">No bands invited yet.</p>
        ) : (
          <ul className="gigs-list gigs-invite-list">
            {gig.bands.map((invite) => (
              <li key={invite.id}>
                <div className="gigs-invite-row">
                  <div>
                    <strong>{invite.bandName}</strong>
                    <p>
                      {formatGigInviteStatus(invite.invite_status)}
                      {invite.setlistTitle ? ` · Setlist: ${invite.setlistTitle}` : ''}
                    </p>
                  </div>
                  <span className={gigInviteStatusPillClass(invite.invite_status)}>
                    {formatGigInviteStatus(invite.invite_status)}
                  </span>
                </div>
                <div className="gigs-invite-controls">
                  <label>
                    Running order
                    <input
                      type="number"
                      min={1}
                      defaultValue={invite.running_order ?? ''}
                      onBlur={(event) =>
                        void handleRunningOrderChange(invite.id, event.target.value)
                      }
                    />
                  </label>
                  {invite.invite_status === 'pending' ? (
                    <button
                      type="button"
                      className="auth-button auth-button-secondary"
                      onClick={() => void handleCancelInvite(invite.id)}
                    >
                      Cancel invite
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
