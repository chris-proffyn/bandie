import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatGigInviteStatus, type GigBandInviteWithBand } from '@bandie/data';
import type { FindGigContext } from '../../lib/findGigNavigation';
import { buildFindGigUrl } from '../../lib/findGigNavigation';
import { useAuth } from '../../context/AuthContext';
import { GigInviteModal } from './GigInviteModal';

type GigInvitePanelProps = {
  bandId: string;
  bandName: string;
  findGig: FindGigContext;
  existingInvite?: GigBandInviteWithBand | null;
  onInvited?: () => void;
};

export function GigInvitePanel({
  bandId,
  bandName,
  findGig,
  existingInvite,
  onInvited,
}: GigInvitePanelProps) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const gigLabel = useMemo(
    () => findGig.gigTitle?.trim() || 'your gig',
    [findGig.gigTitle],
  );

  return (
    <section className="workspace-section panel gig-invite-panel">
      <h2>Invite to gig</h2>
      <p className="workspace-section-intro">
        Finding bands for <strong>{gigLabel}</strong>. Send an invite and the band leader will be
        notified in their communications.
      </p>

      {existingInvite ? (
        <p className="workspace-empty-note">
          Already invited — {formatGigInviteStatus(existingInvite.invite_status)}.
          {' '}
          <Link to={`/app/gigs/${findGig.gigId}`}>Back to gig planning</Link>
        </p>
      ) : (
        <div className="gig-invite-panel-actions">
          <button type="button" className="auth-button" onClick={() => setModalOpen(true)}>
            Invite {bandName} to gig
          </button>
          <Link to={buildFindGigUrl(findGig)} className="directory-btn directory-btn-secondary">
            Back to directory
          </Link>
          <Link to={`/app/gigs/${findGig.gigId}`} className="directory-btn directory-btn-secondary">
            Back to gig
          </Link>
        </div>
      )}

      <GigInviteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        findGig={findGig}
        bandId={bandId}
        bandName={bandName}
        organiserEmail={user?.email}
        existingInvite={existingInvite}
        onInvited={onInvited}
      />
    </section>
  );
}
