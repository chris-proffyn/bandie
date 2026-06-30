import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCommunicationSummary, type CommunicationFilter } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { CommunicationsFeed } from '../../components/communications/CommunicationsFeed';
import { IncomingBandInvitationsPanel } from '../../components/communications/IncomingBandInvitationsPanel';
import { IncomingOrganiserInvitationsPanel } from '../../components/communications/IncomingOrganiserInvitationsPanel';
import { IncomingPlayerOutreachPanel } from '../../components/communications/IncomingPlayerOutreachPanel';
import { OutgoingInvitesPanel } from '../../components/communications/OutgoingInvitesPanel';
import { UserMessagesPanel } from '../../components/communications/UserMessagesPanel';
import '../../styles/communications.css';

type FilterOption = {
  value: CommunicationFilter;
  label: string;
  playerOnly?: boolean;
};

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'player_invites', label: 'Player invites', playerOnly: true },
  { value: 'gig_invites', label: 'Gig invites' },
  { value: 'messages', label: 'Messages' },
];

export function CommunicationsPage() {
  const { workspaceMode } = useAuth();
  const isOrganiserView = workspaceMode === 'organiser';

  const [filter, setFilter] = useState<CommunicationFilter>('all');
  const [hideResolvedInvites, setHideResolvedInvites] = useState(true);
  const [hideReadMessages, setHideReadMessages] = useState(true);
  const [summary, setSummary] = useState({
    pendingInvitations: 0,
    pendingOrganiserInvitations: 0,
    pendingPlayerOutreach: 0,
    unreadMessages: 0,
    unreadBookingEnquiries: 0,
    unreadGigInvites: 0,
    total: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const visibleFilters = useMemo(
    () => FILTER_OPTIONS.filter((option) => !(option.playerOnly && isOrganiserView)),
    [isOrganiserView],
  );

  const refreshSummary = useCallback(async () => {
    setLoadingSummary(true);

    try {
      const next = await getCommunicationSummary();
      setSummary(next);
    } catch {
      setSummary({
        pendingInvitations: 0,
        pendingOrganiserInvitations: 0,
        pendingPlayerOutreach: 0,
        unreadMessages: 0,
        unreadBookingEnquiries: 0,
        unreadGigInvites: 0,
        total: 0,
      });
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const pendingPlayerInvites = summary.pendingInvitations + summary.pendingPlayerOutreach;
  const pendingGeneralMessages = summary.unreadMessages + summary.unreadBookingEnquiries;

  return (
    <div className="communications-page">
      <header className="communications-header">
        <div>
          <p className="my-bands-eyebrow">Workspace</p>
          <h1>Communications</h1>
          <p className="my-bands-lead">
            {isOrganiserView
              ? 'Gig invites, booking enquiries, and direct messages with bands and organisers. Gig invites and player invites are actionable; general messages can be hidden once read.'
              : 'Player invites from band leaders, gig invites from organisers, and general messages. Accept or decline invites here; hide read messages when you are caught up.'}
            {loadingSummary ? null : summary.total > 0 ? (
              <>
                {' '}
                You have {summary.total} unread{' '}
                {summary.total === 1 ? 'item' : 'items'} waiting.
              </>
            ) : null}
          </p>
        </div>
      </header>

      <div className="communications-filter-bar" role="tablist" aria-label="Communication filters">
        {visibleFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={`communications-filter-btn ${filter === option.value ? 'active' : ''}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            {option.value === 'player_invites' && pendingPlayerInvites > 0 ? (
              <span className="communications-filter-badge">{pendingPlayerInvites}</span>
            ) : null}
            {option.value === 'gig_invites' && summary.unreadGigInvites > 0 ? (
              <span className="communications-filter-badge">{summary.unreadGigInvites}</span>
            ) : null}
            {option.value === 'messages' && pendingGeneralMessages > 0 ? (
              <span className="communications-filter-badge">{pendingGeneralMessages}</span>
            ) : null}
            {option.value === 'all' && summary.total > 0 ? (
              <span className="communications-filter-badge">{summary.total}</span>
            ) : null}
          </button>
        ))}
      </div>

      {filter === 'all' || filter === 'player_invites' || filter === 'gig_invites' ? (
        <label className="communications-hide-resolved-toggle">
          <input
            type="checkbox"
            checked={hideResolvedInvites}
            onChange={(event) => setHideResolvedInvites(event.target.checked)}
          />
          Hide resolved invites
        </label>
      ) : null}

      {filter === 'messages' ? (
        <label className="communications-hide-resolved-toggle">
          <input
            type="checkbox"
            checked={hideReadMessages}
            onChange={(event) => setHideReadMessages(event.target.checked)}
          />
          Hide read messages
        </label>
      ) : null}

      {filter === 'all' ? (
        <>
          <IncomingOrganiserInvitationsPanel onChanged={refreshSummary} />
          <section className="panel communications-section">
            <CommunicationsFeed
              filter="all"
              hideResolvedInvites={hideResolvedInvites}
              onChanged={refreshSummary}
            />
          </section>
        </>
      ) : null}

      {filter === 'gig_invites' ? (
        <section className="panel communications-section">
          <div className="communications-section-head">
            <div>
              <h2>Gig invites</h2>
              <p className="profile-section-intro">
                {isOrganiserView
                  ? 'Formal gig invitations you have sent to bands, with band responses.'
                  : 'Gig invitations from organisers linked to a specific gig. Accept or decline here, or open the gig for setlist and slot details.'}
              </p>
            </div>
            {summary.unreadGigInvites > 0 ? (
              <span className="communications-count-badge">{summary.unreadGigInvites}</span>
            ) : null}
          </div>
          <CommunicationsFeed
            filter="gig_invites"
            hideResolvedInvites={hideResolvedInvites}
            onChanged={refreshSummary}
          />
        </section>
      ) : null}

      {filter === 'player_invites' && !isOrganiserView ? (
        <>
          <section className="panel communications-section">
            <div className="communications-section-head">
              <div>
                <h2>Sent player invites</h2>
                <p className="profile-section-intro">
                  Join and audition invites you have sent to players, plus email membership
                  invitations.
                </p>
              </div>
            </div>
            <OutgoingInvitesPanel
              onChanged={refreshSummary}
              hideResolvedInvites={hideResolvedInvites}
            />
          </section>

          <section className="panel communications-section">
            <div className="communications-section-head">
              <div>
                <h2>Received player invites</h2>
                <p className="profile-section-intro">
                  Join or audition invites from band leaders, and email invitations to join a band
                  workspace.
                </p>
              </div>
              {pendingPlayerInvites > 0 ? (
                <span className="communications-count-badge">{pendingPlayerInvites}</span>
              ) : null}
            </div>
            <IncomingPlayerOutreachPanel
              onChanged={refreshSummary}
              hideResolvedInvites={hideResolvedInvites}
            />
            <IncomingBandInvitationsPanel
              onChanged={refreshSummary}
              hideResolvedInvites={hideResolvedInvites}
            />
          </section>
        </>
      ) : null}

      {filter === 'messages' ? (
        <section className="panel communications-section">
          <div className="communications-section-head">
            <div>
              <h2>General messages</h2>
              <p className="profile-section-intro">
                Direct messages and booking enquiries that are not formal invites. Reply inline or
                hide read items when you are up to date.
              </p>
            </div>
            {pendingGeneralMessages > 0 ? (
              <span className="communications-count-badge">{pendingGeneralMessages}</span>
            ) : null}
          </div>
          <UserMessagesPanel onChanged={refreshSummary} showMessageList={false} />
          <CommunicationsFeed
            filter="messages"
            hideReadMessages={hideReadMessages}
            onChanged={refreshSummary}
          />
        </section>
      ) : null}
    </div>
  );
}
