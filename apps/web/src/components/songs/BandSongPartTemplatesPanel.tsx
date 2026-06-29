import { useCallback, useEffect, useState } from 'react';
import {
  createBandSongPartTemplate,
  deleteBandSongPartTemplate,
  ensureBandSongPartTemplates,
  listBandSongPartTemplates,
  songPartDescription,
  songPartIcon,
  updateBandSongPartTemplate,
  type BandSongPartTemplate,
} from '@bandie/data';

type BandSongPartTemplatesPanelProps = {
  bandId: string;
  canManage: boolean;
};

export function BandSongPartTemplatesPanel({ bandId, canManage }: BandSongPartTemplatesPanelProps) {
  const [templates, setTemplates] = useState<BandSongPartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = canManage
        ? await ensureBandSongPartTemplates(bandId)
        : await listBandSongPartTemplates(bandId);
      setTemplates(rows);
    } catch (err) {
      setTemplates([]);
      setError(err instanceof Error ? err.message : 'Unable to load song part templates.');
    } finally {
      setLoading(false);
    }
  }, [bandId, canManage]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  async function handleAddPart(event: React.FormEvent) {
    event.preventDefault();
    if (!newLabel.trim()) {
      return;
    }

    setSubmittingId('new');
    setError(null);

    try {
      await createBandSongPartTemplate({ bandId, partLabel: newLabel.trim() });
      setNewLabel('');
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part template.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleToggleRequired(template: BandSongPartTemplate) {
    setSubmittingId(template.id);
    setError(null);

    try {
      await updateBandSongPartTemplate(bandId, template.id, {
        requiredForReadiness: !template.required_for_readiness,
      });
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update part template.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleDelete(template: BandSongPartTemplate) {
    if (!window.confirm(`Remove "${template.part_label}" from the band template? New songs will no longer get this part.`)) {
      return;
    }

    setSubmittingId(template.id);
    setError(null);

    try {
      await deleteBandSongPartTemplate(bandId, template.id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete part template.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <section className="panel songs-templates-panel">
      <div className="songs-side-card-header">
        <div>
          <h2>Band song part folders</h2>
          <p className="my-bands-lead" style={{ margin: 0 }}>
            Default part folders for new songs. Use one Guitar folder for all guitar parts, or customise
            for your band — not every lineup slot needs its own folder.
          </p>
        </div>
      </div>

      {error ? <div className="songs-error">{error}</div> : null}

      {loading ? (
        <p>Loading part templates…</p>
      ) : (
        <div className="songs-template-list">
          {templates.map((template) => (
            <div key={template.id} className="songs-template-row surface-light">
              <div className="songs-template-row-main">
                <span className="songs-folder-icon" aria-hidden>
                  {songPartIcon(template.part_key)}
                </span>
                <div>
                  <strong>{template.part_label}</strong>
                  <small>{songPartDescription(template.part_label)}</small>
                </div>
              </div>
              <div className="songs-template-row-actions">
                <span
                  className={
                    template.required_for_readiness ? 'songs-pill green' : 'songs-pill blue'
                  }
                >
                  {template.required_for_readiness ? 'Required for readiness' : 'Optional'}
                </span>
                {canManage ? (
                  <>
                    <button
                      type="button"
                      className="directory-btn directory-btn-secondary"
                      disabled={submittingId === template.id}
                      onClick={() => void handleToggleRequired(template)}
                    >
                      {template.required_for_readiness ? 'Mark optional' : 'Mark required'}
                    </button>
                    <button
                      type="button"
                      className="directory-btn directory-btn-secondary"
                      disabled={submittingId === template.id || templates.length <= 1}
                      onClick={() => void handleDelete(template)}
                    >
                      Remove
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {canManage ? (
        <form className="songs-template-add-form" onSubmit={handleAddPart}>
          <label>
            Add part folder
            <input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="e.g. Guitar, Keys, Backing vocals"
            />
          </label>
          <button
            type="submit"
            className="directory-btn directory-btn-primary"
            disabled={submittingId === 'new' || !newLabel.trim()}
          >
            Add part
          </button>
        </form>
      ) : (
        <p className="my-bands-lead" style={{ margin: 0 }}>
          Band leaders can edit the default part folders for new songs.
        </p>
      )}
    </section>
  );
}
