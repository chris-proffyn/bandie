import { useEffect, useState } from 'react';
import {
  aggregateDailyMetrics,
  listMetricSnapshots,
  logAdminAuditEvent,
  snapshotsToCsv,
  type MetricSnapshot,
} from '@bandie/data';

export function AdminMetricsPage() {
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function loadSnapshots() {
    setLoading(true);
    setError(null);

    try {
      const rows = await listMetricSnapshots();
      setSnapshots(rows);
      const latest = rows[0]?.updated_at ?? null;
      setLastUpdated(latest);
    } catch (err) {
      setSnapshots([]);
      setError(err instanceof Error ? err.message : 'Unable to load metrics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSnapshots();
  }, []);

  async function handleAggregate() {
    setAggregating(true);
    setError(null);

    try {
      await aggregateDailyMetrics();
      await logAdminAuditEvent({ eventType: 'metrics.aggregated' });
      await loadSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aggregation failed.');
    } finally {
      setAggregating(false);
    }
  }

  function handleExport() {
    const csv = snapshotsToCsv(snapshots);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bandie-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    void logAdminAuditEvent({ eventType: 'metrics.exported' });
  }

  const headline = snapshots.filter(
    (row) => row.segment_type === 'global' && ['dau', 'wau', 'mau'].includes(row.metric_key),
  );

  return (
    <div className="admin-main">
      <section className="panel">
        <p className="my-bands-eyebrow">Metrics</p>
        <h2>Platform metrics</h2>
        <p className="my-bands-lead">
          DAU/WAU/MAU and content totals from daily snapshots.
          {lastUpdated ? ` Last updated ${new Date(lastUpdated).toLocaleString('en-GB')}.` : null}
        </p>
        <div className="gig-detail-actions">
          <button type="button" className="auth-button" onClick={() => void handleAggregate()} disabled={aggregating}>
            {aggregating ? 'Aggregating…' : 'Run daily aggregation'}
          </button>
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={handleExport}
            disabled={!snapshots.length}
          >
            Export CSV
          </button>
        </div>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      </section>

      <section className="panel">
        <h3>Headline metrics</h3>
        {loading ? <p className="workspace-empty-note">Loading metrics…</p> : null}
        <div className="admin-metrics-grid">
          {headline.map((row) => (
            <article key={`${row.metric_date}-${row.metric_key}`} className="admin-metric-card">
              <span>
                {row.metric_key.toUpperCase()} · {row.metric_date}
              </span>
              <strong>{row.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>All snapshots</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Metric</th>
              <th>Segment</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((row) => (
              <tr key={row.id}>
                <td>{row.metric_date}</td>
                <td>{row.metric_key}</td>
                <td>
                  {row.segment_type}/{row.segment_key}
                </td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
