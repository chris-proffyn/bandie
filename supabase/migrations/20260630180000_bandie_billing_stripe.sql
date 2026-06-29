-- Phase 15: Stripe billing — webhook idempotency, customer lookup, grace period.

alter table public.bandie_profiles
  add column if not exists stripe_customer_id text;

create unique index if not exists bandie_profiles_stripe_customer_id_unique
  on public.bandie_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.bandie_subscriptions
  add column if not exists grace_period_ends_at timestamptz;

create table if not exists public.bandie_stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  constraint bandie_stripe_webhook_events_stripe_event_id_unique unique (stripe_event_id)
);

create index if not exists bandie_stripe_webhook_events_processed_idx
  on public.bandie_stripe_webhook_events (processed_at desc);

alter table public.bandie_stripe_webhook_events enable row level security;

drop policy if exists "Platform admins can read stripe webhook events" on public.bandie_stripe_webhook_events;
create policy "Platform admins can read stripe webhook events"
on public.bandie_stripe_webhook_events
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

-- Service role inserts webhook events (no client insert policy).

comment on table public.bandie_stripe_webhook_events is
  'Idempotent Stripe webhook processing log; writes via service role only.';
