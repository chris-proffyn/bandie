import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  BAND_PART_TEMPLATES,
  createBandPart,
  createDefaultBandParts,
  deleteBandPart,
  memberDisplayName,
  syncBandSizeFromParts,
  type BandMemberWithProfile,
  type BandPart,
} from '@bandie/data';
import { buildFindPlayersUrl } from '../../lib/findPlayersNavigation';
import { bandInitials } from '../../lib/profileHelpers';
import { HeadingWithHelp } from '../ui/InfoHelp';

type BandPartsPanelProps = {
  bandId: string;
  bandName: string;
  canManage: boolean;
  parts: BandPart[];
  members: BandMemberWithProfile[];
  loading?: boolean;
  onReload: () => Promise<void>;
  onBandSizeChanged?: (size: number) => void;
};

function memberForPart(members: BandMemberWithProfile[], part: BandPart): BandMemberWithProfile | null {
  if (!part.assigned_member_id) {
    return null;
  }
  return members.find((member) => member.id === part.assigned_member_id) ?? null;
}

export function BandPartsPanel({
  bandId,
  bandName,
  canManage,
  parts,
  members,
  loading = false,
  onReload,
  onBandSizeChanged,
}: BandPartsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customInstrument, setCustomInstrument] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);

  useEffect(() => {
    onBandSizeChanged?.(parts.length);
  }, [parts.length, onBandSizeChanged]);

  async function handleAddTemplate(template: (typeof BAND_PART_TEMPLATES)[number]) {
    setSubmitting(true);
    setError(null);

    try {
      await createBandPart({
        bandId,
        title: template.title,
        instrumentFilter: template.instrumentFilter,
        sortOrder: parts.length,
      });
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddDefaults() {
    setSubmitting(true);
    setError(null);

    try {
      await createDefaultBandParts(bandId);
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add default lineup.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCustom(event: FormEvent) {
    event.preventDefault();
    const title = customTitle.trim();
    if (!title) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createBandPart({
        bandId,
        title,
        instrumentFilter: customInstrument.trim() || null,
        sortOrder: parts.length,
      });
      setCustomTitle('');
      setCustomInstrument('');
      setShowAddPart(false);
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(partId: string) {
    setSubmitting(true);
    setError(null);

    try {
      await deleteBandPart(partId, bandId);
      await syncBandSizeFromParts(bandId);
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove part.');
    } finally {
      setSubmitting(false);
    }
  }

  function findPlayersLink(part: BandPart) {
    return buildFindPlayersUrl({
      bandId,
      bandName,
      partId: part.id,
      partTitle: part.title,
      instrument: part.instrument_filter ?? undefined,
    });
  }

  return (
    <section className="workspace-section panel workspace-parts-section">
      <div className="workspace-section-header">
        <div>
          <HeadingWithHelp
            as="h2"
            helpLabel="About lineup and band parts"
            help={
              <p>
                Define the roles in your band. Band size is calculated from {parts.length}{' '}
                {parts.length === 1 ? 'part' : 'parts'}.
              </p>
            }
          >
            Lineup & band parts
          </HeadingWithHelp>
        </div>
        {canManage ? (
          <div className="band-parts-header-actions">
            {parts.length === 0 ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                onClick={handleAddDefaults}
                disabled={submitting}
              >
                Add standard lineup
              </button>
            ) : null}
            <button
              type="button"
              className="directory-btn directory-btn-dark"
              onClick={() => setShowAddPart((value) => !value)}
              disabled={submitting}
              aria-expanded={showAddPart}
            >
              {showAddPart ? 'Cancel' : 'Add part'}
            </button>
          </div>
        ) : null}
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading lineup…</p> : null}

      {!loading && parts.length ? (
        <ul className="band-parts-grid">
          {parts.map((part) => {
            const assigned = memberForPart(members, part);
            const assignedName = assigned ? memberDisplayName(assigned) : null;

            return (
              <li key={part.id} className="band-part-card">
                <div className="band-part-card-head">
                  <div className="band-part-card-head-main">
                    <strong className="band-part-card-title">{part.title}</strong>
                    {part.instrument_filter ? (
                      <span className="band-part-instrument">{part.instrument_filter}</span>
                    ) : null}
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      className="band-member-btn band-member-btn-danger band-part-card-remove"
                      onClick={() => {
                        if (window.confirm(`Remove ${part.title} from the lineup?`)) {
                          handleDelete(part.id);
                        }
                      }}
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                {assigned ? (
                  <div className="band-part-assigned">
                    {assigned.profile?.profile_image_url ? (
                      <img src={assigned.profile.profile_image_url} alt="" className="band-part-assigned-avatar" />
                    ) : (
                      <span className="band-part-assigned-avatar band-part-assigned-initials">
                        {bandInitials(assignedName ?? 'Member')}
                      </span>
                    )}
                    <span className="band-part-assigned-name">{assignedName}</span>
                    {assigned.lineup_unavailable ? (
                      <span className="band-lineup-unavailable-badge">Unavailable</span>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <p className="band-part-vacant">Vacant</p>
                    {canManage ? (
                      <div className="band-part-card-footer">
                        <Link
                          className="band-member-btn band-member-btn-primary"
                          to={findPlayersLink(part)}
                        >
                          Find player
                        </Link>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && !parts.length ? (
        <p className="workspace-empty-note">
          No band parts yet. Add roles to define your lineup and search for musicians.
        </p>
      ) : null}

      {canManage && showAddPart ? (
        <div className="band-parts-editor">
          <p className="workspace-section-intro">Quick add</p>
          <div className="band-parts-template-row">
            {BAND_PART_TEMPLATES.map((template) => (
              <button
                key={template.title}
                type="button"
                className="directory-chip"
                onClick={() => handleAddTemplate(template)}
                disabled={submitting || parts.some((part) => part.title === template.title)}
              >
                {template.title}
              </button>
            ))}
          </div>

          <form className="auth-form band-parts-custom-form" onSubmit={handleAddCustom}>
            <div className="profile-editor-row-grid">
              <div className="auth-field">
                <label htmlFor="customPartTitle">Custom part</label>
                <input
                  id="customPartTitle"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder="e.g. Saxophone"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="customPartInstrument">Instrument search</label>
                <input
                  id="customPartInstrument"
                  value={customInstrument}
                  onChange={(event) => setCustomInstrument(event.target.value)}
                  placeholder="e.g. Saxophone"
                />
              </div>
            </div>
            <button type="submit" className="auth-button" disabled={submitting || !customTitle.trim()}>
              Add part
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
