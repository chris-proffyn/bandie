import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOpenMicEvent, getOpenMicPublicUrl } from '@bandie/data';
import { usePageMeta } from '../../lib/usePageMeta';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/gigs.css';
import '../../styles/workspace.css';
import '../../styles/openMic.css';

const POSTER_TEMPLATES = [
  { id: 'pub', label: 'Pub open mic', className: '' },
  { id: 'blues', label: 'Blues jam', className: 'open-mic-poster--blues' },
  { id: 'rock', label: 'Rock jam', className: 'open-mic-poster--rock' },
  { id: 'acoustic', label: 'Acoustic night', className: 'open-mic-poster--acoustic' },
  { id: 'community', label: 'Community music night', className: '' },
];

export function OpenMicPosterPage() {
  const { eventId } = useParams();
  const [title, setTitle] = useState('Open mic night');
  const [venueName, setVenueName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [slug, setSlug] = useState('');
  const [templateId, setTemplateId] = useState('pub');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getOpenMicEvent(eventId)
      .then((event) => {
        if (!event) return;
        setTitle(event.title);
        setVenueName(event.venue?.name ?? event.venue_name ?? '');
        setStartsAt(
          new Date(event.starts_at).toLocaleString('en-GB', {
            weekday: 'long',
            dateStyle: 'long',
            timeStyle: 'short',
          }),
        );
        setSlug(event.slug);
        if (event.poster_template_id) {
          setTemplateId(event.poster_template_id);
        }
      })
      .catch(() => undefined);
  }, [eventId]);

  const publicUrl = slug ? getOpenMicPublicUrl(slug) : '';
  const qrUrl = useMemo(
    () =>
      publicUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}`
        : '',
    [publicUrl],
  );

  const template = POSTER_TEMPLATES.find((row) => row.id === templateId) ?? POSTER_TEMPLATES[0];

  usePageMeta({
    title: `${title} poster | Bandie`,
    description: `Printable poster for ${title}`,
    canonicalPath: eventId ? `/app/open-mic/${eventId}/poster` : '/app/open-mic',
  });

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header open-mic-no-print">
        <div>
          <p className="my-bands-eyebrow">Event poster</p>
          <HeadingWithHelp
            as="h1"
            helpLabel="About event poster"
            help={<p>Print an A4 poster with QR code for sign-ups.</p>}
          >
            {title}
          </HeadingWithHelp>
        </div>
        <Link to={`/app/open-mic/${eventId}`} className="directory-btn directory-btn-secondary">
          Back to event
        </Link>
      </header>

      <div className="gig-detail-actions open-mic-no-print">
        <button type="button" className="directory-btn directory-btn-secondary" onClick={() => void copyLink()}>
          {copied ? 'Copied!' : 'Copy public link'}
        </button>
        <button type="button" className="auth-button" onClick={() => window.print()}>
          Print A4
        </button>
      </div>

      <section className="panel workspace-section open-mic-no-print">
        <form className="auth-form">
          <div className="auth-field">
            <label htmlFor="open-mic-poster-template">Poster style</label>
            <select
              id="open-mic-poster-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {POSTER_TEMPLATES.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </section>

      <article className={`open-mic-poster ${template.className}`}>
        <div>
          <p style={{ margin: 0, opacity: 0.8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {template.label}
          </p>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '2.4rem', lineHeight: 1.1 }}>{title}</h1>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '1.15rem' }}>{startsAt}</p>
          {venueName ? <p style={{ margin: '0.35rem 0 0' }}>{venueName}</p> : null}
        </div>
        {qrUrl ? (
          <div>
            <img className="open-mic-poster-qr" src={qrUrl} alt="QR code for event sign-up" />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Scan to sign up</p>
          </div>
        ) : null}
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.75 }}>Powered by Bandie</p>
      </article>
    </div>
  );
}
