import { useCallback, useEffect, useState } from 'react';
import {
  formatInvitationStatusLabel,
  isInvitationAwaitingResponse,
  isResolvedInviteStatus,
  listMyReceivedPlayerOutreach,
  playerOutreachTypeLabel,
  respondToPlayerOutreach,
  type ReceivedPlayerOutreach,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

type IncomingPlayerOutreachPanelProps = {
  onChanged?: () => void;
  compact?: boolean;
  hideResolvedInvites?: boolean;
};

function filterReceivedOutreach(
  rows: ReceivedPlayerOutreach[],
  hideResolvedInvites: boolean,
): ReceivedPlayerOutreach[] {
  if (!hideResolvedInvites) {
    return rows;
  }

  return rows.filter((row) => !isResolvedInviteStatus(row.status));
}

export function IncomingPlayerOutreachPanel({
  onChanged,
  compact = false,
  hideResolvedInvites = false,
}: IncomingPlayerOutreachPanelProps) {
  const { refreshBands } = useAuth();
  const [outreach, setOutreach] = useState<ReceivedPlayerOutreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadOutreach = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listMyReceivedPlayerOutreach();
      setOutreach(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load band invites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutreach();
  }, [loadOutreach]);

  async function handleRespond(outreachId: string, accept: boolean) {
    setActingId(outreachId);
    setError(null);

    try {
      await respondToPlayerOutreach(outreachId, accept);
      if (accept) {
        await refreshBands();
      }
      await loadOutreach();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update invite.');
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return <p className="workspace-empty-note">Loading band invites…</p>;
  }

  const visibleOutreach = filterReceivedOutreach(outreach, hideResolvedInvites);

  if (!outreach.length) {
    if (compact) {
      return null;
    }

    return (
      <p className="workspace-empty-note">
        No pending invites from bands. When a leader invites you from the player directory, it
        will appear here.
      </p>
    );
  }

  if (!visibleOutreach.length) {
    return (
      <p className="workspace-empty-note">
        No open band invites. Turn off “Hide accepted & declined” to see resolved invites.
      </p>
    );
  }

  return (
    <div className="communications-section-body">
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <ul className="communications-outreach-list">
        {visibleOutreach.map((item) => {
          const awaitingResponse = isInvitationAwaitingResponse(item.status);

          return (
            <li key={item.id} className="communications-outreach-item">
              <div className="communications-outreach-head">
                <div>
                  <span className="communications-type-badge">
                    {playerOutreachTypeLabel(item.invite_type)}
                  </span>
                  <strong>{item.band_name}</strong>
                  <div className="communications-item-meta">
                    {item.inviter_display_name ? `From ${item.inviter_display_name}` : 'From band leader'}
                    {item.band_part_title ? ` · ${item.band_part_title}` : null}
                    {!awaitingResponse ? ` · ${formatInvitationStatusLabel(item.status)}` : null}
                  </div>
                </div>
                {awaitingResponse ? (
                  <div className="communications-item-actions">
                    <button
                      type="button"
                      className="auth-button auth-button-secondary"
                      disabled={actingId === item.id}
                      onClick={() => {
                        void handleRespond(item.id, false);
                      }}
                    >
                      {actingId === item.id ? 'Working…' : 'Decline'}
                    </button>
                    <button
                      type="button"
                      className="auth-button"
                      disabled={actingId === item.id}
                      onClick={() => {
                        void handleRespond(item.id, true);
                      }}
                    >
                      {actingId === item.id ? 'Working…' : item.invite_type === 'join' ? 'Accept' : 'Confirm'}
                    </button>
                  </div>
                ) : null}
              </div>
              {item.message ? (
                <p className="communications-outreach-message">{item.message}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
