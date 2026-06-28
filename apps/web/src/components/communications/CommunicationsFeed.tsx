import { useCallback, useEffect, useState } from 'react';
import {
  acceptBandInvitation,
  declineBandInvitation,
  filterCommunications,
  filterResolvedSentCommunications,
  formatBandMemberRoleLabel,
  formatInvitationStatusLabel,
  formatUserWithEmail,
  isInvitationAwaitingResponse,
  listCommunications,
  playerOutreachTypeLabel,
  replyToMessage,
  markMessageRead,
  respondToPlayerOutreach,
  revokeBandInvitation,
  revokePlayerOutreach,
  type CommunicationFilter,
  type CommunicationItem,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

type CommunicationsFeedProps = {
  filter: CommunicationFilter;
  hideResolvedInvites?: boolean;
  onChanged?: () => void;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function FeedItem({
  item,
  currentUserId,
  onChanged,
}: {
  item: CommunicationItem;
  currentUserId: string;
  onChanged?: () => void;
}) {
  const { refreshBands } = useAuth();
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  async function runAction(action: () => Promise<void>) {
    setActing(true);
    setError(null);

    try {
      await action();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete action.');
    } finally {
      setActing(false);
    }
  }

  if (item.kind === 'band_invitation') {
    const invitation = item.invitation;
    const awaitingResponse = isInvitationAwaitingResponse(invitation.status);

    return (
      <li className="communications-feed-item">
        <div className="communications-feed-head">
          <span className="communications-type-badge">Band invitation</span>
          <span className="communications-item-meta">{formatTimestamp(item.created_at)}</span>
        </div>
        <strong>{invitation.band_name}</strong>
        <p className="communications-item-meta">
          Join as {formatBandMemberRoleLabel(invitation.role)}
          {!awaitingResponse ? ` · ${formatInvitationStatusLabel(invitation.status)}` : null}
        </p>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {awaitingResponse ? (
          <div className="communications-item-actions">
            <button
              type="button"
              className="auth-button auth-button-secondary"
              disabled={acting}
              onClick={() => {
                void runAction(async () => {
                  await declineBandInvitation(invitation.token);
                });
              }}
            >
              Decline
            </button>
            <button
              type="button"
              className="auth-button"
              disabled={acting}
              onClick={() => {
                void runAction(async () => {
                  await acceptBandInvitation(invitation.token);
                  await refreshBands();
                });
              }}
            >
              Accept
            </button>
          </div>
        ) : null}
      </li>
    );
  }

  if (item.kind === 'player_outreach') {
    const outreach = item.outreach;
    const awaitingResponse = isInvitationAwaitingResponse(outreach.status);

    return (
      <li className="communications-feed-item">
        <div className="communications-feed-head">
          <span className="communications-type-badge">
            {playerOutreachTypeLabel(outreach.invite_type)}
          </span>
          <span className="communications-item-meta">{formatTimestamp(item.created_at)}</span>
        </div>
        <strong>{outreach.band_name}</strong>
        <p className="communications-item-meta">
          {outreach.inviter_display_name ? `From ${outreach.inviter_display_name}` : 'From band leader'}
          {outreach.band_part_title ? ` · ${outreach.band_part_title}` : null}
          {!awaitingResponse ? ` · ${formatInvitationStatusLabel(outreach.status)}` : null}
        </p>
        {outreach.message ? <p className="communications-message-body">{outreach.message}</p> : null}
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {awaitingResponse ? (
          <div className="communications-item-actions">
            <button
              type="button"
              className="auth-button auth-button-secondary"
              disabled={acting}
              onClick={() => {
                void runAction(async () => {
                  await respondToPlayerOutreach(outreach.id, false);
                });
              }}
            >
              Decline
            </button>
            <button
              type="button"
              className="auth-button"
              disabled={acting}
              onClick={() => {
                void runAction(async () => {
                  await respondToPlayerOutreach(outreach.id, true);
                  if (outreach.invite_type === 'join') {
                    await refreshBands();
                  }
                });
              }}
            >
              {outreach.invite_type === 'join' ? 'Accept' : 'Confirm'}
            </button>
          </div>
        ) : null}
      </li>
    );
  }

  if (item.kind === 'sent_band_invitation') {
    const invitation = item.invitation;

    return (
      <li className="communications-feed-item">
        <div className="communications-feed-head">
          <span className="communications-type-badge communications-type-badge-sent">Sent</span>
          <span className="communications-type-badge">Band invitation</span>
          <span className="communications-item-meta">{formatTimestamp(item.created_at)}</span>
        </div>
        <strong>{invitation.band_name}</strong>
        <p className="communications-item-meta">
          To {formatUserWithEmail(invitation.invitee_display_name, invitation.email)} ·{' '}
          {formatBandMemberRoleLabel(invitation.role)} ·{' '}
          {formatInvitationStatusLabel(invitation.status)}
        </p>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {isInvitationAwaitingResponse(invitation.status) ? (
          <div className="communications-item-actions">
            <button
              type="button"
              className="auth-button auth-button-secondary"
              disabled={acting}
              onClick={() => {
                void runAction(async () => {
                  await revokeBandInvitation(invitation.id);
                });
              }}
            >
              Revoke
            </button>
          </div>
        ) : null}
      </li>
    );
  }

  if (item.kind === 'sent_player_outreach') {
    const outreach = item.outreach;

    return (
      <li className="communications-feed-item">
        <div className="communications-feed-head">
          <span className="communications-type-badge communications-type-badge-sent">Sent</span>
          <span className="communications-type-badge">
            {playerOutreachTypeLabel(outreach.invite_type)}
          </span>
          <span className="communications-item-meta">{formatTimestamp(item.created_at)}</span>
        </div>
        <strong>{outreach.player_display_name ?? outreach.player_email}</strong>
        <p className="communications-item-meta">
          {outreach.band_name}
          {outreach.band_part_title ? ` · ${outreach.band_part_title}` : null} ·{' '}
          {formatInvitationStatusLabel(outreach.status)}
        </p>
        {outreach.message ? <p className="communications-message-body">{outreach.message}</p> : null}
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {isInvitationAwaitingResponse(outreach.status) ? (
          <div className="communications-item-actions">
            <button
              type="button"
              className="auth-button auth-button-secondary"
              disabled={acting}
              onClick={() => {
                void runAction(async () => {
                  await revokePlayerOutreach(outreach.id);
                });
              }}
            >
              Revoke
            </button>
          </div>
        ) : null}
      </li>
    );
  }

  if (item.kind !== 'message') {
    return null;
  }

  const message = item.message;
  const isIncoming = message.recipient_user_id === currentUserId;
  const isUnread = isIncoming && message.read_at == null;
  const partyName =
    (isIncoming ? message.sender_display_name : message.recipient_display_name)?.trim() ||
    (isIncoming ? message.sender_username : message.recipient_username)?.trim();

  return (
    <li
      className={`communications-feed-item ${isUnread ? 'communications-message-item-unread' : ''}`}
    >
      <div className="communications-feed-head">
        <span className="communications-type-badge">{isIncoming ? 'Message received' : 'Message sent'}</span>
        <span className="communications-item-meta">{formatTimestamp(item.created_at)}</span>
      </div>
      <strong>{partyName ? (partyName.startsWith('@') ? partyName : partyName) : 'Bandie user'}</strong>
      {message.reply_to_body ? (
        <p className="communications-message-reply-context">
          In reply to: {message.reply_to_body.slice(0, 120)}
          {message.reply_to_body.length > 120 ? '…' : ''}
        </p>
      ) : null}
      <p className="communications-message-body">{message.body}</p>
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      <div className="communications-item-actions">
        {isIncoming ? (
          <>
            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={() => {
                setShowReply((value) => !value);
              }}
            >
              {showReply ? 'Cancel' : 'Reply'}
            </button>
            {isUnread ? (
              <button
                type="button"
                className="auth-button auth-button-secondary"
                disabled={acting}
                onClick={() => {
                  void runAction(async () => {
                    await markMessageRead(message.id);
                  });
                }}
              >
                Mark read
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      {showReply ? (
        <form
          className="communications-reply-form auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(async () => {
              await replyToMessage({ messageId: message.id, body: replyBody });
              setReplyBody('');
              setShowReply(false);
            });
          }}
        >
          <div className="auth-field">
            <label htmlFor={`feed-reply-${message.id}`}>Your reply</label>
            <textarea
              id={`feed-reply-${message.id}`}
              rows={3}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
            />
          </div>
          <button className="auth-button" type="submit" disabled={acting}>
            {acting ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      ) : null}
    </li>
  );
}

export function CommunicationsFeed({
  filter,
  hideResolvedInvites = false,
  onChanged,
}: CommunicationsFeedProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<CommunicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allItems = await listCommunications();
      const filtered = filterCommunications(allItems, filter);
      setItems(filterResolvedSentCommunications(filtered, hideResolvedInvites));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load communications.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, hideResolvedInvites]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  if (loading) {
    return <p className="workspace-empty-note">Loading communications…</p>;
  }

  if (error) {
    return <div className="auth-message auth-message-error">{error}</div>;
  }

  if (!items.length) {
    return (
      <p className="workspace-empty-note">
        {hideResolvedInvites && (filter === 'all' || filter === 'invites')
          ? 'No open communications in this view. Uncheck “Hide accepted & declined invites” to see resolved invites.'
          : 'No communications in this view yet. Invitations and messages from across Bandie will appear here.'}
      </p>
    );
  }

  return (
    <ul className="communications-feed-list">
      {items.map((item) => (
        <FeedItem
          key={`${item.kind}-${item.id}`}
          item={item}
          currentUserId={user?.id ?? ''}
          onChanged={() => {
            void loadFeed();
            onChanged?.();
          }}
        />
      ))}
    </ul>
  );
}
