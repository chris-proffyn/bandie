# Supabase Multi-App Prototype Architecture

## 1. Purpose

This document defines a reusable Supabase architecture for hosting multiple early-stage applications on a single Supabase project/database instance.

The goal is to minimise database and platform costs while keeping each application logically isolated, easy to develop, and simple to split out into its own Supabase project later if usage grows.

This approach is intended for prototypes, MVPs, internal tools and early versions where:

- Overall usage is low.
- Storage volume is modest.
- Apps are owned by the same developer/company.
- Strict enterprise-grade tenant isolation is not yet required.
- The priority is speed, consistency, low cost and manageable operational complexity.

This document is intended to be used by Cursor as the implementation framework for all Supabase-backed apps in this shared instance.

---

## 2. Core Design Decision

Use **one Supabase project** as a shared platform for multiple apps.

Within that project:

- Supabase Auth is shared.
- The Postgres database is shared.
- Storage is shared but bucket names are app-prefixed.
- Edge Functions are shared but function names are app-prefixed.
- App-specific tables are created in the `public` schema using an app-code prefix.
- Shared platform tables manage app registration, user-to-app membership, roles and app-level metadata.

Example app codes:

| App | App Code | Example Table |
|---|---:|---|
| Bandie | `bandie` | `bandie_profiles` |
| ModeWise | `modewise` | `modewise_profiles` |
| PopUpPay | `popuppay` | `popuppay_events` |
| Proffyn Tools | `proffyn` | `proffyn_clients` |

---

## 3. Architectural Principles

### 3.1 One Supabase Project, Many Logical Apps

All apps share the same Supabase project. Logical separation is achieved through:

- App registry tables.
- User/app membership tables.
- App-prefixed table names.
- App-prefixed storage buckets.
- App-prefixed edge function names.
- Row Level Security policies.
- Strict naming conventions.

### 3.2 App Code Is the Primary Namespace

Every app must have a short, stable, lowercase app code.

Rules:

- Lowercase only.
- Use letters, numbers and underscores.
- No spaces.
- No hyphens in database object names.
- Keep codes short but recognisable.
- Once created, app codes should not be changed.

Examples:

```text
bandie
modewise
popuppay
proffyn
```

### 3.3 Shared Tables Are Platform Tables

Tables that support the shared Supabase environment should use a `platform_` prefix.

Examples:

```text
platform_apps
platform_user_app_memberships
platform_roles
platform_audit_log
```

### 3.4 App Tables Are App-Prefixed

Every project-specific table must start with the app code.

Examples:

```text
bandie_profiles
bandie_bands
bandie_band_members
bandie_songs
bandie_setlists
bandie_calendar_events

modewise_profiles
modewise_practice_sessions
modewise_user_progress

popuppay_profiles
popuppay_events
popuppay_vendors
popuppay_transactions
```

### 3.5 Do Not Use Separate Supabase Auth Projects Per App

Use one Supabase Auth system.

A single authenticated user can belong to one or many apps.

The system determines app access through `platform_user_app_memberships`.

### 3.6 RLS Is Mandatory

Every app-specific table must have Row Level Security enabled.

No app-specific table should be readable or writable by authenticated users unless an explicit RLS policy permits it.

### 3.7 Service Role Is Server-Side Only

The Supabase service role key must never be used in browser or mobile app code.

It may only be used in trusted server-side contexts, such as:

- Supabase Edge Functions.
- Secure backend scripts.
- Admin-only maintenance jobs.
- Local development scripts not committed to source control.

---

## 4. Recommended Data Model

### 4.1 Platform App Registry

Create a table to define each app hosted in the shared Supabase instance.

```sql
create table if not exists public.platform_apps (
  id uuid primary key default gen_random_uuid(),
  app_code text not null unique,
  app_name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_apps_app_code_format
    check (app_code ~ '^[a-z][a-z0-9_]*$'),

  constraint platform_apps_status_check
    check (status in ('active', 'paused', 'archived'))
);
```

Example seed data:

```sql
insert into public.platform_apps (app_code, app_name, description)
values
  ('bandie', 'Bandie', 'Band management and promotion platform'),
  ('modewise', 'ModeWise', 'Guitar fretboard and practice platform'),
  ('popuppay', 'PopUpPay', 'Temporary EPOS for pop-up events')
on conflict (app_code) do nothing;
```

---

### 4.2 Platform User/App Memberships

This table links Supabase Auth users to apps.

```sql
create table if not exists public.platform_user_app_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_code text not null references public.platform_apps(app_code) on delete cascade,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_user_app_memberships_unique
    unique (user_id, app_code),

  constraint platform_user_app_memberships_role_check
    check (role in ('owner', 'admin', 'member', 'user', 'viewer')),

  constraint platform_user_app_memberships_status_check
    check (status in ('active', 'invited', 'suspended', 'removed'))
);
```

In practice, membership creation should usually happen through a secure onboarding function, not directly from the client.

---

### 4.3 Optional Platform User Profile

Supabase Auth stores identity and login details. Application profile data should live in your own tables.

A shared user profile can be useful if one person uses multiple apps.

```sql
create table if not exists public.platform_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_app_code text references public.platform_apps(app_code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Use this for cross-app user-level details only.

Do not use this table for app-specific profile data.

---

### 4.4 App-Specific Profile Tables

Each app should have its own profile table if it needs app-specific user metadata.

Example for Bandie:

```sql
create table if not exists public.bandie_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  preferred_instrument text,
  profile_image_url text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_profiles_user_unique unique (user_id)
);
```

Example for ModeWise:

```sql
create table if not exists public.modewise_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_level text,
  preferred_instrument text default 'guitar',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint modewise_profiles_user_unique unique (user_id)
);
```

---

## 5. Tenancy Model

This architecture has two layers of tenancy.

### 5.1 Platform-Level App Tenancy

The first level determines which apps a user can access.

Example:

| User | App | Role |
|---|---|---|
| Chris | Bandie | owner |
| Chris | ModeWise | admin |
| Test User 1 | Bandie | member |
| Test User 2 | PopUpPay | vendor |

This is managed by:

```text
platform_user_app_memberships
```

### 5.2 App-Level Domain Tenancy

Within an app, there may be a second level of tenancy.

For example:

Bandie:

- App = Bandie
- Tenant/domain entity = Band
- A user can belong to one or many bands.

PopUpPay:

- App = PopUpPay
- Tenant/domain entity = Event Organiser
- Vendors belong to events.

ModeWise:

- App = ModeWise
- Tenant/domain entity may simply be the user.

Each app should define its own domain-level tenancy rules.

Example for Bandie:

```sql
create table if not exists public.bandie_bands (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bandie_band_members (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),

  constraint bandie_band_members_unique unique (band_id, user_id),
  constraint bandie_band_members_role_check
    check (role in ('owner', 'admin', 'member', 'viewer')),
  constraint bandie_band_members_status_check
    check (status in ('active', 'invited', 'removed'))
);
```

---

## 6. Row Level Security Framework

### 6.1 Helper Function: Check App Membership

Create a reusable helper function to check whether the current authenticated user belongs to an app.

```sql
create or replace function public.platform_current_user_has_app_access(target_app_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_user_app_memberships m
    where m.user_id = auth.uid()
      and m.app_code = target_app_code
      and m.status = 'active'
  );
$$;
```

### 6.2 Helper Function: Check App Role

```sql
create or replace function public.platform_current_user_has_app_role(
  target_app_code text,
  allowed_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_user_app_memberships m
    where m.user_id = auth.uid()
      and m.app_code = target_app_code
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;
```

### 6.3 RLS on Platform Memberships

Enable RLS:

```sql
alter table public.platform_user_app_memberships enable row level security;
```

Allow users to see their own memberships:

```sql
create policy "Users can view their own app memberships"
on public.platform_user_app_memberships
for select
to authenticated
using (user_id = auth.uid());
```

Do not allow users to self-create arbitrary memberships from the client.

Membership creation should happen via:

- Admin-only Edge Function.
- App onboarding flow.
- Invite acceptance flow.
- Manual SQL during prototyping.

---

### 6.4 RLS Pattern for App Profile Tables

Example: Bandie profiles.

```sql
alter table public.bandie_profiles enable row level security;
```

Read own Bandie profile only if user has Bandie access:

```sql
create policy "Bandie users can view own profile"
on public.bandie_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
);
```

Insert own Bandie profile only if user has Bandie access:

```sql
create policy "Bandie users can insert own profile"
on public.bandie_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
);
```

Update own Bandie profile only if user has Bandie access:

```sql
create policy "Bandie users can update own profile"
on public.bandie_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
)
with check (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
);
```

---

### 6.5 RLS Pattern for App Domain Tables

For domain tables, app-level access is necessary but not always sufficient.

Example: Bandie song access should require:

1. User has access to the Bandie app.
2. User belongs to the relevant band.

Example song table:

```sql
create table if not exists public.bandie_songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  title text not null,
  artist text,
  genre text,
  key text,
  duration_seconds integer,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Helper function:

```sql
create or replace function public.bandie_current_user_is_band_member(target_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bandie_band_members bm
    where bm.band_id = target_band_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  );
$$;
```

RLS:

```sql
alter table public.bandie_songs enable row level security;

create policy "Band members can view songs"
on public.bandie_songs
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

create policy "Band members can create songs"
on public.bandie_songs
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
  and created_by = auth.uid()
);

create policy "Band members can update songs"
on public.bandie_songs
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);
```

---

## 7. Authentication Model

### 7.1 Shared Supabase Auth

All apps use the same Supabase Auth project.

Each frontend app connects to the same Supabase URL and public anon/publishable key.

Example environment variables per frontend:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
VITE_APP_CODE=bandie
```

For React Native:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
EXPO_PUBLIC_APP_CODE=modewise
```

### 7.2 App Association After Login

After login, each app must check whether the user has access to that app.

Example client-side flow:

```ts
const APP_CODE = import.meta.env.VITE_APP_CODE;

const { data: memberships, error } = await supabase
  .from('platform_user_app_memberships')
  .select('app_code, role, status')
  .eq('app_code', APP_CODE)
  .eq('status', 'active');

if (error) {
  throw error;
}

if (!memberships || memberships.length === 0) {
  // Show "No access to this app" or run onboarding.
}
```

The RLS policy ensures the user can only see their own membership rows.

### 7.3 First-Use App Onboarding

Each app needs a deliberate onboarding rule.

#### Pattern A: Open Prototype Access

Any authenticated user can create their membership for selected prototype apps.

Use only for low-risk prototypes.

```sql
create policy "Authenticated users can join Bandie prototype"
on public.platform_user_app_memberships
for insert
to authenticated
with check (
  user_id = auth.uid()
  and app_code = 'bandie'
  and role = 'user'
  and status = 'active'
);
```

#### Pattern B: Invite/Admin Access

Users can only access an app if an admin creates or invites the membership.

Use for apps with sensitive data.

#### Pattern C: Auto-Provision Through Edge Function

The app calls an Edge Function after first login. The function validates whether the app allows open signup, then creates:

- `platform_user_app_memberships`
- `platform_profiles`
- app-specific profile row

Recommended Edge Function name:

```text
platform_onboard_user_to_app
```

Or app-specific:

```text
bandie_onboard_user
```

---

## 8. Frontend App Configuration

Each app must define its app code centrally.

Example:

```ts
export const APP_CONFIG = {
  appCode: 'bandie',
  appName: 'Bandie',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};
```

Do not scatter literal app codes throughout the app.

Use helper functions:

```ts
export function tableName(baseName: string) {
  return `${APP_CONFIG.appCode}_${baseName}`;
}
```

Example:

```ts
await supabase
  .from(tableName('profiles'))
  .select('*');
```

For strongly typed projects, prefer explicit table names over dynamic table names once types are generated.

---

## 9. Naming Standards

### 9.1 Tables

Format:

```text
<app_code>_<domain_noun_plural>
```

Examples:

```text
bandie_bands
bandie_band_members
bandie_songs
bandie_setlists
bandie_gigs
bandie_storage_files

modewise_profiles
modewise_practice_sessions
modewise_fretboard_progress

popuppay_events
popuppay_vendors
popuppay_payments
```

### 9.2 Shared Platform Tables

Format:

```text
platform_<domain_noun_plural>
```

Examples:

```text
platform_apps
platform_profiles
platform_user_app_memberships
platform_audit_log
```

### 9.3 Storage Buckets

Format:

```text
<app_code>-<bucket-purpose>
```

Examples:

```text
bandie-public
bandie-private
bandie-song-sheets
bandie-profile-images

modewise-public
modewise-user-files

popuppay-receipts
popuppay-event-assets
```

### 9.4 Storage Object Paths

Use structured paths that include the domain tenant where relevant.

Bandie example:

```text
bands/<band_id>/songs/<song_id>/lead-guitar/file.pdf
bands/<band_id>/songs/<song_id>/lyrics/file.pdf
bands/<band_id>/profile/logo.png
```

ModeWise example:

```text
users/<user_id>/practice-exports/session-<session_id>.json
```

PopUpPay example:

```text
organisers/<organiser_id>/events/<event_id>/assets/banner.png
```

### 9.5 Edge Functions

Format:

```text
<app_code>_<action>
```

Examples:

```text
bandie_onboard_user
bandie_generate_setlist_summary
bandie_process_song_upload

modewise_create_practice_session
modewise_calculate_progress

popuppay_create_checkout_session
popuppay_handle_stripe_webhook
```

Shared platform functions:

```text
platform_onboard_user_to_app
platform_get_user_apps
platform_admin_invite_user
```

---

## 10. Storage Architecture

### 10.1 Bucket Strategy

Use separate buckets per app/purpose.

Do not store all files in one global bucket unless there is a strong reason.

Recommended Bandie buckets:

```text
bandie-public
bandie-private
bandie-song-sheets
```

Recommended ModeWise buckets:

```text
modewise-public
modewise-user-files
```

Recommended PopUpPay buckets:

```text
popuppay-public
popuppay-private
popuppay-receipts
```

### 10.2 Public vs Private Buckets

Use public buckets only for assets intended to be publicly accessible.

Examples:

- Band logos.
- Public band images.
- Marketing assets.
- Public profile images.

Use private buckets for:

- Song sheets.
- Contracts.
- Receipts.
- Personal user exports.
- Anything related to payments.
- Anything uploaded by users that should not be public.

### 10.3 Storage Metadata Table

For anything more complex than simple public assets, create an app-specific metadata table.

Example:

```sql
create table if not exists public.bandie_files (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null,
  object_path text not null,
  band_id uuid references public.bandie_bands(id) on delete cascade,
  song_id uuid references public.bandie_songs(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  file_type text,
  display_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),

  constraint bandie_files_bucket_object_unique unique (bucket_name, object_path)
);
```

This gives the app a relational record for each file and allows easier RLS checks.

### 10.4 Storage RLS Principle

Storage policies should check:

1. Bucket name starts with or equals the relevant app bucket.
2. User has app access.
3. User has access to the related domain object where applicable.

For private app files, avoid relying only on path naming for security. Use app metadata tables wherever practical.

---

## 11. Edge Function Architecture

### 11.1 Function Naming

Every function must be either:

- App-specific, prefixed by app code.
- Platform-level, prefixed by `platform_`.

Examples:

```text
bandie_process_song_upload
modewise_record_practice_result
popuppay_create_payment_intent
platform_onboard_user_to_app
```

### 11.2 Function Security

Default rule:

- User-facing functions should require a valid user JWT.
- Functions should create a Supabase client using the caller’s auth context where possible.
- Use service role only for operations that genuinely require elevated permissions.

### 11.3 Environment Variables

Shared environment variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

App-specific environment variables:

```env
BANDIE_ALLOWED_ORIGINS=
BANDIE_MAX_UPLOAD_MB=

MODEWISE_FREE_TIER_LIMIT=
MODEWISE_PLUS_ENABLED=

POPUPPAY_STRIPE_SECRET_KEY=
POPUPPAY_STRIPE_WEBHOOK_SECRET=
```

Never expose server-side secrets to frontend/mobile apps.

### 11.4 Edge Function Pattern

Example pseudo-pattern:

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_CODE = 'bandie';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader ?? '',
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from('platform_user_app_memberships')
    .select('role')
    .eq('app_code', APP_CODE)
    .eq('status', 'active')
    .single();

  if (membershipError || !membership) {
    return new Response('Forbidden', { status: 403 });
  }

  // Continue with app-specific action.
});
```

---

## 12. Migration Strategy

### 12.1 Use Supabase CLI Migrations

All schema changes must be implemented through migration files.

Do not rely on manual dashboard-only changes.

Recommended folder structure:

```text
supabase/
  migrations/
    202606260001_platform_core.sql
    202606260002_bandie_core.sql
    202606260003_modewise_core.sql
    202606260004_popuppay_core.sql
  functions/
    platform_onboard_user_to_app/
    bandie_onboard_user/
    modewise_create_practice_session/
```

### 12.2 Migration Naming

Format:

```text
YYYYMMDDHHMM_<scope>_<description>.sql
```

Examples:

```text
202606260001_platform_core.sql
202606260002_bandie_profiles.sql
202606260003_bandie_songs.sql
202606260004_modewise_profiles.sql
```

### 12.3 Migration Rules for Cursor

Cursor must:

1. Create platform migrations first.
2. Create app migrations after platform core exists.
3. Enable RLS on every app table.
4. Create RLS policies in the same migration or immediately following migration.
5. Add indexes for all foreign keys and common filters.
6. Avoid destructive changes unless explicitly requested.
7. Include rollback notes in migration comments where a migration is risky.

---

## 13. Indexing Standards

Add indexes for:

- `user_id`
- `app_code`
- Foreign keys
- Tenant/domain IDs
- Status columns used in filters
- Created date if used for ordering

Examples:

```sql
create index if not exists idx_platform_memberships_user_id
on public.platform_user_app_memberships(user_id);

create index if not exists idx_platform_memberships_app_code
on public.platform_user_app_memberships(app_code);

create index if not exists idx_bandie_band_members_user_id
on public.bandie_band_members(user_id);

create index if not exists idx_bandie_songs_band_id
on public.bandie_songs(band_id);

create index if not exists idx_bandie_songs_created_at
on public.bandie_songs(created_at desc);
```

---

## 14. Audit Logging

For prototypes, a lightweight platform audit table is sufficient.

```sql
create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  app_code text references public.platform_apps(app_code),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

Example events:

```text
bandie.song.created
bandie.song.updated
bandie.setlist.created
modewise.practice_session.completed
popuppay.event.created
popuppay.payment.received
```

For early prototypes, audit logs can be inserted from Edge Functions or trusted backend flows.

---

## 15. App Onboarding Checklist

When adding a new app to the shared Supabase instance, Cursor must perform the following steps.

### 15.1 Define App Code

Example:

```text
bandie
```

Confirm:

- App code is lowercase.
- App code is short.
- App code is stable.
- App code does not conflict with existing apps.

### 15.2 Insert App Registry Row

```sql
insert into public.platform_apps (app_code, app_name, description)
values ('bandie', 'Bandie', 'Band management and promotion platform')
on conflict (app_code) do nothing;
```

### 15.3 Create App Tables

All app tables must use the app prefix.

Example:

```text
bandie_profiles
bandie_bands
bandie_band_members
```

### 15.4 Enable RLS

Every app table must have:

```sql
alter table public.<table_name> enable row level security;
```

### 15.5 Add RLS Policies

Every table must have explicit policies.

Minimum policy requirements:

- Who can select?
- Who can insert?
- Who can update?
- Who can delete?

If delete is not needed, do not add a delete policy.

### 15.6 Create Storage Buckets

Create only the buckets needed for the app.

Examples:

```text
bandie-public
bandie-private
bandie-song-sheets
```

### 15.7 Create Storage Policies

Add policies for:

- Read.
- Upload.
- Update.
- Delete, only if required.

### 15.8 Create Edge Functions

All app functions must be app-prefixed.

Examples:

```text
bandie_onboard_user
bandie_process_song_upload
```

### 15.9 Add Frontend Environment Variables

Example:

```env
VITE_APP_CODE=bandie
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 15.10 Generate Types

After migrations are applied, regenerate Supabase types for the app.

Example output location:

```text
src/lib/supabase/database.types.ts
```

---

## 16. Cursor Implementation Rules

Cursor must follow these rules when building against this architecture.

### 16.1 Never Create Unprefixed App Tables

Bad:

```text
profiles
songs
events
payments
```

Good:

```text
bandie_profiles
bandie_songs
popuppay_events
popuppay_payments
```

### 16.2 Never Use Service Role in Frontend Code

Frontend apps must only use the public anon/publishable key.

Service role usage is only permitted in:

- Edge Functions.
- Backend scripts.
- Local admin scripts outside the client bundle.

### 16.3 Always Check App Membership

Every app must check user membership after login.

The app should not assume that any authenticated user belongs to the app.

### 16.4 Always Enable RLS

Every user-facing table must have RLS enabled.

A table without RLS should be considered a security defect unless it is deliberately admin-only and inaccessible through client APIs.

### 16.5 Prefer Explicit App Tables Over Generic Mega-Tables

Do not create one giant `items` table shared by every app.

For this prototype model, clarity is more valuable than over-abstracted reuse.

Use:

```text
bandie_songs
modewise_practice_sessions
popuppay_events
```

rather than:

```text
app_entities
generic_records
tenant_data
```

### 16.6 Keep App Logic Separate

Do not mix app-specific logic across apps.

Bad:

```ts
if (appCode === 'bandie') {
  // song logic
} else if (appCode === 'popuppay') {
  // payment logic
}
```

Good:

```text
/apps/bandie
/apps/modewise
/apps/popuppay
```

Each app should have its own data access layer.

---

## 17. Suggested Monorepo Structure

If multiple apps are developed from one codebase:

```text
repo-root/
  apps/
    bandie-web/
    modewise-web/
    popuppay-web/
  packages/
    supabase-shared/
      client.ts
      auth.ts
      app-access.ts
      types.ts
    ui/
  supabase/
    migrations/
    functions/
      platform_onboard_user_to_app/
      bandie_onboard_user/
      bandie_process_song_upload/
      modewise_create_practice_session/
      popuppay_create_checkout_session/
```

If apps are separate repositories, each app should still follow the same naming and membership model.

---

## 18. Example: Bandie Core Schema

```sql
create table if not exists public.bandie_bands (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  location text,
  public_profile_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bandie_band_members (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),

  constraint bandie_band_members_unique unique (band_id, user_id)
);

create table if not exists public.bandie_songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  title text not null,
  artist text,
  genre text,
  song_key text,
  duration_seconds integer,
  gig_ready boolean not null default false,
  times_played integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS:

```sql
alter table public.bandie_bands enable row level security;
alter table public.bandie_band_members enable row level security;
alter table public.bandie_songs enable row level security;

create policy "Bandie members can view their bands"
on public.bandie_bands
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_band_members bm
    where bm.band_id = bandie_bands.id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  )
);

create policy "Bandie members can view band songs"
on public.bandie_songs
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);
```

---

## 19. Limitations of This Model

This architecture is suitable for prototypes and early products, but it has limitations.

### 19.1 Shared Blast Radius

All apps share one Supabase project.

A major database issue could affect every app.

### 19.2 Shared Auth

A user identity exists globally across all apps.

This is efficient, but it means identity settings are shared.

### 19.3 RLS Complexity Grows Over Time

As more apps are added, policies become more numerous.

This is manageable for prototypes but should be reviewed as products mature.

### 19.4 No Hard Infrastructure Isolation

This is logical isolation, not separate infrastructure isolation.

For mature, revenue-generating or sensitive apps, consider splitting into dedicated Supabase projects.

---

## 20. When to Split an App Into Its Own Supabase Project

Consider moving an app to its own Supabase project when:

- It has real paying customers.
- It handles sensitive financial, health, legal or child-related data.
- It needs separate backups.
- It needs independent scaling.
- It has a different compliance profile.
- It needs separate auth configuration.
- It needs production-grade operational isolation.
- RLS or migration complexity becomes hard to manage.
- It requires independent team access controls.

---

## 21. Migration Path to a Dedicated Supabase Project

Because every app table, bucket and function is prefixed, extraction should be straightforward.

For app `bandie`, export:

```text
bandie_*
```

Also export related platform records:

```text
platform_apps where app_code = 'bandie'
platform_user_app_memberships where app_code = 'bandie'
platform_audit_log where app_code = 'bandie'
```

Storage buckets:

```text
bandie-*
```

Edge Functions:

```text
bandie_*
```

The target dedicated Supabase project may rename tables by removing the prefix, but this is optional.

For lower-risk migration, keep the prefixes even after extraction.

---

## 22. Recommended Initial Build Order

Cursor should implement the shared Supabase architecture in this order:

1. Create platform core migration.
2. Create helper functions.
3. Enable RLS on platform tables.
4. Create app registry seed data.
5. Create first app schema, for example Bandie.
6. Add app-specific RLS helper functions.
7. Add app-specific policies.
8. Create storage buckets.
9. Add storage metadata tables.
10. Add storage RLS policies.
11. Create onboarding Edge Function.
12. Add frontend membership check.
13. Generate Supabase types.
14. Add smoke tests for app access and isolation.

---

## 23. Smoke Tests

For each app, test the following.

### 23.1 User Without App Access

Given:

- User is authenticated.
- User has no membership row for `bandie`.

Expected:

- User cannot read `bandie_profiles`.
- User cannot read `bandie_bands`.
- User cannot read `bandie_songs`.
- User cannot upload to `bandie-*` private buckets.
- App shows “no access” or onboarding screen.

### 23.2 User With App Access

Given:

- User is authenticated.
- User has active membership for `bandie`.

Expected:

- User can read their own Bandie profile.
- User can create their own Bandie profile.
- User can access permitted Bandie domain data.

### 23.3 User With Access to One App Only

Given:

- User has access to `bandie`.
- User does not have access to `modewise`.

Expected:

- User can access permitted Bandie data.
- User cannot access ModeWise data.
- User cannot upload to ModeWise private buckets.

### 23.4 Domain-Level Isolation

Given:

- User belongs to Band A.
- User does not belong to Band B.

Expected:

- User can view Band A songs.
- User cannot view Band B songs.
- User cannot update Band B songs.

---

## 24. Final Recommendation

Use this shared Supabase instance as a low-cost prototype platform.

The key rules are:

- One Supabase project.
- Shared Auth.
- `platform_` tables for cross-app concerns.
- App-prefixed tables for app-specific data.
- App-prefixed storage buckets.
- App-prefixed Edge Functions.
- Mandatory RLS on all user-facing tables.
- Membership checked through `platform_user_app_memberships`.
- Service role used only in secure backend contexts.
- Migrations used for every schema change.

This gives you a practical balance between low cost, fast delivery and enough isolation to support multiple early-stage apps safely.
