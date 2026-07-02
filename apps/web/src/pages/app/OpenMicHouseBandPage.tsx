import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addOpenMicHouseBandMember,
  addOpenMicPartTemplate,
  deleteOpenMicHouseBandMember,
  deleteOpenMicPartTemplate,
  getOpenMicEvent,
  listOpenMicHouseBandMembers,
  listOpenMicPartTemplates,
  updateOpenMicPartTemplate,
  type OpenMicHouseBandMember,
  type OpenMicPartTemplate,
} from '@bandie/data';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/gigs.css';
import '../../styles/workspace.css';
import '../../styles/openMic.css';

export function OpenMicHouseBandPage() {
  const { eventId } = useParams();
  const [eventTitle, setEventTitle] = useState('');
  const [members, setMembers] = useState<OpenMicHouseBandMember[]>([]);
  const [parts, setParts] = useState<OpenMicPartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ displayName: '', instrument: '', email: '', phone: '' });
  const [partForm, setPartForm] = useState({ slotName: '', required: false });

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [event, memberRows, partRows] = await Promise.all([
        getOpenMicEvent(eventId),
        listOpenMicHouseBandMembers(eventId),
        listOpenMicPartTemplates(eventId),
      ]);
      setEventTitle(event?.title ?? 'Event');
      setMembers(memberRows);
      setParts(partRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load house band.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddMember(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!eventId || !memberForm.displayName.trim() || !memberForm.instrument.trim()) return;
    try {
      await addOpenMicHouseBandMember(eventId, {
        displayName: memberForm.displayName,
        instrument: memberForm.instrument,
        email: memberForm.email || null,
        phone: memberForm.phone || null,
      });
      setMemberForm({ displayName: '', instrument: '', email: '', phone: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add member.');
    }
  }

  async function handleAddPart(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!eventId || !partForm.slotName.trim()) return;
    try {
      await addOpenMicPartTemplate(eventId, {
        slotName: partForm.slotName,
        required: partForm.required,
      });
      setPartForm({ slotName: '', required: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part.');
    }
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">House band & parts</p>
          <HeadingWithHelp
            as="h1"
            helpLabel="About house band and parts"
            help={
              <p>
                Define standard parts for each song and assign house band members to their instruments.
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
            <HeadingWithHelp
              as="h2"
              helpLabel="About house band roster"
              help={
                <p>Members are auto-assigned when songs are added.</p>
              }
            >
              House band roster
            </HeadingWithHelp>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleAddMember}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="hb-name">Name</label>
              <input
                id="hb-name"
                value={memberForm.displayName}
                onChange={(e) => setMemberForm((p) => ({ ...p, displayName: e.target.value }))}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="hb-instrument">Instrument</label>
              <input
                id="hb-instrument"
                value={memberForm.instrument}
                onChange={(e) => setMemberForm((p) => ({ ...p, instrument: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="gig-detail-actions">
            <button type="submit" className="auth-button">
              Add member
            </button>
          </div>
        </form>
        {members.length > 0 ? (
          <div className="open-mic-table-wrap">
            <table className="open-mic-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Instrument</th>
                  <th>Contact</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.display_name}</td>
                    <td>{member.instrument}</td>
                    <td>{member.email ?? member.phone ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary"
                        onClick={() => void deleteOpenMicHouseBandMember(member.id).then(load)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <HeadingWithHelp
              as="h2"
              helpLabel="About standard parts"
              help={
                <p>
                  These parts are created on each new song. Disable per song if not needed (e.g. no keys).
                </p>
              }
            >
              Standard parts
            </HeadingWithHelp>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleAddPart}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="part-name">Part name</label>
              <input
                id="part-name"
                value={partForm.slotName}
                onChange={(e) => setPartForm((p) => ({ ...p, slotName: e.target.value }))}
                placeholder="e.g. Lead guitar"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="part-required">
                <input
                  id="part-required"
                  type="checkbox"
                  checked={partForm.required}
                  onChange={(e) => setPartForm((p) => ({ ...p, required: e.target.checked }))}
                />{' '}
                Required for song readiness
              </label>
            </div>
          </div>
          <div className="gig-detail-actions">
            <button type="submit" className="auth-button">
              Add part
            </button>
          </div>
        </form>
        {parts.length > 0 ? (
          <div className="open-mic-table-wrap">
            <table className="open-mic-table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Required</th>
                  <th>House band</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td>{part.slot_name}</td>
                    <td>{part.required ? 'Yes' : 'No'}</td>
                    <td>
                      <select
                        value={part.house_band_member_id ?? ''}
                        onChange={(e) =>
                          void updateOpenMicPartTemplate(part.id, {
                            houseBandMemberId: e.target.value || null,
                          }).then(load)
                        }
                      >
                        <option value="">— Guest slot —</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.display_name} ({member.instrument})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary"
                        onClick={() => void deleteOpenMicPartTemplate(part.id).then(load)}
                      >
                        Remove
                      </button>
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
