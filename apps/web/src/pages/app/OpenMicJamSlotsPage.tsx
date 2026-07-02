import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  approveJamSignup,
  assignOpenMicJamSlot,
  clearOpenMicJamSlot,
  formatJamSlotStatus,
  generateOpenMicJamSlots,
  getOpenMicEvent,
  listOpenMicJamSignups,
  listOpenMicJamSlots,
  updateOpenMicEvent,
  type OpenMicJamSignup,
  type OpenMicJamSlot,
} from '@bandie/data';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/gigs.css';
import '../../styles/workspace.css';
import '../../styles/openMic.css';

export function OpenMicJamSlotsPage() {
  const { eventId } = useParams();
  const [eventTitle, setEventTitle] = useState('');
  const [slots, setSlots] = useState<OpenMicJamSlot[]>([]);
  const [signups, setSignups] = useState<OpenMicJamSignup[]>([]);
  const [slotCount, setSlotCount] = useState('8');
  const [slotDuration, setSlotDuration] = useState('20');
  const [requiresBandie, setRequiresBandie] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState<Record<string, { bandName: string; contactName: string }>>({});

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [event, slotRows, signupRows] = await Promise.all([
        getOpenMicEvent(eventId),
        listOpenMicJamSlots(eventId),
        listOpenMicJamSignups(eventId),
      ]);
      setEventTitle(event?.title ?? 'Event');
      setSlotCount(String(event?.slot_count ?? 8));
      setSlotDuration(String(event?.default_slot_duration_minutes ?? 20));
      setRequiresBandie(Boolean(event?.requires_bandie_registration));
      setSlots(slotRows);
      setSignups(signupRows.filter((row) => row.status === 'requested'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load jam slots.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveSettings(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!eventId) return;
    try {
      await updateOpenMicEvent(eventId, {
        slotCount: Number(slotCount) || null,
        defaultSlotDurationMinutes: Number(slotDuration) || null,
        requiresBandieRegistration: requiresBandie,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    }
  }

  async function handleGenerate() {
    if (!eventId) return;
    try {
      await updateOpenMicEvent(eventId, {
        slotCount: Number(slotCount) || null,
        defaultSlotDurationMinutes: Number(slotDuration) || null,
      });
      await generateOpenMicJamSlots(eventId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate slots.');
    }
  }

  async function handleAssign(slotId: string) {
    const form = assignForm[slotId];
    if (!form?.bandName.trim()) return;
    try {
      await assignOpenMicJamSlot({
        jamSlotId: slotId,
        bandName: form.bandName,
        contactName: form.contactName || null,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign slot.');
    }
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Jam night slots</p>
          <HeadingWithHelp
            as="h1"
            helpLabel="About jam night slots"
            help={
              <p>
                Set how many performance slots you need, then fill them in advance or on the night.
              </p>
            }
          >
            {eventTitle}
          </HeadingWithHelp>
        </div>
        <Link to={`/app/open-mic/${eventId}`} className="directory-btn directory-btn-secondary">
          Back to event
        </Link>
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading…</p> : null}

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <h2>Slot settings</h2>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleSaveSettings}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="jam-slot-count">Number of slots</label>
              <input
                id="jam-slot-count"
                type="number"
                min={1}
                value={slotCount}
                onChange={(e) => setSlotCount(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="jam-slot-duration">Minutes per slot</label>
              <input
                id="jam-slot-duration"
                type="number"
                min={5}
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
              />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="jam-requires-bandie">
              <input
                id="jam-requires-bandie"
                type="checkbox"
                checked={requiresBandie}
                onChange={(e) => setRequiresBandie(e.target.checked)}
              />{' '}
              Require Bandie sign-in to request a slot (off = guest bands allowed)
            </label>
          </div>
          <div className="gig-detail-actions">
            <button type="submit" className="directory-btn directory-btn-secondary">
              Save settings
            </button>
            <button type="button" className="auth-button" onClick={() => void handleGenerate()}>
              Generate / refresh slots
            </button>
          </div>
        </form>
      </section>

      {signups.length > 0 ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <h2>Pending requests ({signups.length})</h2>
            </div>
          </header>
          <div className="open-mic-table-wrap">
            <table className="open-mic-table">
              <thead>
                <tr>
                  <th>Band</th>
                  <th>Contact</th>
                  <th>Slot</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {signups.map((signup) => (
                  <tr key={signup.id}>
                    <td>{signup.band_name}</td>
                    <td>{signup.contact_name}</td>
                    <td>{signup.jam_slot_id ? 'Specific slot' : 'Any slot'}</td>
                    <td>
                      <button
                        type="button"
                        className="auth-button"
                        onClick={() => void approveJamSignup(signup.id).then(load)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <h2>Performance slots</h2>
            {!loading && slots.length === 0 ? (
              <p className="workspace-section-intro">Generate slots after setting the count above.</p>
            ) : null}
          </div>
        </header>
        {slots.length > 0 ? (
          <div className="open-mic-table-wrap">
            <table className="open-mic-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Band</th>
                  <th>Assign on night</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{slot.slot_number}</td>
                    <td>
                      {slot.starts_at
                        ? new Date(slot.starts_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td>{slot.duration_minutes} min</td>
                    <td>{formatJamSlotStatus(slot.status)}</td>
                    <td>{slot.band_name ?? '—'}</td>
                    <td>
                      {slot.status !== 'filled' ? (
                        <div className="open-mic-inline-assign">
                          <input
                            placeholder="Band name"
                            value={assignForm[slot.id]?.bandName ?? ''}
                            onChange={(e) =>
                              setAssignForm((prev) => ({
                                ...prev,
                                [slot.id]: {
                                  ...prev[slot.id],
                                  bandName: e.target.value,
                                  contactName: prev[slot.id]?.contactName ?? '',
                                },
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="directory-btn directory-btn-secondary"
                            onClick={() => void handleAssign(slot.id)}
                          >
                            Fill
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {slot.band_name ? (
                        <button
                          type="button"
                          className="directory-btn directory-btn-secondary"
                          onClick={() => void clearOpenMicJamSlot(slot.id).then(load)}
                        >
                          Clear
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
