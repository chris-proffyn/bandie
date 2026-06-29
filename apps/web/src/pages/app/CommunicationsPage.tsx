import { useCallback, useEffect, useState } from 'react';
import { getCommunicationSummary, type CommunicationFilter } from '@bandie/data';
import { CommunicationsFeed } from '../../components/communications/CommunicationsFeed';
import { IncomingBandInvitationsPanel } from '../../components/communications/IncomingBandInvitationsPanel';
import { IncomingPlayerOutreachPanel } from '../../components/communications/IncomingPlayerOutreachPanel';
import { OutgoingInvitesPanel } from '../../components/communications/OutgoingInvitesPanel';
import { UserMessagesPanel } from '../../components/communications/UserMessagesPanel';
import '../../styles/communications.css';

const FILTER_OPTIONS: { value: CommunicationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'invites', label: 'Invites' },
  { value: 'enquiries', label: 'Booking enquiries' },
  { value: 'messages', label: 'Messages' },
];

export function CommunicationsPage() {
  const [filter, setFilter] = useState<CommunicationFilter>('all');
  const [hideResolvedInvites, setHideResolvedInvites] = useState(true);
  const [summary, setSummary] = useState({
    pendingInvitations: 0,
    pendingPlayerOutreach: 0,
    unreadMessages: 0,
    unreadBookingEnquiries: 0,
    total: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const refreshSummary = useCallback(async () => {
    setLoadingSummary(true);

    try {
      const next = await getCommunicationSummary();
      setSummary(next);
    } catch {
      setSummary({
        pendingInvitations: 0,
        pendingPlayerOutreach: 0,
        unreadMessages: 0,
        unreadBookingEnquiries: 0,
        total: 0,
      });
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const pendingInvites = summary.pendingInvitations + summary.pendingPlayerOutreach;

  return (
    <div className="communications-page">
      <header className="communications-header">
        <div>
          <p className="my-bands-eyebrow">Workspace</p>
          <h1>Communications</h1>
          <p className="my-bands-lead">
            Invitations and messages across Bandie — sent and received. Accept invites, reply to
            messages, and track invites you have sent as a band leader.
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
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={`communications-filter-btn ${filter === option.value ? 'active' : ''}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            {option.value === 'invites' && pendingInvites > 0 ? (
              <span className="communications-filter-badge">{pendingInvites}</span>
            ) : null}
            {option.value === 'messages' && summary.unreadMessages > 0 ? (
              <span className="communications-filter-badge">{summary.unreadMessages}</span>
            ) : null}
            {option.value === 'enquiries' && summary.unreadBookingEnquiries > 0 ? (
              <span className="communications-filter-badge">{summary.unreadBookingEnquiries}</span>
            ) : null}
            {option.value === 'all' && summary.total > 0 ? (
              <span className="communications-filter-badge">{summary.total}</span>
            ) : null}
          </button>
        ))}
      </div>

      {filter === 'all' || filter === 'invites' ? (
        <label className="communications-hide-resolved-toggle">
          <input
            type="checkbox"
            checked={hideResolvedInvites}
            onChange={(event) => setHideResolvedInvites(event.target.checked)}
          />
          Hide accepted & declined invites
        </label>
      ) : null}

      {filter === 'all' ? (
        <section className="panel communications-section">
          <CommunicationsFeed
            filter="all"
            hideResolvedInvites={hideResolvedInvites}
            onChanged={refreshSummary}
          />
        </section>
      ) : null}

      {filter === 'invites' ? (
        <>
          <section className="panel communications-section">
            <div className="communications-section-head">
              <div>
                <h2>Sent invites</h2>
                <p className="profile-section-intro">
                  Join and audition invites you have sent to players, plus email membership
                  invitations — including accepted and declined outcomes.
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
                <h2>Received invites from bands</h2>
                <p className="profile-section-intro">
                  Join or audition invites sent from the player directory, with any message from the
                  band leader.
                </p>
              </div>
              {summary.pendingPlayerOutreach > 0 ? (
                <span className="communications-count-badge">{summary.pendingPlayerOutreach}</span>
              ) : null}
            </div>
            <IncomingPlayerOutreachPanel
              onChanged={refreshSummary}
              hideResolvedInvites={hideResolvedInvites}
            />
          </section>

          <section className="panel communications-section">
            <div className="communications-section-head">
              <div>
                <h2>Received band membership invitations</h2>
                <p className="profile-section-intro">
                  Email invitations to join a band workspace as a member, admin, or viewer.
                </p>
              </div>
              {summary.pendingInvitations > 0 ? (
                <span className="communications-count-badge">{summary.pendingInvitations}</span>
              ) : null}
            </div>
            <IncomingBandInvitationsPanel
              onChanged={refreshSummary}
              hideResolvedInvites={hideResolvedInvites}
            />
          </section>
        </>
      ) : null}

      {filter === 'enquiries' ? (
        <section className="panel communications-section">
          <div className="communications-section-head">
            <div>
              <h2>Booking enquiries</h2>
              <p className="profile-section-intro">
                Structured booking requests from public band profiles, with venue and date context.
              </p>
            </div>
            {summary.unreadBookingEnquiries > 0 ? (
              <span className="communications-count-badge">{summary.unreadBookingEnquiries}</span>
            ) : null}
          </div>
          <CommunicationsFeed filter="enquiries" onChanged={refreshSummary} />
        </section>
      ) : null}

      {filter === 'messages' ? (
        <section className="panel communications-section">
          <div className="communications-section-head">
            <div>
              <h2>Direct messages</h2>
              <p className="profile-section-intro">
                Send messages to other Bandie users, reply to conversations, and track read status.
              </p>
            </div>
            {summary.unreadMessages > 0 ? (
              <span className="communications-count-badge">{summary.unreadMessages}</span>
            ) : null}
          </div>
          <UserMessagesPanel onChanged={refreshSummary} />
        </section>
      ) : null}
    </div>
  );
}
