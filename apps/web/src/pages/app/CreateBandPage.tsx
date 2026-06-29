import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createBand,
  DEFAULT_BAND_COLOR_PALETTE,
  ensureAppMembership,
  ensureBandieProfile,
  type BandColorPaletteId,
} from '@bandie/data';
import { slugifyBandName } from '@bandie/utils';
import { useAuth } from '../../context/AuthContext';
import { BandColorPalettePicker } from '../../components/profile/BandColorPalettePicker';
import { UpgradePromptModal } from '../../components/entitlements/UpgradePromptModal';
import { useUpgradePrompt } from '../../hooks/useUpgradePrompt';

export function CreateBandPage() {
  const navigate = useNavigate();
  const { refreshBands } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [colorPalette, setColorPalette] = useState<BandColorPaletteId>(DEFAULT_BAND_COLOR_PALETTE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { upgradeDecision, clearUpgradePrompt, handleEntitlementError } = useUpgradePrompt();

  useEffect(() => {
    if (!slug && name) {
      setSlug(slugifyBandName(name));
    }
  }, [name, slug]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await ensureAppMembership();
      await ensureBandieProfile();
      const band = await createBand({ name, slug, location, description, color_palette: colorPalette });
      await refreshBands();
      navigate(`/app/${band.id}`, { replace: true });
    } catch (err) {
      if (handleEntitlementError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to create band.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 640 }}>
      <h2>Create your band</h2>
      <p>Set up your private workspace. You can publish a public profile later.</p>
      <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        <div className="auth-field">
          <label htmlFor="name">Band name</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="auth-field">
          <label htmlFor="slug">Public slug</label>
          <input id="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="auth-field">
          <label htmlFor="location">Home city</label>
          <input id="location" placeholder="e.g. Guildford, UK" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="auth-field">
          <label htmlFor="description">Short description</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label>Colour palette</label>
          <p style={{ color: '#bbb6aa', fontSize: '0.88rem', marginTop: 0 }}>
            Sets the look of your public profile and future gig posters.
          </p>
          <BandColorPalettePicker value={colorPalette} onChange={setColorPalette} />
        </div>
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Creating band…' : 'Create band'}
        </button>
      </form>

      {upgradeDecision ? (
        <UpgradePromptModal decision={upgradeDecision} onClose={clearUpgradePrompt} />
      ) : null}
    </div>
  );
}
