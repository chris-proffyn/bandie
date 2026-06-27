import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  formatBandMemberRoleLabel,
  getBandProfileForEdit,
  isBandLeaderRole,
  listBandMembersWithProfiles,
  updateBandProfile,
  type BandMemberWithProfile,
  type PublicBandProfile,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { BandInvitationsPanel } from '../../components/band/BandInvitationsPanel';
import { BandMemberCard } from '../../components/band/BandMemberCard';
import { BandWorkspaceProfileView } from '../../components/band/BandWorkspaceProfileView';
import '../../styles/workspace.css';

export function WorkspaceHomePage() {
  const { bandId } = useParams();
  const { bands, refreshBands, isAppAdmin } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const isLeader = isAppAdmin || isBandLeaderRole(membership?.member_role);

  const [profile, setProfile] = useState<PublicBandProfile | null>(null);
  const [members, setMembers] = useState<BandMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [profileResult, memberRows] = await Promise.all([
        getBandProfileForEdit(bandId),
        listBandMembersWithProfiles(bandId),
      ]);
      setProfile(profileResult);
      setMembers(memberRows);
    } catch (err) {
      setProfile(null);
      setMembers([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load band workspace.');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    loadWorkspace().catch(() => undefined);
  }, [loadWorkspace]);

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

  return (
    <div className="band-workspace-overview">
      <BandWorkspaceProfileView
        bandId={bandId}
        profile={profile}
        canEdit={isLeader}
        onProfileUpdated={handleProfileUpdated}
        onPublishChange={isLeader ? handlePublishChange : undefined}
      />

      <section className="workspace-section panel workspace-team-section">
        <div className="workspace-section-header">
          <div>
            <h2>Band members</h2>
            <p className="workspace-section-intro">
              {members.length} active member{members.length === 1 ? '' : 's'}
              {!isLeader
                ? ` · Your role: ${formatBandMemberRoleLabel(membership?.member_role ?? 'member')}`
                : ''}
            </p>
          </div>
          {isLeader ? (
            <Link to="/app/players" className="directory-btn directory-btn-secondary">
              Find players
            </Link>
          ) : null}
        </div>
        {members.length ? (
          <div className="band-member-grid">
            {members.map((member) => (
              <BandMemberCard key={member.id} member={member} canEditProfile={isAppAdmin} />
            ))}
          </div>
        ) : (
          <p className="workspace-empty-note">No active members yet.</p>
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
  );
}
