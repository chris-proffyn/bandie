import { useCallback, useEffect, useState } from 'react';
import {
  deleteBandSongPartTemplate,
  ensureBandSongPartTemplates,
  listBandSongPartTemplates,
  SONG_PARTS_LEADER_ONLY_MESSAGE,
  songPartDescription,
  songPartIcon,
  updateBandSongPartTemplate,
  type BandSongPartTemplate,
} from '@bandie/data';
import { AddBandSongPartTemplateDialog } from './AddBandSongPartTemplateDialog';
import { HeadingWithHelp } from '../ui/InfoHelp';

type BandSongPartTemplatesPanelProps = {
  bandId: string;
  canManage: boolean;
};

export function BandSongPartTemplatesPanel({ bandId, canManage }: BandSongPartTemplatesPanelProps) {
  const [templates, setTemplates] = useState<BandSongPartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showAddPart, setShowAddPart] = useState(false);

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
          <HeadingWithHelp
            as="h2"
            helpLabel="About song part folders"
            help={
              <p>
                Default part folders for new songs. Use one Guitar folder for all guitar parts, or customise
                for your band — not every lineup slot needs its own folder.
              </p>
            }
          >
            Band song part folders
          </HeadingWithHelp>
        </div>
        {canManage ? (
          <div className="songs-side-card-header-actions">
            <button
              type="button"
              className="directory-btn directory-btn-primary"
              onClick={() => setShowAddPart(true)}
            >
              Add part
            </button>
          </div>
        ) : null}
      </div>

      {error ? <div className="songs-error">{error}</div> : null}

      {!canManage ? (
        <p className="my-bands-lead songs-leader-only-note" style={{ margin: 0 }}>
          {SONG_PARTS_LEADER_ONLY_MESSAGE}
        </p>
      ) : null}

      {loading ? (
        <p className="songs-templates-loading">Loading part templates…</p>
      ) : (
        <div className="songs-template-grid">
          {templates.map((template) => (
            <article key={template.id} className="songs-template-card surface-light">
              <span className="songs-folder-icon" aria-hidden>
                {songPartIcon(template.part_key)}
              </span>
              <h3>{template.part_label}</h3>
              <p>{songPartDescription(template.part_label)}</p>
              <span
                className={
                  template.required_for_readiness ? 'songs-pill green songs-pill-compact' : 'songs-pill blue songs-pill-compact'
                }
              >
                {template.required_for_readiness ? 'Required' : 'Optional'}
              </span>
              {canManage ? (
                <div className="songs-template-card-actions">
                  <button
                    type="button"
                    className="songs-card-btn"
                    disabled={submittingId === template.id}
                    aria-label={
                      template.required_for_readiness
                        ? `Mark ${template.part_label} optional for readiness`
                        : `Mark ${template.part_label} required for readiness`
                    }
                    onClick={() => void handleToggleRequired(template)}
                  >
                    {template.required_for_readiness ? 'Optional' : 'Required'}
                  </button>
                  <button
                    type="button"
                    className="songs-card-btn songs-card-btn-danger"
                    disabled={submittingId === template.id || templates.length <= 1}
                    aria-label={`Remove ${template.part_label} from band template`}
                    onClick={() => void handleDelete(template)}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {showAddPart ? (
        <AddBandSongPartTemplateDialog
          bandId={bandId}
          onClose={() => setShowAddPart(false)}
          onCreated={() => void loadTemplates()}
        />
      ) : null}
    </section>
  );
}
