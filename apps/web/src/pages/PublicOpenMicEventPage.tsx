import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  formatOpenMicEventType,
  formatOpenMicSignupMode,
  getPublicOpenMicEvent,
  getPublicOpenMicSongs,
  getOpenMicPublicUrl,
  requestOpenMicSlot,
  submitOpenMicSongSuggestion,
  type PublicOpenMicEvent,
  type PublicOpenMicSong,
} from '@bandie/data';
import { useAuth } from '../context/AuthContext';
import { BackLink } from '../components/navigation/BackLink';
import { usePageMeta } from '../lib/usePageMeta';
import '../styles/openMic.css';

export function PublicOpenMicEventPage() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<PublicOpenMicEvent | null>(null);
  const [songs, setSongs] = useState<PublicOpenMicSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signupForm, setSignupForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    slotId: '',
    requestNote: '',
  });
  const [suggestionForm, setSuggestionForm] = useState({
    title: '',
    artist: '',
    notes: '',
  });

  const load = useCallback(async () => {
    if (!slug) {
      setMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [eventRow, songRows] = await Promise.all([
        getPublicOpenMicEvent(slug),
        getPublicOpenMicSongs(slug),
      ]);
      setEvent(eventRow);
      setSongs(songRows);
      setMissing(!eventRow);
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

  async function handleSignup(formEvent: FormEvent) {
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

  async function handleSuggestion(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!event || !suggestionForm.title.trim()) return;

    setError(null);
    setMessage(null);
    try {
      await submitOpenMicSongSuggestion({
        eventId: event.id,
        title: suggestionForm.title,
        artist: suggestionForm.artist || null,
        displayName: signupForm.displayName || null,
        email: signupForm.email || null,
        phone: signupForm.phone || null,
        notes: suggestionForm.notes || null,
      });
      setMessage('Song suggestion sent to the organiser.');
      setSuggestionForm({ title: '', artist: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit suggestion.');
    }
  }

  if (loading) {
    return (
      <div className="open-mic-public-page">
        <div className="open-mic-public-hero">
          <BackLink fallbackTo="/" label="Back to Bandie" />
          <h1>Loading event…</h1>
        </div>
      </div>
    );
  }

  if (missing || !event) {
    return (
      <div className="open-mic-public-page">
        <div className="open-mic-public-hero">
          <BackLink fallbackTo="/" label="Back to Bandie" />
          <h1>Event not found</h1>
          <p>This link may be incorrect, or the organiser has not published the event yet.</p>
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

  return (
    <div className="open-mic-public-page">
      <div className="open-mic-public-hero">
        <BackLink fallbackTo="/" label="Back to Bandie" />
        <p>{formatOpenMicEventType(event.event_type)}</p>
        <h1>{event.title}</h1>
        <div className="open-mic-public-meta">
          <span>{starts}</span>
          {event.venue_name ? <span>{event.venue_name}</span> : null}
          {event.venue_address ? <span>{event.venue_address}</span> : null}
          <span>Sign-up: {formatOpenMicSignupMode(event.signup_mode)}</span>
        </div>
        {event.description ? <p>{event.description}</p> : null}
        {user ? (
          <p>
            <span className="status-pill status-pill--success">Bandie member</span>
          </p>
        ) : null}
        <img src={qrUrl} alt="Event QR code" width={180} height={180} />

        {message ? <p className="auth-message auth-message-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {signupOpen && songs.length > 0 ? (
          <section className="panel">
            <h2>Sign up for a slot</h2>
            <form className="open-mic-signup-form" onSubmit={handleSignup}>
              <label>
                Your name
                <input
                  value={signupForm.displayName}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  required
                />
              </label>
              {event.required_contact_field !== 'phone' ? (
                <label>
                  Email
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                    required={event.required_contact_field === 'email'}
                  />
                </label>
              ) : null}
              {event.required_contact_field !== 'email' ? (
                <label>
                  Phone
                  <input
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, phone: e.target.value }))}
                    required={event.required_contact_field === 'phone'}
                  />
                </label>
              ) : null}
              <label>
                Choose slot
                <select
                  value={signupForm.slotId}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, slotId: e.target.value }))}
                  required
                >
                  <option value="">Select a slot…</option>
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
              </label>
              <label>
                Note for organiser
                <textarea
                  value={signupForm.requestNote}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, requestNote: e.target.value }))}
                />
              </label>
              <button type="submit" className="auth-button">
                {event.signup_mode === 'moderated' ? 'Request slot' : 'Sign up'}
              </button>
            </form>
          </section>
        ) : null}

        {signupOpen ? (
          <section className="panel">
            <h2>Suggest a song</h2>
            <form className="open-mic-signup-form" onSubmit={handleSuggestion}>
              <label>
                Song title
                <input
                  value={suggestionForm.title}
                  onChange={(e) => setSuggestionForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Artist
                <input
                  value={suggestionForm.artist}
                  onChange={(e) => setSuggestionForm((prev) => ({ ...prev, artist: e.target.value }))}
                />
              </label>
              <label>
                Notes
                <textarea
                  value={suggestionForm.notes}
                  onChange={(e) => setSuggestionForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
              <button type="submit" className="auth-button auth-button--secondary">
                Send suggestion
              </button>
            </form>
          </section>
        ) : null}

        {event.public_song_list_enabled && songs.length > 0 ? (
          <section className="panel">
            <h2>Song list</h2>
            <ul className="open-mic-list">
              {songs.map((song) => (
                <li key={song.id} className="open-mic-song-row">
                  <strong>
                    {song.title}
                    {song.artist ? ` — ${song.artist}` : ''}
                  </strong>
                  <div className="open-mic-slot-chips">
                    {song.slots.map((slot) => (
                      <span key={slot.id} className="open-mic-slot-chip">
                        {slot.slot_name}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
