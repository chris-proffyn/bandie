import { getBandieClient } from './context';
import { getCurrentSession } from './auth';

export type MetricEventInput = {
  eventName: string;
  subjectType?: string;
  subjectId?: string;
  context?: Record<string, unknown>;
  occurredAt?: string;
};

export async function trackMetricEvent(input: MetricEventInput): Promise<void> {
  const session = await getCurrentSession();
  const client = getBandieClient();

  const { error } = await client.from('bandie_metric_events').insert({
    event_name: input.eventName,
    user_id: session?.user?.id ?? null,
    subject_type: input.subjectType ?? null,
    subject_id: input.subjectId ?? null,
    context: input.context ?? {},
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to track metric event', error.message);
  }
}

export type MetricSnapshot = {
  id: string;
  metric_date: string;
  metric_key: string;
  segment_type: string;
  segment_key: string;
  value: number;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export async function listMetricSnapshots(
  metricDate?: string,
): Promise<MetricSnapshot[]> {
  const client = getBandieClient();
  let query = client
    .from('bandie_daily_metric_snapshots')
    .select('*')
    .order('metric_key', { ascending: true });

  if (metricDate) {
    query = query.eq('metric_date', metricDate);
  } else {
    query = query.order('metric_date', { ascending: false }).limit(50);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MetricSnapshot[];
}

export async function aggregateDailyMetrics(metricDate?: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_aggregate_daily_metrics', {
    p_metric_date: metricDate ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function snapshotsToCsv(snapshots: MetricSnapshot[]): string {
  const header = 'metric_date,metric_key,segment_type,segment_key,value,updated_at';
  const rows = snapshots.map((row) =>
    [
      row.metric_date,
      row.metric_key,
      row.segment_type,
      row.segment_key,
      row.value,
      row.updated_at,
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export async function trackSessionActive(): Promise<void> {
  await trackMetricEvent({ eventName: 'session_active' });
}
