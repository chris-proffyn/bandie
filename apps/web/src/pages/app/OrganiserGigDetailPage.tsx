import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  archiveOrganiserGig,
  buildGigSlotSchedule,
  buildGigWorkflowSteps,
  canConfirmOrganiserGig,
  cancelGigBandInvite,
  confirmOrganiserGig,
  formatGigStatus,
  formatOrganiserVenueAddress,
  getOrganiserGig,
  gigStatusPillClass,
  listMyOrganiserVenues,
  reopenOrganiserGig,
  updateGigBandSlot,
  updateOrganiserGig,
  type OrganiserGigDetail,
  type OrganiserVenue,
} from '@bandie/data';
import { GigLineupSection } from '../../components/gigs/GigLineupSection';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/gigs.css';

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const value = new Date(iso);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export function OrganiserGigDetailPage() {
  const { gigId: resolvedGigId } = useParams();

  const [gig, setGig] = useState<OrganiserGigDetail | null>(null);
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGig = useCallback(async () => {
    if (!resolvedGigId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [gigRow, venueRows] = await Promise.all([
        getOrganiserGig(resolvedGigId),
        listMyOrganiserVenues(),
      ]);
      setGig(gigRow);
      setVenues(venueRows);
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

  const workflowSteps = useMemo(
    () => (gig ? buildGigWorkflowSteps(gig, gig.bands) : []),
    [gig],
  );

  const slotSchedule = useMemo(
    () => (gig ? buildGigSlotSchedule(gig, gig.bands) : []),
    [gig],
  );

  const confirmReady = gig ? canConfirmOrganiserGig(gig, gig.bands) : false;
  const isConfirmed = gig?.status === 'confirmed';

  async function handleSaveBasics(event: FormEvent<HTMLFormElement>) {
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
        notes: String(formData.get('notes') ?? ''),
        feeNotes: String(formData.get('feeNotes') ?? ''),
        status: gig.status === 'confirmed' ? 'confirmed' : 'enquiry',
      });
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save gig.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveStructure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedGigId || !gig) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);

    try {
      await updateOrganiserGig(resolvedGigId, {
        startsAt: new Date(String(formData.get('showStartsAt'))).toISOString(),
        endsAt: new Date(String(formData.get('showEndsAt'))).toISOString(),
        slotCount: Number(formData.get('slotCount')),
        defaultSlotDurationMinutes: Number(formData.get('defaultSlotDurationMinutes')),
        status: gig.status === 'confirmed' ? 'confirmed' : 'proposed',
      });
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save structure.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSlotUpdate(
    gigBandId: string,
    slotNumber: string,
    slotDuration: string,
  ) {
    if (!resolvedGigId) {
      return;
    }

    try {
      await updateGigBandSlot(resolvedGigId, {
        gigBandId,
        slotNumber: slotNumber ? Number(slotNumber) : null,
        slotDurationMinutes: slotDuration ? Number(slotDuration) : null,
      });
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update slot.');
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

  async function handleConfirm() {
    if (!resolvedGigId) {
      return;
    }

    try {
      await confirmOrganiserGig(resolvedGigId);
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to confirm gig.');
    }
  }

  async function handleReopen() {
    if (!resolvedGigId) {
      return;
    }

    try {
      await reopenOrganiserGig(resolvedGigId);
      await loadGig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to re-open gig.');
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

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Gig planning</p>
          <h1>{gig.title}</h1>
          <p className="my-bands-lead">
            <span className={gigStatusPillClass(gig.status)}>{formatGigStatus(gig.status)}</span>
          </p>
        </div>
        <Link to="/app/gigs" className="directory-btn directory-btn-secondary">
          Back to gigs
        </Link>
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <section className="panel workspace-section gig-workflow-panel">
        <header className="workspace-section-header">
          <div>
            <HeadingWithHelp
              as="h2"
              helpLabel="About planning progress"
              help={
                <p>Work through each step — you can revisit earlier steps until the gig is confirmed.</p>
              }
            >
              Planning progress
            </HeadingWithHelp>
          </div>
        </header>
        <ol className="gig-workflow-track">
          {workflowSteps.map((step, index) => (
            <li
              key={step.id}
              className={`gig-workflow-track-step ${step.complete ? 'gig-workflow-track-step-complete' : ''}`}
            >
              <span className="gig-workflow-track-number" aria-hidden="true">
                {step.complete ? '✓' : index + 1}
              </span>
              <span className="gig-workflow-track-label">{step.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <p className="gig-step-eyebrow">Step 1</p>
            <HeadingWithHelp
              as="h2"
              helpLabel="About gig placeholder"
              help={
                <p>Start with a title and event date. Refine show times in the structure step.</p>
              }
            >
              Gig placeholder
            </HeadingWithHelp>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleSaveBasics}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="gig-title">Title</label>
              <input id="gig-title" name="title" defaultValue={gig.title} disabled={isConfirmed} />
            </div>
            <div className="auth-field">
              <label htmlFor="gig-starts">Event date / show start</label>
              <input
                id="gig-starts"
                name="startsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(gig.starts_at)}
                disabled={isConfirmed}
              />
            </div>
          </div>
          {!isConfirmed ? (
            <div className="gig-detail-actions">
              <button type="submit" className="auth-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save placeholder'}
              </button>
            </div>
          ) : null}
        </form>
      </section>

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <p className="gig-step-eyebrow">Step 2</p>
            <HeadingWithHelp
              as="h2"
              helpLabel="About venue"
              help={<p>Choose a saved venue or enter details for this gig.</p>}
            >
              Venue
            </HeadingWithHelp>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleSaveBasics}>
          <div className="auth-field">
            <label htmlFor="gig-venue-id">Saved venue</label>
            <select id="gig-venue-id" name="venueId" defaultValue={gig.venue_id ?? ''} disabled={isConfirmed}>
              <option value="">No saved venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="gig-venue">Venue name</label>
            <input id="gig-venue" name="venueName" defaultValue={gig.venue_name ?? ''} disabled={isConfirmed} />
          </div>
          <div className="auth-field">
            <label htmlFor="gig-address">Venue address</label>
            <input id="gig-address" name="venueAddress" defaultValue={gig.venue_address ?? ''} disabled={isConfirmed} />
          </div>
          <input type="hidden" name="title" value={gig.title} />
          <input type="hidden" name="startsAt" value={toDatetimeLocalValue(gig.starts_at)} />
          {!isConfirmed ? (
            <div className="gig-detail-actions">
              <button type="submit" className="auth-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save venue'}
              </button>
              <Link to="/app/venues" className="directory-btn directory-btn-secondary">
                Manage venues
              </Link>
            </div>
          ) : null}
        </form>
      </section>

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <p className="gig-step-eyebrow">Step 3</p>
            <HeadingWithHelp
              as="h2"
              helpLabel="About gig structure"
              help={
                <p>Set show start and end, number of slots, and default slot duration.</p>
              }
            >
              Gig structure
            </HeadingWithHelp>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleSaveStructure}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="show-starts">Show start</label>
              <input
                id="show-starts"
                name="showStartsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(gig.starts_at)}
                disabled={isConfirmed}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="show-ends">Show end</label>
              <input
                id="show-ends"
                name="showEndsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(gig.ends_at)}
                disabled={isConfirmed}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="slot-count">Number of slots</label>
              <input
                id="slot-count"
                name="slotCount"
                type="number"
                min={1}
                defaultValue={gig.slot_count ?? ''}
                disabled={isConfirmed}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="slot-duration">Default slot duration (minutes)</label>
              <input
                id="slot-duration"
                name="defaultSlotDurationMinutes"
                type="number"
                min={5}
                step={5}
                defaultValue={gig.default_slot_duration_minutes ?? 45}
                disabled={isConfirmed}
                required
              />
            </div>
          </div>
          {!isConfirmed ? (
            <button type="submit" className="auth-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save structure'}
            </button>
          ) : null}
        </form>
      </section>

      <GigLineupSection
        gig={gig}
        slotSchedule={slotSchedule}
        isConfirmed={isConfirmed}
        onSlotUpdate={(gigBandId, slotNumber, slotDuration) =>
          void handleSlotUpdate(gigBandId, slotNumber, slotDuration)
        }
        onCancelInvite={(gigBandId) => void handleCancelInvite(gigBandId)}
      />

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <p className="gig-step-eyebrow">Step 7</p>
            <h2>Confirm gig</h2>
          </div>
        </header>
        {isConfirmed ? (
          <>
            <p className="workspace-empty-note">This gig is confirmed. Re-open it to change structure or lineup.</p>
            <div className="gig-detail-actions">
              <button type="button" className="auth-button auth-button-secondary" onClick={() => void handleReopen()}>
                Re-open for planning
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="workspace-empty-note">
              Confirm when venue, structure, accepted bands, and slot positions are ready.
            </p>
            <div className="gig-detail-actions">
              <button
                type="button"
                className="auth-button"
                disabled={!confirmReady}
                onClick={() => void handleConfirm()}
              >
                Mark as confirmed
              </button>
              <button type="button" className="auth-button auth-button-secondary" onClick={() => void handleArchive()}>
                Archive gig
              </button>
            </div>
          </>
        )}
      </section>

      {isConfirmed ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <p className="gig-step-eyebrow">Step 8</p>
              <HeadingWithHelp
                as="h2"
                helpLabel="About band branding"
                help={<p>Branding is pulled from each accepted band&apos;s public profile.</p>}
              >
                Band branding
              </HeadingWithHelp>
            </div>
          </header>
          <ul className="gig-branding-grid">
            {gig.bands
              .filter((band) => band.invite_status === 'accepted')
              .map((band) => (
                <li key={band.id} className="gig-branding-card">
                  {band.bandHeroImageUrl ? (
                    <img src={band.bandHeroImageUrl} alt="" className="gig-branding-hero" />
                  ) : null}
                  <div className="gig-branding-body">
                    {band.bandLogoUrl ? (
                      <img src={band.bandLogoUrl} alt="" className="gig-band-logo gig-band-logo-large" />
                    ) : (
                      <span className="gig-band-logo-fallback">{band.bandName.slice(0, 1)}</span>
                    )}
                    <div>
                      <strong>{band.bandName}</strong>
                      {band.bandTagline ? <p>{band.bandTagline}</p> : null}
                      {band.running_order ? <p>Slot {band.running_order}</p> : null}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
