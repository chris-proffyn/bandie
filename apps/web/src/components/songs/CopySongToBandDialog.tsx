import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  copyBandSongToBand,
  isBandLeaderRole,
  type UserBand,
} from '@bandie/data';

type CopySongToBandDialogProps = {
  sourceBandId: string;
  sourceSongId: string;
  sourceSongTitle: string;
  bands: UserBand[];
  onClose: () => void;
};

export function CopySongToBandDialog({
  sourceBandId,
  sourceSongId,
  sourceSongTitle,
  bands,
  onClose,
}: CopySongToBandDialogProps) {
  const navigate = useNavigate();
  const targetBands = useMemo(
    () =>
      bands.filter(
        (band) => band.id !== sourceBandId && isBandLeaderRole(band.member_role),
      ),
    [bands, sourceBandId],
  );

  const [targetBandId, setTargetBandId] = useState(targetBands[0]?.id ?? '');
  const [title, setTitle] = useState(sourceSongTitle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!targetBandId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await copyBandSongToBand({
        sourceBandId,
        sourceSongId,
        targetBandId,
        title: title.trim() || undefined,
      });

      onClose();
      navigate(`/app/${result.song.band_id}/songs/${result.song.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to copy song.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="songs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="songs-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-song-to-band-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="copy-song-to-band-title">Copy to another band</h2>
        <p>
          Create a new song in another band you lead, including part folders and Dropbox files.
          Both bands must use the same Dropbox account for song-part storage.
        </p>

        {targetBands.length === 0 ? (
          <p className="my-bands-lead">
            You need to lead at least one other band before you can copy songs between bands.
          </p>
        ) : null}

        {error ? <div className="songs-error">{error}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <label>
            Target band
            <select
              value={targetBandId}
              onChange={(event) => setTargetBandId(event.target.value)}
              disabled={targetBands.length === 0 || submitting}
              required
            >
              {targetBands.map((band) => (
                <option key={band.id} value={band.id}>
                  {band.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Song title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Song title in the target band"
              required
              disabled={targetBands.length === 0 || submitting}
            />
          </label>

          <div className="songs-form-actions">
            <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="directory-btn directory-btn-primary"
              disabled={submitting || targetBands.length === 0 || !title.trim()}
            >
              {submitting ? 'Copying…' : 'Copy song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
