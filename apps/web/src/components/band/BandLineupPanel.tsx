import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  addBandLeader,
  assignMemberToPart,
  BAND_PART_TEMPLATES,
  createBandPart,
  createDefaultBandParts,
  deleteBandPart,
  formatBandMemberRoleLabel,
  isBandLeaderRole,
  listBandMembersWithProfiles,
  listBandParts,
  memberDisplayName,
  removeBandMember,
  setBandMemberLineupUnavailable,
  syncBandSizeFromParts,
  type BandMemberWithProfile,
  type BandPart,
} from '@bandie/data';
import { buildFindDeputyUrl, buildFindPlayersUrl } from '../../lib/findPlayersNavigation';
import { bandInitials } from '../../lib/profileHelpers';

type BandLineupPanelProps = {
  bandId: string;
  bandName: string;
  canManage: boolean;
  onBandSizeChanged?: (size: number) => void;
  onMembersChanged?: () => Promise<void> | void;
};

function memberById(members: BandMemberWithProfile[], memberId: string | null): BandMemberWithProfile | null {
  if (!memberId) {
    return null;
  }
  return members.find((member) => member.id === memberId) ?? null;
}

export function BandLineupPanel({
  bandId,
  bandName,
  canManage,
  onBandSizeChanged,
  onMembersChanged,
}: BandLineupPanelProps) {
  const [parts, setParts] = useState<BandPart[]>([]);
  const [members, setMembers] = useState<BandMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customInstrument, setCustomInstrument] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const onBandSizeChangedRef = useRef(onBandSizeChanged);
  const lastReportedSizeRef = useRef<number | null>(null);

  useEffect(() => {
    onBandSizeChangedRef.current = onBandSizeChanged;
  }, [onBandSizeChanged]);

  useEffect(() => {
    lastReportedSizeRef.current = null;
  }, [bandId]);

  const loadLineup = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [partRows, memberRows] = await Promise.all([
        listBandParts(bandId),
        listBandMembersWithProfiles(bandId),
      ]);
      setParts(partRows);
      setMembers(memberRows);
      if (lastReportedSizeRef.current !== partRows.length) {
        lastReportedSizeRef.current = partRows.length;
        onBandSizeChangedRef.current?.(partRows.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load lineup.');
      setParts([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    loadLineup().catch(() => undefined);
  }, [loadLineup]);

  const assignedMemberIds = new Set(parts.map((part) => part.assigned_member_id).filter(Boolean));
  const unassignedMembers = members.filter((member) => !assignedMemberIds.has(member.id));
  const leaderCount = members.filter((member) => isBandLeaderRole(member.role)).length;

  async function refreshAfterChange() {
    await loadLineup();
    await onMembersChanged?.();
  }

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
      await refreshAfterChange();
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
      await refreshAfterChange();
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
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePart(partId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await deleteBandPart(partId, bandId);
      const size = await syncBandSizeFromParts(bandId);
      lastReportedSizeRef.current = size;
      onBandSizeChangedRef.current?.(size);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove part.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignMember(partId: string, memberId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await assignMemberToPart(bandId, partId, memberId || null);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign member.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMakeLeader(member: BandMemberWithProfile) {
    if (!window.confirm(`Make ${memberDisplayName(member)} a band leader?`)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addBandLeader(bandId, member.user_id);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign leader.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(member: BandMemberWithProfile) {
    if (!window.confirm(`Remove ${memberDisplayName(member)} from the band?`)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await removeBandMember(bandId, member.id);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove member.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleUnavailable(member: BandMemberWithProfile) {
    setSubmitting(true);
    setError(null);
    try {
      await setBandMemberLineupUnavailable(bandId, member.id, !member.lineup_unavailable);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update availability.');
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

  function findDeputyLink(part: BandPart) {
    return buildFindDeputyUrl({
      bandId,
      bandName,
      partId: part.id,
      partTitle: part.title,
      instrument: part.instrument_filter ?? undefined,
    });
  }

  function renderMemberAvatar(member: BandMemberWithProfile) {
    const name = memberDisplayName(member);
    const imageUrl = member.profile?.profile_image_url;

    return (
      <div className="band-lineup-slot-avatar">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span>{bandInitials(name)}</span>}
      </div>
    );
  }

  function renderMemberControls(member: BandMemberWithProfile, part: BandPart) {
    if (!canManage) {
      return null;
    }

    const isLeader = isBandLeaderRole(member.role);
    const canMakeLeader = !isLeader;
    const canRemoveMember = !isLeader || leaderCount > 1;

    return (
      <div className="band-lineup-slot-actions">
        {canMakeLeader ? (
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            disabled={submitting}
            onClick={() => handleMakeLeader(member)}
          >
            Make leader
          </button>
        ) : null}
        <button
          type="button"
          className="directory-btn directory-btn-secondary"
          disabled={submitting}
          onClick={() => handleToggleUnavailable(member)}
        >
          {member.lineup_unavailable ? 'Mark available' : 'Unavailable'}
        </button>
        <Link className="directory-btn directory-btn-secondary" to={findDeputyLink(part)}>
          Find deputy
        </Link>
        <button
          type="button"
          className="directory-btn directory-btn-secondary"
          disabled={submitting}
          onClick={() => handleAssignMember(part.id, '')}
        >
          Unassign
        </button>
        {!canRemoveMember ? null : (
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            disabled={submitting}
            onClick={() => handleRemoveMember(member)}
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="workspace-section panel workspace-lineup-section">
      <div className="workspace-section-header">
        <div>
          <h2>Lineup</h2>
          <p className="workspace-section-intro">
            Assign members to each band part. Unassigned members appear below. Band size is calculated
            from {parts.length} {parts.length === 1 ? 'part' : 'parts'}.
          </p>
        </div>
        {canManage && parts.length === 0 ? (
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            onClick={handleAddDefaults}
            disabled={submitting}
          >
            Add standard lineup
          </button>
        ) : null}
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading lineup…</p> : null}

      {!loading && parts.length ? (
        <ul className="band-lineup-grid">
          {parts.map((part) => {
            const assigned = memberById(members, part.assigned_member_id);

            return (
              <li key={part.id} className="band-lineup-slot">
                <div className="band-lineup-slot-header">
                  <div>
                    <strong className="band-lineup-slot-title">{part.title}</strong>
                    {part.instrument_filter ? (
                      <span className="band-part-instrument">{part.instrument_filter}</span>
                    ) : null}
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      className="workspace-edit-button"
                      disabled={submitting}
                      onClick={() => handleDeletePart(part.id)}
                    >
                      Remove part
                    </button>
                  ) : null}
                </div>

                {assigned ? (
                  <div
                    className={`band-lineup-slot-member ${assigned.lineup_unavailable ? 'band-lineup-slot-member-unavailable' : ''}`}
                  >
                    {renderMemberAvatar(assigned)}
                    <div className="band-lineup-slot-body">
                      <div className="band-lineup-slot-name-row">
                        <strong>{memberDisplayName(assigned)}</strong>
                        <span className="band-member-role">
                          {formatBandMemberRoleLabel(assigned.role)}
                        </span>
                        {assigned.lineup_unavailable ? (
                          <span className="band-lineup-unavailable-badge">Unavailable</span>
                        ) : null}
                      </div>
                      {assigned.profile?.preferred_instrument ||
                      assigned.profile?.instruments?.length ? (
                        <p className="band-member-card-meta">
                          {assigned.profile.preferred_instrument ||
                            assigned.profile.instruments.join(', ')}
                        </p>
                      ) : null}
                      {renderMemberControls(assigned, part)}
                    </div>
                  </div>
                ) : (
                  <div className="band-lineup-slot-vacant">
                    <p className="workspace-empty-note">No one assigned yet.</p>
                    {canManage ? (
                      <>
                        {unassignedMembers.length ? (
                          <label className="band-lineup-assign-field">
                            <span>Assign member</span>
                            <select
                              defaultValue=""
                              disabled={submitting}
                              onChange={(event) => {
                                const value = event.target.value;
                                if (value) {
                                  void handleAssignMember(part.id, value);
                                  event.target.value = '';
                                }
                              }}
                            >
                              <option value="">Choose a member…</option>
                              {unassignedMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {memberDisplayName(member)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <p className="workspace-section-note">
                            Invite a player or wait for pending invites to be accepted.
                          </p>
                        )}
                        <Link className="directory-btn directory-btn-dark" to={findPlayersLink(part)}>
                          Find player
                        </Link>
                      </>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && !parts.length ? (
        <p className="workspace-empty-note">
          No band parts yet. Add roles to define your lineup and assign members.
        </p>
      ) : null}

      {canManage ? (
        <div className="band-parts-editor">
          <p className="workspace-section-intro">Quick add parts</p>
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

      {!loading && unassignedMembers.length ? (
        <div className="band-lineup-unassigned">
          <h3>Unassigned members</h3>
          <p className="workspace-section-intro">
            These active members are not linked to a lineup part yet.
          </p>
          <ul className="band-lineup-unassigned-list">
            {unassignedMembers.map((member) => (
              <li key={member.id} className="band-lineup-unassigned-row">
                {renderMemberAvatar(member)}
                <div className="band-lineup-slot-body">
                  <div className="band-lineup-slot-name-row">
                    <strong>{memberDisplayName(member)}</strong>
                    <span className="band-member-role">{formatBandMemberRoleLabel(member.role)}</span>
                  </div>
                  {member.profile?.preferred_instrument ? (
                    <p className="band-member-card-meta">{member.profile.preferred_instrument}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
