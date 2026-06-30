import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  listMyMessages,
  markMessageRead,
  replyToMessage,
  sendDirectMessage,
  type UserMessage,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

type UserMessagesPanelProps = {
  onChanged?: () => void;
  showCompose?: boolean;
  showMessageList?: boolean;
  filter?: 'all' | 'received' | 'sent';
};

type MessageListProps = {
  messages: UserMessage[];
  currentUserId: string;
  emptyLabel: string;
  onMarkRead: (message: UserMessage) => void;
  onReply: (message: UserMessage) => void;
};

function formatMessageParty(message: UserMessage, currentUserId: string): string {
  const isIncoming = message.recipient_user_id === currentUserId;
  const displayName = isIncoming ? message.sender_display_name : message.recipient_display_name;
  const username = isIncoming ? message.sender_username : message.recipient_username;

  if (displayName?.trim()) {
    return displayName.trim();
  }

  if (username?.trim()) {
    return `@${username.trim()}`;
  }

  return 'Bandie user';
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateBody(body: string, maxLength = 120): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function MessageList({
  messages,
  currentUserId,
  emptyLabel,
  onMarkRead,
  onReply,
}: MessageListProps) {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  async function handleReplySubmit(event: FormEvent, message: UserMessage) {
    event.preventDefault();
    setSubmittingReply(true);
    setReplyError(null);

    try {
      await replyToMessage({ messageId: message.id, body: replyBody });
      setReplyBody('');
      setReplyingToId(null);
      onReply(message);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Unable to send reply.');
    } finally {
      setSubmittingReply(false);
    }
  }

  if (messages.length === 0) {
    return <p className="workspace-empty-note">{emptyLabel}</p>;
  }

  return (
    <ul className="communications-message-list">
      {messages.map((message) => {
        const isIncoming = currentUserId === message.recipient_user_id;
        const isUnread = isIncoming && message.read_at == null;
        const isReplying = replyingToId === message.id;

        return (
          <li
            key={message.id}
            className={`communications-message-item ${isUnread ? 'communications-message-item-unread' : ''}`}
          >
            <div className="communications-message-head">
              <div>
                <strong>{formatMessageParty(message, currentUserId)}</strong>
                <div className="communications-item-meta">
                  {formatTimestamp(message.created_at)}
                  {isUnread ? ' · Unread' : null}
                </div>
              </div>
              <div className="communications-item-actions">
                <button
                  type="button"
                  className="auth-button auth-button-secondary"
                  onClick={() => {
                    setReplyError(null);
                    setReplyBody('');
                    setReplyingToId(isReplying ? null : message.id);
                  }}
                >
                  {isReplying ? 'Cancel' : 'Reply'}
                </button>
                {isUnread ? (
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    onClick={() => {
                      onMarkRead(message);
                    }}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </div>
            {message.reply_to_body ? (
              <p className="communications-message-reply-context">
                In reply to: {truncateBody(message.reply_to_body)}
              </p>
            ) : null}
            <p className="communications-message-body">{message.body}</p>

            {isReplying ? (
              <form
                className="communications-reply-form auth-form"
                onSubmit={(event) => {
                  void handleReplySubmit(event, message);
                }}
              >
                {replyError ? (
                  <div className="auth-message auth-message-error">{replyError}</div>
                ) : null}
                <div className="auth-field">
                  <label htmlFor={`reply-${message.id}`}>Your reply</label>
                  <textarea
                    id={`reply-${message.id}`}
                    rows={3}
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder={`Reply to ${formatMessageParty(message, currentUserId)}…`}
                  />
                </div>
                <button className="auth-button" type="submit" disabled={submittingReply}>
                  {submittingReply ? 'Sending…' : 'Send reply'}
                </button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function UserMessagesPanel({
  onChanged,
  showCompose = true,
  showMessageList = true,
  filter = 'all',
}: UserMessagesPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = user?.id ?? '';

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await listMyMessages();
      setMessages(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const receivedMessages = useMemo(
    () => messages.filter((message) => message.recipient_user_id === currentUserId),
    [messages, currentUserId],
  );

  const sentMessages = useMemo(
    () => messages.filter((message) => message.sender_user_id === currentUserId),
    [messages, currentUserId],
  );

  async function handleMarkRead(message: UserMessage) {
    if (!user || message.recipient_user_id !== user.id || message.read_at) {
      return;
    }

    try {
      await markMessageRead(message.id);
      await loadMessages();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark message as read.');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await sendDirectMessage({
        recipientUsername,
        body,
      });
      setRecipientUsername('');
      setBody('');
      setSuccess('Message sent.');
      await loadMessages();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  }

  const showReceived = filter === 'all' || filter === 'received';
  const showSent = filter === 'all' || filter === 'sent';

  return (
    <div className="communications-section-body">
      {showCompose ? (
        <div className="communications-compose-block">
          <h3 className="communications-subsection-title">Send a message</h3>
          <form className="communications-compose auth-form" onSubmit={handleSubmit}>
            <div className="profile-editor-row-grid-dual">
              <div className="auth-field">
                <label htmlFor="messageRecipient">To (Bandie username)</label>
                <input
                  id="messageRecipient"
                  autoComplete="off"
                  placeholder="e.g. daltonc"
                  value={recipientUsername}
                  onChange={(event) => setRecipientUsername(event.target.value.toLowerCase())}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="messageBody">Message</label>
                <input
                  id="messageBody"
                  placeholder="Introduce yourself or follow up on a gig enquiry…"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </div>
            </div>
            <button className="auth-button auth-button-secondary" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      ) : null}

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {success ? <div className="auth-message auth-message-success">{success}</div> : null}

      {showMessageList && loading ? (
        <p className="workspace-empty-note">Loading messages…</p>
      ) : showMessageList && receivedMessages.length === 0 && sentMessages.length === 0 ? (
        <p className="workspace-empty-note">
          No messages yet. Send a note to another Bandie user by username, or browse the{' '}
          <Link to="/app/players" className="profile-preview-link">
            player directory
          </Link>{' '}
          to find musicians.
        </p>
      ) : showMessageList ? (
        <>
          {showReceived ? (
            <section className="communications-message-group" aria-label="Received messages">
              <div className="communications-subsection-head">
                <h3 className="communications-subsection-title">Received</h3>
                {receivedMessages.length ? (
                  <span className="communications-subsection-count">
                    {receivedMessages.length}{' '}
                    {receivedMessages.length === 1 ? 'message' : 'messages'}
                  </span>
                ) : null}
              </div>
              <MessageList
                messages={receivedMessages}
                currentUserId={currentUserId}
                emptyLabel="No received messages yet."
                onMarkRead={(message) => {
                  void handleMarkRead(message);
                }}
                onReply={() => {
                  void loadMessages();
                  onChanged?.();
                }}
              />
            </section>
          ) : null}

          {showSent ? (
            <section className="communications-message-group" aria-label="Sent messages">
              <div className="communications-subsection-head">
                <h3 className="communications-subsection-title">Sent</h3>
                {sentMessages.length ? (
                  <span className="communications-subsection-count">
                    {sentMessages.length} {sentMessages.length === 1 ? 'message' : 'messages'}
                  </span>
                ) : null}
              </div>
              <MessageList
                messages={sentMessages}
                currentUserId={currentUserId}
                emptyLabel="No sent messages yet."
                onMarkRead={(message) => {
                  void handleMarkRead(message);
                }}
                onReply={() => {
                  void loadMessages();
                  onChanged?.();
                }}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
