import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  formatOpenMicEventType,
  formatOpenMicSignupMode,
  getPublicJamSlots,
  getPublicOpenMicEvent,
  getPublicOpenMicSongs,
  getOpenMicPublicUrl,
  requestJamSlot,
  requestOpenMicSlot,
  submitOpenMicSongSuggestion,
  type PublicJamSlot,
  type PublicOpenMicEvent,
  type PublicOpenMicSong,
} from '@bandie/data';
import { useAuth } from '../context/AuthContext';
import { BackLink } from '../components/navigation/BackLink';
import { HeadingWithHelp } from '../components/ui/InfoHelp';
import { usePageMeta } from '../lib/usePageMeta';
import '../styles/bandProfile.css';
import '../styles/gigs.css';
import '../styles/workspace.css';
import '../styles/openMic.css';

export function PublicOpenMicEventPage() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<PublicOpenMicEvent | null>(null);
  const [songs, setSongs] = useState<PublicOpenMicSong[]>([]);
  const [jamSlots, setJamSlots] = useState<PublicJamSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signupForm, setSignupForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    bandName: '',
    slotId: '',
    requestNote: '',
  });
  const [suggestionForm, setSuggestionForm] = useState({
    mode: 'new_song' as 'new_song' | 'existing_slot',
    title: '',
    artist: '',
    notes: '',
    songSlotId: '',
    preferredSlotName: '',
  });

  const load = useCallback(async () => {
    if (!slug) {
      setMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const eventRow = await getPublicOpenMicEvent(slug);
      setEvent(eventRow);
      setMissing(!eventRow);

      if (eventRow?.event_type === 'jam_night') {
        const slots = await getPublicJamSlots(slug);
        setJamSlots(slots);
        setSongs([]);
      } else {
        const songRows = await getPublicOpenMicSongs(slug);
        setSongs(songRows);
        setJamSlots([]);
      }
    } catch {
      setEvent(null);
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile?.display_name) {
      setSignupForm((prev) => ({ ...prev, displayName: profile.display_name ?? '' }));
    }
  }, [profile?.display_name]);

  usePageMeta({
    title: event ? `${event.title} | Bandie` : 'Open mic event | Bandie',
    description: event?.description ?? 'Sign up for this open mic or jam night on Bandie.',
    canonicalPath: slug ? `/events/${slug}` : '/events',
  });

  const signupOpen =
    event &&
    ['published', 'signup_open', 'in_progress'].includes(event.status) &&
    event.signup_mode !== 'organiser_only';

  const isJamNight = event?.event_type === 'jam_night';
  const requiresLogin = Boolean(event?.requires_bandie_registration) && !user;

  async function handleOpenMicSignup(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!event || !signupForm.slotId) return;

    setError(null);
    setMessage(null);
    try {
      await requestOpenMicSlot({
        eventId: event.id,
        songSlotId: signupForm.slotId,
        displayName: signupForm.displayName,
        email: signupForm.email || null,
        phone: signupForm.phone || null,
        requestNote: signupForm.requestNote || null,
      });
      setMessage(
        event.signup_mode === 'moderated'
          ? 'Request submitted — the organiser will review it.'
          : 'You are signed up for this slot.',
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign up.');
    }
  }

  async function handleJamSignup(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!event || !signupForm.bandName.trim() || !signupForm.displayName.trim()) return;
    if (requiresLogin) {
      setError('Sign in with Bandie to request a jam slot.');
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await requestJamSlot({
        eventId: event.id,
        jamSlotId: signupForm.slotId || null,
        bandName: signupForm.bandName,
        contactName: signupForm.displayName,
        email: signupForm.email || null,
        phone: signupForm.phone || null,
        requestNote: signupForm.requestNote || null,
      });
      setMessage(
        event.signup_mode === 'moderated'
          ? 'Request submitted — the organiser will review it.'
          : 'Your band is signed up.',
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign up.');
    }
  }

  async function handleSuggestion(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!event) return;

    setError(null);
    setMessage(null);
    try {
      if (suggestionForm.mode === 'new_song') {
        if (!suggestionForm.title.trim()) return;
        await submitOpenMicSongSuggestion({
          eventId: event.id,
          title: suggestionForm.title,
          artist: suggestionForm.artist || null,
          displayName: signupForm.displayName || null,
          email: signupForm.email || null,
          phone: signupForm.phone || null,
          notes: suggestionForm.notes || null,
          suggestionType: 'new_song',
        });
      } else {
        if (!suggestionForm.songSlotId) return;
        await submitOpenMicSongSuggestion({
          eventId: event.id,
          displayName: signupForm.displayName || null,
          email: signupForm.email || null,
          phone: signupForm.phone || null,
          notes: suggestionForm.notes || null,
          suggestionType: 'existing_slot',
          songSlotId: suggestionForm.songSlotId,
          preferredSlotName: suggestionForm.preferredSlotName || null,
        });
      }
      setMessage('Your request has been sent to the organiser.');
      setSuggestionForm({
        mode: 'new_song',
        title: '',
        artist: '',
        notes: '',
        songSlotId: '',
        preferredSlotName: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    }
  }

  if (loading) {
    return (
      <div className="band-profile-page open-mic-public-page">
        <div className="open-mic-public-hero">
          <BackLink fallbackTo="/" label="Back to Bandie" />
          <h1>Loading event…</h1>
        </div>
      </div>
    );
  }

  if (missing || !event) {
    return (
      <div className="band-profile-page open-mic-public-page">
        <div className="open-mic-public-hero">
          <BackLink fallbackTo="/" label="Back to Bandie" />
          <h1>Event not found</h1>
          <p className="workspace-section-note">
            This link may be incorrect, or the organiser has not published the event yet.
          </p>
        </div>
      </div>
    );
  }

  const starts = new Date(event.starts_at).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const publicUrl = getOpenMicPublicUrl(event.slug);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`;

  const contactFields = (
    <>
      <div className="auth-field">
        <label htmlFor="signup-name">{isJamNight ? 'Contact name' : 'Your name'}</label>
        <input
          id="signup-name"
          value={signupForm.displayName}
          onChange={(e) => setSignupForm((prev) => ({ ...prev, displayName: e.target.value }))}
          required
        />
      </div>
      {event.required_contact_field !== 'phone' ? (
        <div className="auth-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={signupForm.email}
            onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
            required={event.required_contact_field === 'email'}
          />
        </div>
      ) : null}
      {event.required_contact_field !== 'email' ? (
        <div className="auth-field">
          <label htmlFor="signup-phone">Phone</label>
          <input
            id="signup-phone"
            value={signupForm.phone}
            onChange={(e) => setSignupForm((prev) => ({ ...prev, phone: e.target.value }))}
            required={event.required_contact_field === 'phone'}
          />
        </div>
      ) : null}
    </>
  );

  return (
    <div className="band-profile-page open-mic-public-page">
      <div className="open-mic-public-hero">
        <BackLink fallbackTo="/" label="Back to Bandie" />
        <p className="my-bands-eyebrow">{formatOpenMicEventType(event.event_type)}</p>
        <h1>{event.title}</h1>
        <div className="open-mic-public-meta">
          <span>{starts}</span>
          {event.venue_name ? <span>{event.venue_name}</span> : null}
          {event.venue_address ? <span>{event.venue_address}</span> : null}
          <span>Sign-up: {formatOpenMicSignupMode(event.signup_mode)}</span>
        </div>
        {event.description ? <p className="workspace-section-note">{event.description}</p> : null}
        {user ? (
          <p>
            <span className="open-mic-public-badge">Bandie member</span>
          </p>
        ) : null}
        {event.requires_bandie_registration ? (
          <p className="workspace-section-note">Bandie sign-in required to request a slot.</p>
        ) : null}
        <img className="open-mic-public-qr" src={qrUrl} alt="Event QR code" />

        {message ? <div className="auth-message auth-message-success">{message}</div> : null}
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}

        {signupOpen && isJamNight ? (
          <section className="panel workspace-section">
            <header className="workspace-section-header">
              <div>
                <HeadingWithHelp
                  as="h2"
                  helpLabel="About performance slot requests"
                  help={
                    <p>Guest bands welcome — no Bandie account needed unless required.</p>
                  }
                >
                  Request a performance slot
                </HeadingWithHelp>
              </div>
            </header>
            <form className="auth-form" onSubmit={handleJamSignup}>
              <div className="auth-field">
                <label htmlFor="jam-band-name">Band / act name</label>
                <input
                  id="jam-band-name"
                  value={signupForm.bandName}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, bandName: e.target.value }))}
                  required
                />
              </div>
              {contactFields}
              <div className="auth-field">
                <label htmlFor="jam-slot">Slot (optional)</label>
                <select
                  id="jam-slot"
                  value={signupForm.slotId}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, slotId: e.target.value }))}
                >
                  <option value="">Any available slot</option>
                  {jamSlots
                    .filter((slot) => slot.status === 'open' || slot.status === 'requested')
                    .map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        Slot {slot.slot_number}
                        {slot.starts_at
                          ? ` · ${new Date(slot.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="jam-note">Note for organiser</label>
                <textarea
                  id="jam-note"
                  value={signupForm.requestNote}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, requestNote: e.target.value }))}
                />
              </div>
              <div className="gig-detail-actions">
                <button type="submit" className="auth-button" disabled={requiresLogin}>
                  {event.signup_mode === 'moderated' ? 'Request slot' : 'Sign up'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {signupOpen && !isJamNight && songs.length > 0 ? (
          <section className="panel workspace-section">
            <header className="workspace-section-header">
              <div>
                <h2>Sign up for a part</h2>
              </div>
            </header>
            <form className="auth-form" onSubmit={handleOpenMicSignup}>
              {contactFields}
              <div className="auth-field">
                <label htmlFor="signup-slot">Choose part</label>
                <select
                  id="signup-slot"
                  value={signupForm.slotId}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, slotId: e.target.value }))}
                  required
                >
                  <option value="">Select a part…</option>
                  {songs.flatMap((song) =>
                    song.slots
                      .filter((slot) => slot.public_signup_enabled && slot.status !== 'filled')
                      .map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {song.title} — {slot.slot_name}
                        </option>
                      )),
                  )}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="signup-note">Note for organiser</label>
                <textarea
                  id="signup-note"
                  value={signupForm.requestNote}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, requestNote: e.target.value }))}
                />
              </div>
              <div className="gig-detail-actions">
                <button type="submit" className="auth-button">
                  {event.signup_mode === 'moderated' ? 'Request slot' : 'Sign up'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {signupOpen && !isJamNight ? (
          <section className="panel workspace-section">
            <header className="workspace-section-header">
              <div>
                <h2>Suggest a song or request a part</h2>
              </div>
            </header>
            <form className="auth-form" onSubmit={handleSuggestion}>
              <div className="auth-field">
                <label htmlFor="suggestion-mode">Request type</label>
                <select
                  id="suggestion-mode"
                  value={suggestionForm.mode}
                  onChange={(e) =>
                    setSuggestionForm((prev) => ({
                      ...prev,
                      mode: e.target.value as 'new_song' | 'existing_slot',
                    }))
                  }
                >
                  <option value="new_song">Suggest a new song</option>
                  <option value="existing_slot">Request a part on an existing song</option>
                </select>
              </div>
              {suggestionForm.mode === 'new_song' ? (
                <>
                  <div className="auth-field">
                    <label htmlFor="suggestion-title">Song title</label>
                    <input
                      id="suggestion-title"
                      value={suggestionForm.title}
                      onChange={(e) => setSuggestionForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="suggestion-artist">Artist</label>
                    <input
                      id="suggestion-artist"
                      value={suggestionForm.artist}
                      onChange={(e) => setSuggestionForm((prev) => ({ ...prev, artist: e.target.value }))}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="suggestion-part">Part you want to play</label>
                    <input
                      id="suggestion-part"
                      value={suggestionForm.preferredSlotName}
                      onChange={(e) =>
                        setSuggestionForm((prev) => ({ ...prev, preferredSlotName: e.target.value }))
                      }
                      placeholder="e.g. Lead guitar"
                    />
                  </div>
                </>
              ) : (
                <div className="auth-field">
                  <label htmlFor="suggestion-slot">Part on existing song</label>
                  <select
                    id="suggestion-slot"
                    value={suggestionForm.songSlotId}
                    onChange={(e) =>
                      setSuggestionForm((prev) => ({ ...prev, songSlotId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select a part…</option>
                    {songs.flatMap((song) =>
                      song.slots
                        .filter((slot) => slot.public_signup_enabled && slot.status !== 'filled')
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {song.title} — {slot.slot_name}
                          </option>
                        )),
                    )}
                  </select>
                </div>
              )}
              <div className="auth-field">
                <label htmlFor="suggestion-notes">Notes</label>
                <textarea
                  id="suggestion-notes"
                  value={suggestionForm.notes}
                  onChange={(e) => setSuggestionForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="gig-detail-actions">
                <button type="submit" className="directory-btn directory-btn-secondary">
                  Send request
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {isJamNight && jamSlots.length > 0 ? (
          <section className="panel workspace-section">
            <header className="workspace-section-header">
              <div>
                <h2>Performance slots</h2>
              </div>
            </header>
            <div className="open-mic-table-wrap">
              <table className="open-mic-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Band</th>
                  </tr>
                </thead>
                <tbody>
                  {jamSlots.map((slot) => (
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
                      <td>{slot.band_name ?? 'Open'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {event.public_song_list_enabled && !isJamNight && songs.length > 0 ? (
          <section className="panel workspace-section">
            <header className="workspace-section-header">
              <div>
                <h2>Song list</h2>
              </div>
            </header>
            <div className="open-mic-table-wrap open-mic-table-wrap--scroll">
              <table className="open-mic-table open-mic-table--matrix">
                <thead>
                  <tr>
                    <th>Song</th>
                    {[...new Set(songs.flatMap((song) => song.slots.map((slot) => slot.slot_name)))].map(
                      (name) => (
                        <th key={name}>{name}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => {
                    const partNames = [
                      ...new Set(songs.flatMap((s) => s.slots.map((slot) => slot.slot_name))),
                    ];
                    return (
                      <tr key={song.id}>
                        <td>
                          <strong>{song.title}</strong>
                          {song.artist ? <div className="open-mic-table-sub">{song.artist}</div> : null}
                        </td>
                        {partNames.map((partName) => {
                          const slot = song.slots.find((s) => s.slot_name === partName);
                          return (
                            <td key={partName}>
                              {slot ? (slot.status === 'filled' ? 'Filled' : 'Open') : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
