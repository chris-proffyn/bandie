import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  addBandLeader,
  assignMemberToPart,
  formatBandMemberRoleLabel,
  getBandProfileForEdit,
  isBandLeaderRole,
  listBandMembersWithProfiles,
  listBandParts,
  memberDisplayName,
  removeBandLeader,
  removeBandMember,
  setBandMemberLineupUnavailable,
  setPrimaryBandContact,
  updateBandProfile,
  type BandMemberWithProfile,
  type BandPart,
  type PublicBandProfile,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { BandInvitationsPanel } from '../../components/band/BandInvitationsPanel';
import { BandLeaderSection } from '../../components/band/BandLeaderSection';
import { BandMemberCard } from '../../components/band/BandMemberCard';
import { BandOverviewTabBar, type BandOverviewTab } from '../../components/band/BandOverviewTabs';
import { BandPartsPanel } from '../../components/band/BandPartsPanel';
import { BandWorkspaceProfileView } from '../../components/band/BandWorkspaceProfileView';
import '../../styles/workspace.css';

export function WorkspaceHomePage() {
  const { bandId } = useParams();
  const { bands, refreshBands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const isLeader = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [activeTab, setActiveTab] = useState<BandOverviewTab>('members');
  const [profile, setProfile] = useState<PublicBandProfile | null>(null);
  const [members, setMembers] = useState<BandMemberWithProfile[]>([]);
  const [parts, setParts] = useState<BandPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [profileResult, memberRows, partRows] = await Promise.all([
        getBandProfileForEdit(bandId),
        listBandMembersWithProfiles(bandId),
        listBandParts(bandId),
      ]);
      setProfile(profileResult);
      setMembers(memberRows);
      setParts(partRows);
    } catch (err) {
      setProfile(null);
      setMembers([]);
      setParts([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load band workspace.');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    loadWorkspace().catch(() => undefined);
  }, [loadWorkspace]);

  const handleBandSizeChanged = useCallback((size: number) => {
    setProfile((current) => {
      if (!current) {
        return current;
      }

      const nextSize = size > 0 ? size : null;
      if (current.band_size === nextSize) {
        return current;
      }

      return { ...current, band_size: nextSize };
    });
  }, []);

  async function handleProfileUpdated(updated: PublicBandProfile) {
    setProfile(updated);
    await refreshBands();
  }

  async function handlePublishChange(published: boolean) {
    if (!bandId) {
      return;
    }
    const updated = await updateBandProfile(bandId, { public_profile_enabled: published });
    setProfile(updated);
    await refreshBands();
  }

  async function handleToggleMemberUnavailable(member: BandMemberWithProfile) {
    if (!bandId) {
      return;
    }

    setMemberActionId(member.id);
    setMemberActionError(null);

    try {
      await setBandMemberLineupUnavailable(bandId, member.id, !member.lineup_unavailable);
      await loadWorkspace();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Unable to update member availability.');
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleAssignMemberToPart(member: BandMemberWithProfile, partId: string) {
    if (!bandId) {
      return;
    }

    setMemberActionId(member.id);
    setMemberActionError(null);

    try {
      await assignMemberToPart(bandId, partId, member.id);
      await loadWorkspace();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Unable to assign member to part.');
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleMakeLeader(member: BandMemberWithProfile) {
    if (!bandId) {
      return;
    }

    if (!window.confirm(`Make ${memberDisplayName(member)} a band leader?`)) {
      return;
    }

    setMemberActionId(member.id);
    setMemberActionError(null);

    try {
      await addBandLeader(bandId, member.user_id);
      await loadWorkspace();
      await refreshBands();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Unable to assign band leader.');
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleRemoveLeader(member: BandMemberWithProfile) {
    if (!bandId) {
      return;
    }

    if (!window.confirm(`Remove leader role from ${memberDisplayName(member)}?`)) {
      return;
    }

    setMemberActionId(member.id);
    setMemberActionError(null);

    try {
      await removeBandLeader(bandId, member.user_id);
      await loadWorkspace();
      await refreshBands();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Unable to remove band leader.');
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleMakePrimary(member: BandMemberWithProfile) {
    if (!bandId) {
      return;
    }

    if (
      !window.confirm(`Make ${memberDisplayName(member)} the band's primary contact?`)
    ) {
      return;
    }

    setMemberActionId(member.id);
    setMemberActionError(null);

    try {
      await setPrimaryBandContact(bandId, member.user_id);
      await loadWorkspace();
      await refreshBands();
    } catch (err) {
      setMemberActionError(
        err instanceof Error ? err.message : 'Unable to assign primary contact.',
      );
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleRemoveMember(member: BandMemberWithProfile) {
    if (!bandId) {
      return;
    }

    if (!window.confirm(`Remove ${memberDisplayName(member)} from the band?`)) {
      return;
    }

    setMemberActionId(member.id);
    setMemberActionError(null);

    try {
      await removeBandMember(bandId, member.id);
      await loadWorkspace();
      await refreshBands();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Unable to remove member.');
    } finally {
      setMemberActionId(null);
    }
  }

  if (!bandId) {
    return null;
  }

  if (loading) {
    return (
      <div className="panel">
        <p>Loading band workspace…</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="panel">
        <p>{loadError ?? 'Band workspace unavailable.'}</p>
      </div>
    );
  }

  if (!canAccessBand) {
    return (
      <div className="panel">
        <p>This band is not in your workspace. Enable admin mode from My profile to manage all bands.</p>
      </div>
    );
  }

  const leaderCount = members.filter((member) => isBandLeaderRole(member.role)).length;

  return (
    <div className="band-workspace-overview">
      <header className="band-overview-header">
        <div>
          <p className="my-bands-eyebrow">Band overview</p>
          <h1>{profile.name}</h1>
          <p className="my-bands-lead">
            Manage members, lineup, and invitations — or edit your public band profile and leader
            contact details.
          </p>
        </div>
      </header>

      <BandOverviewTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'members' ? (
        <div className="band-overview-tab-panel" role="tabpanel" aria-label="Members">
          <BandPartsPanel
            bandId={bandId}
            bandName={profile.name}
            canManage={isLeader}
            parts={parts}
            members={members}
            loading={loading}
            onReload={loadWorkspace}
            onBandSizeChanged={handleBandSizeChanged}
          />

          <section className="workspace-section panel workspace-team-section workspace-members-section">
            <div className="workspace-section-header">
              <div>
                <h2>Active members</h2>
                <p className="workspace-section-intro">
                  {members.length} active member{members.length === 1 ? '' : 's'}
                  {profile.band_size != null ? ` · Lineup size: ${profile.band_size}` : ''}
                  {!isLeader
                    ? ` · Your role: ${formatBandMemberRoleLabel(membership?.member_role ?? 'member')}`
                    : ''}
                </p>
              </div>
            </div>
            {memberActionError ? (
              <div className="auth-message auth-message-error">{memberActionError}</div>
            ) : null}
            {members.length ? (
              <div className="band-member-grid">
                {members.map((member) => (
                  <BandMemberCard
                    key={member.id}
                    member={member}
                    parts={parts}
                    bandId={bandId}
                    canEditProfile={adminModeActive}
                    canManage={isLeader}
                    canMakeLeader={isLeader && !isBandLeaderRole(member.role)}
                    canMakePrimary={
                      isLeader &&
                      isBandLeaderRole(member.role) &&
                      member.user_id !== profile.owner_user_id
                    }
                    canRemoveLeader={
                      isLeader && isBandLeaderRole(member.role) && leaderCount > 1
                    }
                    canRemoveFromBand={
                      isLeader &&
                      (!isBandLeaderRole(member.role) || leaderCount > 1)
                    }
                    isPrimaryContact={member.user_id === profile.owner_user_id}
                    submitting={memberActionId === member.id}
                    onToggleUnavailable={() => handleToggleMemberUnavailable(member)}
                    onRemove={() => handleRemoveMember(member)}
                    onAssign={(partId) => handleAssignMemberToPart(member, partId)}
                    onMakeLeader={() => handleMakeLeader(member)}
                    onMakePrimary={() => handleMakePrimary(member)}
                    onRemoveLeader={() => handleRemoveLeader(member)}
                  />
                ))}
              </div>
            ) : (
              <p className="workspace-empty-note">
                No active members yet. Use lineup parts above to find players.
              </p>
            )}
          </section>

          {isLeader ? (
            <section className="workspace-section panel workspace-team-section">
              <div className="workspace-section-header">
                <h2>Invitations</h2>
              </div>
              <BandInvitationsPanel bandId={bandId} />
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'details' ? (
        <div className="band-overview-tab-panel" role="tabpanel" aria-label="Band details">
          <BandLeaderSection bandId={bandId} canEditContact={isLeader} />

          <BandWorkspaceProfileView
            bandId={bandId}
            profile={profile}
            canEdit={isLeader}
            onProfileUpdated={handleProfileUpdated}
            onPublishChange={isLeader ? handlePublishChange : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
