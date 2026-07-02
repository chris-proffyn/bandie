import { useEffect, useState, type FormEvent } from 'react';
import {
  getCurrentUserProfile,
  listBandLeaders,
  updateUserProfile,
  type BandLeaderSummary,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { HeadingWithHelp } from '../ui/InfoHelp';

type BandLeaderSectionProps = {
  bandId: string;
  canEditContact: boolean;
};

export function BandLeaderSection({ bandId, canEditContact }: BandLeaderSectionProps) {
  const { session, refreshProfile } = useAuth();
  const [leaders, setLeaders] = useState<BandLeaderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const currentUserId = session?.user?.id ?? '';
  const isCurrentUserLeader = leaders.some((leader) => leader.userId === currentUserId);
  const primaryLeader = leaders.find((leader) => leader.isPrimary) ?? leaders[0] ?? null;

  useEffect(() => {
    setLoading(true);
    listBandLeaders(bandId)
      .then(setLeaders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load band leaders.'))
      .finally(() => setLoading(false));
  }, [bandId]);

  useEffect(() => {
    if (!isCurrentUserLeader || !canEditContact) {
      return;
    }

    getCurrentUserProfile()
      .then((profile) => {
        if (!profile) {
          return;
        }
        const self = leaders.find((leader) => leader.userId === currentUserId);
        setContactEmail(profile.contact_email ?? self?.email ?? '');
        setContactPhone(profile.contact_phone ?? self?.contactPhone ?? '');
      })
      .catch(() => undefined);
  }, [isCurrentUserLeader, canEditContact, currentUserId, leaders]);

  async function handleSaveContact(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      await updateUserProfile({
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
      });
      await refreshProfile();
      const refreshed = await listBandLeaders(bandId);
      setLeaders(refreshed);
      setEditing(false);
      setSaveMessage('Contact details updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save contact details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="workspace-section panel workspace-leader-section">
      <div className="workspace-section-header">
        <div>
          <HeadingWithHelp
            as="h2"
            helpLabel="About band leaders"
            help={
              <p>
                {leaders.length > 1
                  ? 'Leaders who manage this band. The primary contact appears on the public profile.'
                  : `Primary contact for organisers, players and other bands working with ${primaryLeader?.displayName ?? 'this band'}.`}
              </p>
            }
          >
            Band leaders
          </HeadingWithHelp>
        </div>
        {isCurrentUserLeader && canEditContact && !editing ? (
          <button type="button" className="workspace-edit-button" onClick={() => setEditing(true)}>
            Edit my contact
          </button>
        ) : null}
      </div>

      {loading ? <p className="workspace-empty-note">Loading leader details…</p> : null}
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {saveMessage ? <div className="auth-message auth-message-success">{saveMessage}</div> : null}

      {!loading && leaders.length ? (
        editing && isCurrentUserLeader ? (
          <form className="auth-form workspace-leader-form" onSubmit={handleSaveContact}>
            <div className="auth-field">
              <label htmlFor="leaderContactEmail">Your contact email</label>
              <input
                id="leaderContactEmail"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="leader@example.com"
              />
              <p className="directory-field-hint">
                Used when players and organisers need to reach you as a band leader.
              </p>
            </div>
            <div className="auth-field">
              <label htmlFor="leaderContactPhone">Your contact phone</label>
              <input
                id="leaderContactPhone"
                type="tel"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="e.g. 07700 900123"
              />
            </div>
            <div className="workspace-edit-actions">
              <button type="submit" className="auth-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save contact details'}
              </button>
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <ul className="workspace-leaders-list">
            {leaders.map((leader) => (
              <li key={leader.userId} className="workspace-leader-card">
                <div className="workspace-leader-name-row">
                  <strong>{leader.displayName}</strong>
                  <span className="band-member-role">Leader</span>
                  {leader.isPrimary ? (
                    <span className="workspace-leader-primary-badge">Primary contact</span>
                  ) : null}
                </div>
                <dl className="workspace-leader-details">
                  <div>
                    <dt>Email</dt>
                    <dd>
                      {leader.email ? (
                        <a href={`mailto:${leader.email}`}>{leader.email}</a>
                      ) : (
                        'Not provided'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      {leader.contactPhone ? (
                        <a href={`tel:${leader.contactPhone}`}>{leader.contactPhone}</a>
                      ) : (
                        'Not provided'
                      )}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
