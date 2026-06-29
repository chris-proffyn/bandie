import { Link } from 'react-router-dom';
import {
  formatGigInviteStatus,
  formatSlotDuration,
  formatSlotTimeRange,
  type GigBandInviteWithBand,
  type GigSlotScheduleEntry,
  type OrganiserGigDetail,
} from '@bandie/data';
import { buildFindGigUrl } from '../../lib/findGigNavigation';

type GigLineupSectionProps = {
  gig: OrganiserGigDetail;
  slotSchedule: GigSlotScheduleEntry[];
  isConfirmed: boolean;
  onSlotUpdate: (gigBandId: string, slotNumber: string, slotDuration: string) => void;
  onCancelInvite: (gigBandId: string) => void;
};

const ACTIVE_INVITE_STATUSES = new Set(['pending', 'accepted']);

function inviteCounts(bands: GigBandInviteWithBand[]) {
  return bands.reduce(
    (counts, band) => {
      if (band.invite_status === 'pending') counts.pending += 1;
      if (band.invite_status === 'accepted') counts.accepted += 1;
      if (band.invite_status === 'rejected') counts.rejected += 1;
      if (band.invite_status === 'cancelled') counts.cancelled += 1;
      return counts;
    },
    { pending: 0, accepted: 0, rejected: 0, cancelled: 0 },
  );
}

export function GigLineupSection({
  gig,
  slotSchedule,
  isConfirmed,
  onSlotUpdate,
  onCancelInvite,
}: GigLineupSectionProps) {
  const activeBands = gig.bands.filter((band) => ACTIVE_INVITE_STATUSES.has(band.invite_status));
  const inactiveBands = gig.bands.filter((band) => !ACTIVE_INVITE_STATUSES.has(band.invite_status));
  const counts = inviteCounts(gig.bands);

  return (
    <section className="panel workspace-section gig-lineup-section">
      <header className="workspace-section-header">
        <div>
          <p className="gig-step-eyebrow">Steps 4–6</p>
          <h2>Bands & running order</h2>
          <p className="workspace-section-intro">
            Invite bands from the directory, track responses, and fine-tune slot positions and
            durations.
          </p>
        </div>
        {!isConfirmed ? (
          <Link
            to={buildFindGigUrl({ gigId: gig.id, gigTitle: gig.title })}
            className="auth-button gig-lineup-find-btn"
          >
            Find bands
          </Link>
        ) : null}
      </header>

      {gig.bands.length > 0 ? (
        <div className="gig-lineup-summary" aria-label="Invite summary">
          {counts.pending > 0 ? (
            <span className="gig-lineup-summary-chip gig-lineup-summary-chip-pending">
              {counts.pending} pending
            </span>
          ) : null}
          {counts.accepted > 0 ? (
            <span className="gig-lineup-summary-chip gig-lineup-summary-chip-accepted">
              {counts.accepted} accepted
            </span>
          ) : null}
          {counts.rejected > 0 ? (
            <span className="gig-lineup-summary-chip gig-lineup-summary-chip-muted">
              {counts.rejected} rejected
            </span>
          ) : null}
          {counts.cancelled > 0 ? (
            <span className="gig-lineup-summary-chip gig-lineup-summary-chip-muted">
              {counts.cancelled} cancelled
            </span>
          ) : null}
        </div>
      ) : null}

      {!isConfirmed ? (
        <div className="gig-action-card">
          <div>
            <strong>Browse the band directory</strong>
            <p>
              Open band profiles, review fees and availability, then send an invite with your gig,
              venue, and contact details. Band leaders are notified in communications.
            </p>
          </div>
          <Link
            to={buildFindGigUrl({ gigId: gig.id, gigTitle: gig.title })}
            className="directory-btn directory-btn-dark"
          >
            Open directory
          </Link>
        </div>
      ) : null}

      {activeBands.length === 0 && inactiveBands.length === 0 ? (
        <div className="gig-lineup-empty">
          <strong>No bands invited yet</strong>
          <p>Use Find bands to search the directory and send your first invite.</p>
        </div>
      ) : null}

      {activeBands.length > 0 ? (
        <div className="gig-lineup-block">
          <h3 className="gig-lineup-block-title">Lineup</h3>
          <ul className="gig-lineup-list">
            {activeBands.map((invite) => {
              const schedule = slotSchedule.find((entry) => entry.invite.id === invite.id);
              const canEdit = !isConfirmed;

              return (
                <li key={invite.id}>
                  <article className={`gig-lineup-card gig-lineup-card-${invite.invite_status}`}>
                    <div className="gig-lineup-card-main">
                      <div
                        className="gig-lineup-slot-badge"
                        aria-label={invite.running_order ? `Slot ${invite.running_order}` : 'Unassigned slot'}
                      >
                        {invite.running_order ?? '—'}
                      </div>

                      <div className="gig-lineup-band">
                        <div className="gig-lineup-band-head">
                          <strong>{invite.bandName}</strong>
                          <span className={`gig-invite-status gig-invite-status-${invite.invite_status}`}>
                            {formatGigInviteStatus(invite.invite_status)}
                          </span>
                        </div>
                        <p className="gig-lineup-meta">
                          {schedule ? (
                            <>
                              {formatSlotTimeRange(schedule.startsAt, schedule.endsAt)}
                              {' · '}
                              {formatSlotDuration(schedule.durationMinutes)}
                            </>
                          ) : invite.running_order ? (
                            'Slot assigned — save structure to preview times'
                          ) : (
                            'No slot assigned yet'
                          )}
                          {invite.setlistTitle ? ` · Setlist: ${invite.setlistTitle}` : ''}
                        </p>
                      </div>
                    </div>

                    {canEdit ? (
                      <div className="gig-lineup-card-controls">
                        <label className="gig-lineup-field">
                          <span>Slot</span>
                          <input
                            type="number"
                            min={1}
                            max={gig.slot_count ?? undefined}
                            defaultValue={invite.running_order ?? ''}
                            placeholder="—"
                            onBlur={(event) =>
                              onSlotUpdate(
                                invite.id,
                                event.target.value,
                                String(invite.slot_duration_minutes ?? ''),
                              )
                            }
                          />
                        </label>
                        <label className="gig-lineup-field">
                          <span>Duration</span>
                          <input
                            type="number"
                            min={5}
                            step={5}
                            defaultValue={
                              invite.slot_duration_minutes ?? gig.default_slot_duration_minutes ?? ''
                            }
                            placeholder={gig.default_slot_duration_minutes ? String(gig.default_slot_duration_minutes) : '45'}
                            onBlur={(event) =>
                              onSlotUpdate(
                                invite.id,
                                String(invite.running_order ?? ''),
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        {invite.invite_status === 'pending' ? (
                          <button
                            type="button"
                            className="directory-btn directory-btn-secondary gig-lineup-cancel-btn"
                            onClick={() => onCancelInvite(invite.id)}
                          >
                            Cancel invite
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {inactiveBands.length > 0 ? (
        <details className="gig-lineup-inactive">
          <summary>
            Removed invites ({inactiveBands.length})
          </summary>
          <ul className="gig-lineup-inactive-list">
            {inactiveBands.map((invite) => (
              <li key={invite.id}>
                <span>{invite.bandName}</span>
                <span className={`gig-invite-status gig-invite-status-${invite.invite_status}`}>
                  {formatGigInviteStatus(invite.invite_status)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {slotSchedule.length > 0 ? (
        <div className="gig-running-order">
          <h3 className="gig-lineup-block-title">Running order preview</h3>
          <ol className="gig-running-order-list">
            {slotSchedule.map((entry) => (
              <li key={entry.invite.id}>
                <span className="gig-running-order-slot">{entry.slotNumber}</span>
                <div className="gig-running-order-body">
                  <strong>{entry.invite.bandName}</strong>
                  <span>
                    {formatSlotTimeRange(entry.startsAt, entry.endsAt)} ·{' '}
                    {formatSlotDuration(entry.durationMinutes)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
