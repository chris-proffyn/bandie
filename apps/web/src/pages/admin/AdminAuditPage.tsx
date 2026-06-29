import { useEffect, useState } from 'react';
import { listAuditEvents, type AuditEvent } from '@bandie/data';

export function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAuditEvents()
      .then(setEvents)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load audit log.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel">
      <p className="my-bands-eyebrow">Audit</p>
      <h2>Admin audit log</h2>
      {loading ? <p className="workspace-empty-note">Loading audit events…</p> : null}
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Event</th>
            <th>Actor</th>
            <th>Subject</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.created_at).toLocaleString('en-GB')}</td>
              <td>{event.event_type}</td>
              <td>{event.actor_id ?? '—'}</td>
              <td>
                {event.subject_type ?? '—'}
                {event.subject_id ? `/${event.subject_id}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
