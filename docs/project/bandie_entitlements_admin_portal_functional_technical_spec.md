# Bandie Tier Entitlements, Feature Control, Usage Limits and Admin Portal — Functional and Technical Specification

**Document status:** Draft specification  
**Product:** Bandie  
**Area:** Monetisation, subscriptions, feature gating, usage limits, entitlement control, admin operations and platform metrics  
**Intended use:** Source document for product, design, engineering, admin tooling and Cursor-led implementation  
**Last updated:** 29 June 2026  

---

## 1. Executive Summary

Bandie needs a flexible way to control which users and accounts can access which features, and how much of each feature they can use. The platform has multiple user types — players, bands and organisers — and each may need different free and paid entitlements.

The objective is to avoid hard-coding pricing tiers directly into product logic. Instead, Bandie should implement a configurable entitlement and usage-limit framework that allows administrators to:

- Define tiers such as Free Player, Player Plus, Free Band, Bandie Band, Bandie Pro Band, Free Organiser and Organiser Plus.
- Attach features to tiers.
- Attach usage limits to tiers.
- Move features between tiers without changing application code.
- Set limits such as songs per band, setlists per band, venues per organiser, storage per workspace, active gig count or open mic event count.
- Check entitlements consistently in the frontend, backend and database security model.
- Present upgrade prompts when a user or workspace reaches a limit.
- Track usage accurately and safely.
- Support future commercial experiments, grandfathered plans, trials, promotional access and custom plans.

This specification recommends a **plan + entitlement + usage metering** model.

At a high level:

- **Plans** define commercial packages.
- **Entitlements** define what a plan allows.
- **Usage meters** track how much of a limited resource has been consumed.
- **Feature gates** control whether a user can perform a specific action.
- **Limit gates** control whether a user can create more of a limited object.
- **Billing subscriptions** map real-world payment status to active plans.
- **Access checks** are enforced in backend services and database row-level security, not only in the UI.

---

## 2. Background and Product Context

Bandie is designed around three major user groups:

1. **Players** — individual musicians who create profiles, join bands, respond to invites and may later search for gigs or dep opportunities.
2. **Bands** — band accounts/workspaces that use Bandie to promote themselves, manage members, songs, setlists, gig readiness, song files, rehearsals, bookings and availability.
3. **Organisers** — people or organisations that create venues, search for bands, manage events, create open mic nights and send booking enquiries.

The monetisation strategy is expected to include both feature-based and usage-based controls. Examples include:

- A free player can create a player profile and respond to band invitations, but cannot create a band.
- A paid player or band leader can create a band workspace.
- A free band can upload a limited number of songs and create one setlist.
- A paid band can upload more songs, create more setlists and access song folders.
- An organiser can register one venue for free.
- A paid organiser can register multiple venues and manage more event types.
- Open mic / jam night functionality may be available on a per-event basis or as part of an organiser tier.

Because these rules are likely to change during product discovery, implementation should be designed for commercial flexibility.

---

## 3. Goals

The entitlement system should enable Bandie to:

1. Launch simple free and paid tiers quickly.
2. Support multiple user types and account types.
3. Gate both features and usage volume.
4. Allow tiers and limits to be changed through data/configuration rather than code.
5. Support product experiments and pricing changes.
6. Ensure that users cannot bypass gates by calling APIs directly.
7. Provide clear user-facing upgrade messages.
8. Support future billing integration with Stripe or another payment provider.
9. Allow internal administrators to grant exceptions, trials and custom entitlements.
10. Provide auditability for entitlement decisions and subscription changes.

---

## 4. Non-Goals for Initial Version

The first implementation does not need to include:

- Complex enterprise contract pricing.
- Full coupon management beyond what Stripe provides.
- Usage-based invoicing where every extra item is billed automatically.
- Real-time proration logic inside Bandie.
- A full admin pricing console in the first MVP.
- Per-seat billing for all band members.
- Marketplace commission settlement logic.

These may be added later.

---

## 5. Key Principles

## 5.1 Configuration over Code

Feature and limit rules should be stored in database tables or structured configuration. Application code should ask the entitlement service whether an action is allowed, rather than embedding logic such as:

```ts
if (plan === 'band_pro') {
  allowSongFolderCreation();
}
```

Instead, the code should use checks such as:

```ts
canPerform({
  actorId: user.id,
  subjectType: 'band',
  subjectId: band.id,
  capability: 'song_folder.create'
});
```

## 5.2 Enforce Server-Side

Frontend gates improve user experience, but they are not security. All entitlement checks must be enforced on the backend, and critical access should be protected by database row-level security where appropriate.

## 5.3 Separate Roles from Plans

Roles and pricing plans are different concepts.

A user may have a role such as:

- Player
- Band owner
- Band admin
- Band member
- Organiser owner
- Venue manager
- Platform admin

A workspace may have a plan such as:

- Band Free
- Bandie Band
- Bandie Pro Band
- Organiser Free
- Organiser Plus

Roles determine what the user can do within an account. Plans determine which capabilities the account has purchased or unlocked.

Example:

- A band may be on Bandie Pro.
- A drummer may be a normal band member.
- The drummer still should not be able to delete the band just because the band is on a paid plan.

## 5.4 Use Account/Workspace-Level Billing Where Possible

For Bandie, most paid value sits at the workspace level rather than the individual level.

Recommended billing subjects:

| Subject | Billing approach |
|---|---|
| Individual player | Free initially; optional individual Plus later |
| Band workspace | Main subscription object |
| Organiser account | Subscription or per-event charge |
| Venue | Usually belongs to organiser account; may be limited by plan |
| Open mic event | Can be per-event purchase or included in organiser tier |

## 5.5 Support Feature Gates and Limit Gates

Bandie needs two categories of entitlement:

1. **Feature entitlement** — can this account use this feature at all?
2. **Usage entitlement** — how many of this resource can this account create or use?

Examples:

| Gate type | Example |
|---|---|
| Feature gate | Can create song folders? |
| Feature gate | Can use poster generator? |
| Feature gate | Can send band booking enquiry? |
| Limit gate | Maximum songs = 6 |
| Limit gate | Maximum setlists = 1 |
| Limit gate | Maximum venues = 1 |
| Limit gate | Maximum storage = 250MB |

---

## 6. Proposed Tier Model

The following tier model is illustrative. It should be configurable and not hard-coded.

## 6.1 Player Tiers

### Player Free

Purpose: maximise network growth and allow players to participate in bands.

| Capability | Access |
|---|---:|
| Create player profile | Yes |
| Edit own player profile | Yes |
| List instruments and genres | Yes |
| Respond to band invites | Yes |
| Join existing bands by invite | Yes |
| View own band memberships | Yes |
| Create band workspace | No |
| Create song folders | No |
| Create organiser account | Optional / No |
| Send outbound band recruitment messages | Limited or No |
| Promote player profile | No |

### Player Plus — optional future tier

Purpose: support players looking for gigs, dep work or enhanced visibility.

| Capability | Access |
|---|---:|
| Create player profile | Yes |
| Enhanced profile | Yes |
| Public availability calendar | Yes |
| Dep/gig availability status | Yes |
| Featured player listing | Optional |
| Create band workspace | Optional, depending on commercial strategy |
| Apply to more opportunities | Higher limits |

Note: Player Plus should not be required for a player to be a useful band member. Charging players too early may reduce network growth.

## 6.2 Band Tiers

### Band Free

Purpose: allow bands to create a profile, seed the directory and experience workspace value.

| Capability / Resource | Limit |
|---|---:|
| Create public band profile | Yes |
| Appear in band directory | Yes, basic listing |
| Invite band members | Up to 5 members |
| Songs | 6 songs |
| Setlists | 1 setlist |
| Song folders | No or limited preview |
| File uploads | 100–250MB total |
| Calendar availability | Basic |
| Gig records | 1 active gig |
| Booking enquiries | Receive basic enquiries |
| Poster generator | Watermarked or no |
| Custom URL / branding | No |
| Analytics | No |

### Bandie Band

Purpose: main paid tier for ordinary amateur bands.

| Capability / Resource | Limit |
|---|---:|
| Public band profile | Full standard profile |
| Directory listing | Standard |
| Band members | Up to 10 |
| Songs | 100 |
| Setlists | Unlimited or 50 |
| Song folders | Yes |
| Part-specific folders | Yes |
| File uploads | 5–10GB |
| Calendar availability | Full |
| Gig records | Unlimited or high cap |
| Booking enquiries | Full inbox |
| Notifications | Standard |
| Mobile/performance mode | Basic |
| Poster generator | Standard |

### Bandie Pro Band

Purpose: gigging bands that want better promotion, booking and professional presentation.

| Capability / Resource | Limit |
|---|---:|
| Enhanced public band profile / EPK | Yes |
| Featured directory options | Yes |
| Custom profile URL | Yes |
| Advanced media blocks | Yes |
| Band members | Up to 20 or unlimited fair use |
| Songs | Unlimited fair use |
| Setlists | Unlimited fair use |
| File uploads | 25–50GB |
| Booking pipeline | Yes |
| Enquiry templates | Yes |
| Poster generator | Full |
| Analytics | Yes |
| Dep / guest access | Yes |
| Priority support | Optional |

## 6.3 Organiser Tiers

### Organiser Free

Purpose: bring demand into the marketplace.

| Capability / Resource | Limit |
|---|---:|
| Register organiser profile | Yes |
| Register venue | 1 venue |
| Search band directory | Yes |
| Save shortlist | Limited |
| Send booking enquiries | Limited or fair use |
| Create event brief | 1 active event |
| Open mic night | No or one trial event |
| Poster generator | No or watermarked |

### Organiser Plus

Purpose: venues, promoters and repeat organisers.

| Capability / Resource | Limit |
|---|---:|
| Venues | Multiple, e.g. 5 or 10 |
| Event briefs | Multiple active events |
| Band shortlists | Unlimited |
| Booking enquiry management | Full |
| Open mic / jam night tools | Included or discounted |
| Promotional poster generator | Yes |
| Venue roster | Yes |
| Notes and follow-up tracking | Yes |

## 6.4 Open Mic / Event Packs

Open mic functionality may be monetised separately from organiser subscription.

| Pack | Example access |
|---|---|
| One-off Open Mic Event | One event, one date, signups, running order, poster |
| Monthly Open Mic Pack | Up to 4 events/month |
| Venue Open Mic Pro | Recurring nights, player database, analytics |

This should be implemented as entitlements in the same framework, not as a separate one-off code path.

---

## 7. Functional Requirements

## 7.1 Plan Management

Bandie must support a catalogue of plans.

Each plan should have:

- Internal code, e.g. `band_free`, `band_standard`, `band_pro`.
- Display name, e.g. “Bandie Pro Band”.
- User-facing description.
- Subject type, e.g. `player`, `band`, `organiser`, `venue`, `event`.
- Billing interval, e.g. monthly, annual, one-off, free.
- Public visibility flag.
- Status, e.g. draft, active, retired.
- Display order.
- Payment provider mapping, e.g. Stripe product ID and price ID.

## 7.2 Entitlement Management

Each plan must have a set of entitlements.

An entitlement may be one of:

| Entitlement type | Example |
|---|---|
| Boolean feature | `song_folder.create = true` |
| Numeric limit | `songs.max_count = 6` |
| Storage limit | `storage.max_bytes = 250000000` |
| Rate limit | `booking_enquiry.send_per_month = 20` |
| Visibility rule | `directory.featured = false` |
| Add-on access | `open_mic.events_included = 1` |

Entitlements should be data-driven and editable by authorised administrators.

## 7.3 Feature Gate Checks

Before a user performs a gated action, the application must check:

1. Is the user authenticated?
2. What account/workspace is the action being performed against?
3. What role does the user have in that account/workspace?
4. What active plan applies to the account/workspace?
5. Does the plan include the required feature entitlement?
6. If usage-limited, is the account still within its limit?
7. Are there overrides, trials or add-ons that alter the answer?

Example gated actions:

| Action | Capability key |
|---|---|
| Create band workspace | `band.create` |
| Create song | `song.create` |
| Create song folder | `song_folder.create` |
| Upload song file | `song_file.upload` |
| Create setlist | `setlist.create` |
| Create gig | `gig.create` |
| Create organiser venue | `venue.create` |
| Create open mic event | `open_mic.create` |
| Generate poster | `poster.generate` |
| Use custom URL | `profile.custom_url` |
| Send bulk message | `message.bulk_send` |

## 7.4 Usage Limit Checks

Bandie must support usage checks against account-level resources.

Examples:

| Resource | Subject | Limit example |
|---|---|---:|
| Songs | Band | 6 on free tier |
| Setlists | Band | 1 on free tier |
| Song folders | Band | 0 or disabled on free tier |
| Band members | Band | 5 on free tier |
| Storage bytes | Band | 250MB on free tier |
| Venues | Organiser | 1 on free tier |
| Active events | Organiser | 1 on free tier |
| Open mic events | Organiser | 0 or 1 trial |
| Booking enquiries sent | Organiser | Monthly cap |
| Featured profile boosts | Band | Monthly cap |

Usage checks must occur before creating new resources or uploading files.

## 7.5 Upgrade Prompts

When a user tries to use a feature or exceed a limit, Bandie should show a clear upgrade prompt.

Examples:

### Feature locked

> Song folders are available on Bandie Band and above. Upgrade to organise parts, files and notes by song.

### Limit reached

> Your free band workspace includes 6 songs. Upgrade to Bandie Band to add up to 100 songs and unlock song folders.

### Organiser venue limit reached

> Free organiser accounts can manage 1 venue. Upgrade to Organiser Plus to add more venues and manage repeat events.

Each upgrade prompt should include:

- What the user tried to do.
- Why it is blocked.
- Which plan unlocks it.
- A call to action to upgrade.
- Optional comparison details.

## 7.6 Admin Overrides

Bandie should allow authorised platform admins to grant exceptions.

Override types:

| Override type | Example |
|---|---|
| Feature override | Allow song folders on a specific free band |
| Limit override | Increase songs limit from 6 to 20 |
| Trial override | Give Bandie Pro for 30 days |
| Custom plan | Assign non-public plan to a workspace |
| Manual comp | Free paid-tier access for partner/early adopter |

All overrides must have:

- Reason.
- Created by.
- Created at.
- Expiry date where applicable.
- Audit trail.

## 7.7 Trials

Bandie should support trials for paid plans.

Trial requirements:

- Trial can be attached to a workspace or user.
- Trial has start and end date.
- Trial grants the target plan’s entitlements during the trial.
- On expiry, access reverts to the previous plan unless converted.
- Users should be warned before trial expiry.
- Resources created during a trial should remain visible after expiry, but creation/editing may be restricted if the reverted plan does not support them.

Example:

A band on Free starts a 14-day Bandie Band trial. During the trial it creates 20 songs and 5 setlists. When the trial expires, the band reverts to Free. The songs and setlists remain visible, but the band cannot add more songs or setlists until it upgrades.

## 7.8 Grandfathering

Pricing and entitlements may change over time. Existing customers may need to keep old limits.

Requirements:

- Plans can be retired without deleting them.
- Existing subscriptions can remain on retired plans.
- New customers cannot choose retired plans.
- Entitlements can be versioned.
- Grandfathered accounts should be clearly labelled internally.

## 7.9 Add-ons

Bandie should support add-ons that modify a base plan.

Examples:

| Add-on | Effect |
|---|---|
| Extra storage | Adds 10GB |
| Extra venue pack | Adds 5 venues |
| Open mic event pack | Adds 1 event or 4 monthly events |
| Featured profile boost | Adds promotional placement |
| Extra band members | Adds 5 member seats |

Add-ons should be implemented as entitlement modifiers.

## 7.10 User Experience Requirements

### Account settings

Each workspace should have a plan/settings page showing:

- Current plan.
- Billing status.
- Renewal date where applicable.
- Usage against limits.
- Available upgrade options.
- Add-ons.
- Trial status.

Example usage display:

| Resource | Usage |
|---|---:|
| Songs | 6 / 6 |
| Setlists | 1 / 1 |
| Storage | 180MB / 250MB |
| Members | 4 / 5 |

### In-context indicators

Where limits apply, relevant screens should display usage indicators:

- Songs dashboard: “6 of 6 songs used”.
- Setlist page: “1 of 1 free setlists used”.
- Organiser venues: “1 of 1 venues used”.
- Storage: “180MB of 250MB used”.

### Locked UI states

Locked features should be visible but clearly labelled where useful. This helps users understand what is available on paid tiers.

Example:

- “Song folders — Upgrade required”.
- “Advanced profile analytics — Pro”.
- “Custom URL — Pro”.

Do not hide all paid features completely; hide only where showing them would confuse the workflow.

---

## 8. Technical Architecture

## 8.1 Recommended Architecture

Bandie should implement an internal entitlement service layer used by:

- Frontend feature gates.
- Backend API route handlers.
- Server actions / service functions.
- Database functions / RLS policies where needed.
- Admin tools.
- Billing webhooks.

The entitlement model should be stored in Supabase/Postgres tables.

High-level components:

```text
Frontend UI
  ↓
Entitlement client helpers
  ↓
Backend API / server actions
  ↓
Entitlement service
  ↓
Postgres entitlement tables + usage meters
  ↓
Billing provider webhooks / admin overrides
```

## 8.2 Core Concepts

| Concept | Description |
|---|---|
| Actor | The user attempting an action |
| Subject | The account/workspace/resource being acted on |
| Role | The actor’s permission inside the subject |
| Plan | Commercial package assigned to the subject |
| Entitlement | Feature or limit granted by a plan |
| Usage meter | Current usage of a limited resource |
| Override | Manual adjustment to default entitlements |
| Add-on | Paid or granted extension to a base plan |
| Gate | A check that returns allow/deny and reason |

## 8.3 Subject Types

Bandie should support multiple entitlement subjects.

| Subject type | Example |
|---|---|
| `user` | Individual player profile |
| `band` | Skin Condition band workspace |
| `organiser` | Pub group, promoter, individual organiser |
| `venue` | The Red Lion, Weybridge |
| `event` | Open mic night or specific gig |

Most commercial plans should be assigned to `band` or `organiser`, not individual users.

## 8.4 Suggested Database Tables

The following table names assume a Bandie prefix if used in a shared Supabase instance.

### `bandie_plans`

Stores the plan catalogue.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `code` | text | Unique internal code, e.g. `band_free` |
| `name` | text | Display name |
| `description` | text | User-facing description |
| `subject_type` | text | `user`, `band`, `organiser`, `event` |
| `billing_interval` | text | `free`, `monthly`, `annual`, `one_off` |
| `status` | text | `draft`, `active`, `retired` |
| `is_public` | boolean | Whether shown on pricing page |
| `display_order` | integer | UI order |
| `stripe_product_id` | text | Nullable |
| `stripe_price_id` | text | Nullable |
| `created_at` | timestamptz | Audit |
| `updated_at` | timestamptz | Audit |

### `bandie_capabilities`

Defines all capability keys available in the system.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `key` | text | Unique, e.g. `song.create` |
| `name` | text | Display name |
| `description` | text | Explanation |
| `category` | text | `songs`, `setlists`, `profile`, `organiser`, etc. |
| `value_type` | text | `boolean`, `integer`, `bytes`, `rate` |
| `default_value` | jsonb | Default deny or default limit |
| `created_at` | timestamptz | Audit |

### `bandie_plan_entitlements`

Maps plans to capabilities and limits.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `plan_id` | uuid | FK to `bandie_plans` |
| `capability_key` | text | FK or logical reference to capability |
| `value` | jsonb | `true`, `false`, `6`, `{ "count": 20, "period": "month" }` |
| `effective_from` | timestamptz | Optional |
| `effective_to` | timestamptz | Optional |
| `created_at` | timestamptz | Audit |
| `updated_at` | timestamptz | Audit |

Example rows:

| Plan | Capability | Value |
|---|---|---:|
| `band_free` | `song.create` | `true` |
| `band_free` | `songs.max_count` | `6` |
| `band_free` | `setlists.max_count` | `1` |
| `band_free` | `song_folder.create` | `false` |
| `organiser_free` | `venues.max_count` | `1` |
| `band_standard` | `song_folder.create` | `true` |
| `band_standard` | `songs.max_count` | `100` |

### `bandie_subscriptions`

Stores current and historical plan assignments.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `subject_type` | text | `user`, `band`, `organiser`, `event` |
| `subject_id` | uuid | ID of target account/workspace |
| `plan_id` | uuid | FK to plan |
| `status` | text | `active`, `trialing`, `past_due`, `cancelled`, `expired` |
| `source` | text | `stripe`, `manual`, `system`, `migration` |
| `stripe_customer_id` | text | Nullable |
| `stripe_subscription_id` | text | Nullable |
| `current_period_start` | timestamptz | Nullable |
| `current_period_end` | timestamptz | Nullable |
| `trial_end` | timestamptz | Nullable |
| `cancel_at_period_end` | boolean | Stripe-style behaviour |
| `created_at` | timestamptz | Audit |
| `updated_at` | timestamptz | Audit |

### `bandie_usage_meters`

Stores tracked usage by subject and resource.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `subject_type` | text | e.g. `band` |
| `subject_id` | uuid | Band/organiser/etc. |
| `meter_key` | text | e.g. `songs.count` |
| `current_value` | numeric | Current usage |
| `period_start` | timestamptz | For rate-limited meters |
| `period_end` | timestamptz | For rate-limited meters |
| `updated_at` | timestamptz | Last recalculated |

Examples:

| Subject | Meter | Value |
|---|---|---:|
| band:abc | `songs.count` | 6 |
| band:abc | `setlists.count` | 1 |
| band:abc | `storage.bytes` | 180000000 |
| organiser:def | `venues.count` | 1 |

### `bandie_entitlement_overrides`

Stores manual exceptions and trials.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `subject_type` | text | Target subject |
| `subject_id` | uuid | Target ID |
| `capability_key` | text | Capability modified |
| `value` | jsonb | Override value |
| `reason` | text | Required |
| `starts_at` | timestamptz | Optional |
| `expires_at` | timestamptz | Optional |
| `created_by` | uuid | Admin user ID |
| `created_at` | timestamptz | Audit |

### `bandie_addons`

Defines add-on products.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `code` | text | e.g. `extra_storage_10gb` |
| `name` | text | Display name |
| `description` | text | Description |
| `billing_interval` | text | monthly, one_off |
| `status` | text | active/retired |
| `stripe_price_id` | text | Nullable |

### `bandie_addon_entitlements`

Maps add-ons to entitlement changes.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `addon_id` | uuid | FK |
| `capability_key` | text | Capability changed |
| `operation` | text | `set`, `increment`, `decrement` |
| `value` | jsonb | e.g. `10737418240` bytes |

### `bandie_subject_addons`

Stores active add-ons for a subject.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `subject_type` | text | band/organiser/event |
| `subject_id` | uuid | Target ID |
| `addon_id` | uuid | FK |
| `status` | text | active/cancelled/expired |
| `quantity` | integer | For repeated add-ons |
| `starts_at` | timestamptz | Start |
| `expires_at` | timestamptz | Optional |
| `stripe_subscription_item_id` | text | Nullable |

---

## 9. Entitlement Resolution Logic

## 9.1 Resolution Order

When evaluating whether an action is allowed, Bandie should resolve entitlements in the following order:

1. Identify target subject.
2. Identify active subscription for that subject.
3. Load base plan entitlements.
4. Apply active add-ons.
5. Apply active overrides.
6. Apply role/permission checks.
7. Apply usage checks.
8. Return allow/deny decision.

## 9.2 Pseudocode

```ts
type EntitlementCheck = {
  actorId: string;
  subjectType: 'user' | 'band' | 'organiser' | 'venue' | 'event';
  subjectId: string;
  capability: string;
  requestedAmount?: number;
};

async function canPerform(check: EntitlementCheck): Promise<GateDecision> {
  const roleDecision = await checkRolePermission(check);
  if (!roleDecision.allowed) {
    return deny('role_denied', roleDecision.message);
  }

  const entitlement = await resolveEntitlement(
    check.subjectType,
    check.subjectId,
    check.capability
  );

  if (!entitlement.enabled) {
    return deny('feature_not_in_plan', entitlement.upgradeMessage);
  }

  if (entitlement.limit !== undefined) {
    const usage = await getUsage(check.subjectType, check.subjectId, entitlement.meterKey);
    const requested = check.requestedAmount ?? 1;

    if (usage.currentValue + requested > entitlement.limit) {
      return deny('limit_reached', entitlement.upgradeMessage, {
        limit: entitlement.limit,
        usage: usage.currentValue
      });
    }
  }

  return allow();
}
```

## 9.3 Gate Decision Response

All entitlement checks should return a structured response.

```ts
type GateDecision = {
  allowed: boolean;
  reasonCode?: string;
  message?: string;
  currentPlan?: string;
  requiredPlan?: string;
  usage?: number;
  limit?: number;
  upgradeUrl?: string;
};
```

Example denied response:

```json
{
  "allowed": false,
  "reasonCode": "limit_reached",
  "message": "Your free band workspace includes 6 songs. Upgrade to Bandie Band to add more songs.",
  "currentPlan": "band_free",
  "requiredPlan": "band_standard",
  "usage": 6,
  "limit": 6,
  "upgradeUrl": "/bands/abc/settings/billing"
}
```

---

## 10. Usage Metering Design

## 10.1 Count-Based Usage

For resources such as songs, setlists, venues and members, usage can usually be derived from table counts.

Examples:

```sql
select count(*) from bandie_songs where band_id = :band_id and deleted_at is null;
select count(*) from bandie_setlists where band_id = :band_id and deleted_at is null;
select count(*) from bandie_venues where organiser_id = :organiser_id and deleted_at is null;
```

For performance, Bandie may cache these in `bandie_usage_meters` and update them through triggers or service-layer writes.

## 10.2 Storage Usage

Storage usage should be tracked when files are uploaded, replaced or deleted.

Recommended approach:

- Store file metadata in a Bandie table, not only in object storage.
- Track `file_size_bytes` per file.
- Sum active files by workspace.
- Update `storage.bytes` meter on upload/delete.

Important: for Dropbox-backed song parts, Bandie may not store all file bytes directly. If the file remains in the user’s Dropbox, Bandie should meter either:

- No storage usage, because Bandie stores only metadata/links.
- Or a separate external-link count, e.g. `external_song_files.count`.

## 10.3 Rate-Limited Usage

For monthly actions such as booking enquiries sent or poster generations, usage should be period-based.

Example meter:

| Meter | Period | Example limit |
|---|---|---:|
| `booking_enquiries.sent` | monthly | 20 |
| `poster.generate` | monthly | 10 |
| `featured_profile_boosts.used` | monthly | 1 |

The system should reset or roll forward the period automatically.

## 10.4 Soft Deletes and Limits

If a resource is soft-deleted, it should normally stop counting against the active limit.

Example:

- Band Free has 6 songs.
- Band creates 6 songs.
- Band deletes 1 song.
- Band can create 1 more song.

However, storage usage should only reduce when associated files are deleted or detached.

## 10.5 Trial Expiry and Over-Limit State

When a plan is downgraded, the account may be over its new limit.

Example:

- Paid band has 50 songs.
- Downgrades to Free, which allows 6 songs.

Recommended behaviour:

- Existing songs remain readable.
- Editing may remain allowed for existing resources if not commercially harmful.
- Creating new songs is blocked.
- Optional: publishing or sharing some resources may be blocked until under limit.
- UI clearly shows over-limit state.

Do not automatically delete user content because of downgrade.

---

## 11. API Design

## 11.1 Entitlement Check Endpoint

```http
POST /api/entitlements/check
```

Request:

```json
{
  "subjectType": "band",
  "subjectId": "band_123",
  "capability": "song.create",
  "requestedAmount": 1
}
```

Response:

```json
{
  "allowed": false,
  "reasonCode": "limit_reached",
  "message": "Your free band workspace includes 6 songs. Upgrade to Bandie Band to add more songs.",
  "currentPlan": "band_free",
  "requiredPlan": "band_standard",
  "usage": 6,
  "limit": 6
}
```

This endpoint is useful for frontend preflight checks, but backend create/update endpoints must still perform their own checks.

## 11.2 Usage Summary Endpoint

```http
GET /api/bands/:bandId/usage
```

Response:

```json
{
  "plan": "band_free",
  "usage": [
    {
      "meterKey": "songs.count",
      "label": "Songs",
      "current": 6,
      "limit": 6,
      "status": "limit_reached"
    },
    {
      "meterKey": "setlists.count",
      "label": "Setlists",
      "current": 1,
      "limit": 1,
      "status": "limit_reached"
    },
    {
      "meterKey": "storage.bytes",
      "label": "Storage",
      "current": 180000000,
      "limit": 250000000,
      "status": "ok"
    }
  ]
}
```

## 11.3 Plan Catalogue Endpoint

```http
GET /api/plans?subjectType=band
```

Returns public active plans for pricing and upgrade screens.

## 11.4 Upgrade Session Endpoint

```http
POST /api/billing/create-checkout-session
```

Request:

```json
{
  "subjectType": "band",
  "subjectId": "band_123",
  "targetPlanCode": "band_standard"
}
```

Response:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

---

## 12. Frontend Implementation

## 12.1 Feature Gate Component

Bandie should include a reusable feature gate component.

Example:

```tsx
<FeatureGate
  subjectType="band"
  subjectId={band.id}
  capability="song_folder.create"
  fallback={<UpgradeCard feature="Song folders" requiredPlan="Bandie Band" />}
>
  <CreateSongFolderButton />
</FeatureGate>
```

## 12.2 Limit-Aware Create Buttons

Creation buttons should become limit-aware.

Example:

```tsx
<CreateButton
  label="Add song"
  subjectType="band"
  subjectId={band.id}
  capability="song.create"
  meterKey="songs.count"
/>
```

If allowed, button works normally. If blocked, it opens the upgrade modal.

## 12.3 Upgrade Modal

The upgrade modal should be consistent across the product.

It should support:

- Feature-locked message.
- Limit-reached message.
- Current plan display.
- Required plan display.
- Benefits list.
- Upgrade call to action.
- “Maybe later” option.

## 12.4 Navigation Gates

Some navigation items can be visible but locked.

Example:

```text
Songs
Setlists
Song Folders    Pro
Calendar
Booking Pipeline    Pro
Analytics    Pro
```

For major paid features, showing the locked nav item can drive conversion.

## 12.5 Pricing Page

The public pricing page should be generated from plan catalogue data where possible. This avoids pricing pages drifting away from real entitlements.

---

## 13. Backend Enforcement

Every create/update/delete action that affects a gated feature or limited resource must call the entitlement service.

Examples:

### Creating a song

1. User clicks Add Song.
2. Frontend optionally checks `song.create`.
3. Backend receives create request.
4. Backend checks role: can the user manage songs in this band?
5. Backend checks entitlement: does band plan include `song.create` and is it below `songs.max_count`?
6. Backend inserts song.
7. Backend updates usage meter.
8. Backend returns success.

### Creating a venue

1. Organiser tries to create second venue.
2. Backend checks `venue.create` and `venues.max_count`.
3. If organiser is on Free and already has one venue, request is denied.
4. API returns structured upgrade response.

## 13.1 Transaction Safety

For limited resources, the check and creation should happen in a transaction to avoid race conditions.

Example issue:

- Free band has 5 of 6 songs.
- Two members click Add Song at the same time.
- Both checks see 5 and both insert.
- Band ends up with 7 songs.

Recommended solution:

- Use database transaction.
- Lock relevant usage row or parent workspace row.
- Check current usage.
- Insert resource.
- Increment usage.
- Commit.

## 13.2 Database Functions

For critical limits, consider Postgres functions such as:

```sql
create or replace function bandie_can_create_song(p_band_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Role check, plan resolution and count check.
  -- Return true/false or raise exception.
end;
$$;
```

However, keep complex commercial logic in application/service code where possible. Use database functions mainly for protection around high-risk writes.

---

## 14. Row-Level Security Considerations

Supabase RLS should continue to enforce membership and ownership access. Entitlements should complement RLS, not replace it.

RLS should answer:

- Is this user allowed to see this band’s private data?
- Is this user a member/admin/owner of the band?
- Is this organiser allowed to manage this venue?

Entitlements should answer:

- Does this band’s plan allow this feature?
- Has this band reached its song limit?
- Does this organiser plan allow multiple venues?

Do not rely only on RLS for commercial gating unless the logic is simple and stable.

---

## 15. Billing Integration

## 15.1 Stripe Recommended Model

Stripe should be used as the payment processor for subscriptions and one-off event packs.

Suggested mapping:

| Bandie object | Stripe object |
|---|---|
| Plan | Product + Price |
| Band subscription | Subscription |
| Organiser subscription | Subscription |
| Open mic event pack | One-off payment or subscription item |
| Add-on | Price / subscription item |
| Band/organiser billing owner | Stripe customer |

## 15.2 Billing Owner

Each paid workspace needs a billing owner.

Examples:

- Band owner pays for band workspace.
- Organiser owner pays for organiser account.
- Platform admin can change billing owner if needed.

## 15.3 Webhook Events

Bandie should listen for Stripe webhooks and update local subscription state.

Important events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.succeeded` for one-off packs

Webhook handlers should be idempotent.

## 15.4 Subscription States

Bandie should define behaviour for each billing state.

| State | Behaviour |
|---|---|
| `active` | Full plan entitlements |
| `trialing` | Full trial plan entitlements |
| `past_due` | Grace period; notify billing owner |
| `cancel_at_period_end` | Keep access until period ends |
| `cancelled` | Revert to free plan or previous plan |
| `expired` | Revert to free plan |

## 15.5 Grace Period

Recommended approach:

- If payment fails, keep paid access for a short grace period, e.g. 7 days.
- Notify billing owner.
- After grace period, downgrade to free/locked state.
- Do not delete content.

---

## 16. Admin Requirements

## 16.1 Initial Admin Interface

The first implementation can be simple and internal.

Admin users should be able to:

- View all plans.
- View entitlements for each plan.
- View a subject’s current plan.
- View usage for a band/organiser.
- Assign manual plan.
- Add override.
- Remove override.
- Start trial.
- End trial.
- View entitlement decision logs.

## 16.2 Future Admin Pricing Console

Later, Bandie may add an admin console to:

- Create plans.
- Edit limits.
- Retire plans.
- Clone plans.
- Compare plan versions.
- Publish pricing changes.
- Manage public pricing page display.

For MVP, entitlement changes can be managed via seed files, migrations or restricted admin tools.

---

## 17. Audit and Observability

## 17.1 Audit Log

Bandie should log important entitlement and billing changes.

Events to audit:

- Plan created/edited/retired.
- Entitlement changed.
- Subscription created/updated/cancelled.
- Manual override added/removed.
- Trial started/ended.
- Add-on added/removed.
- User blocked by entitlement gate.
- User upgraded after hitting gate.

Suggested table: `bandie_audit_events`.

| Column | Type |
|---|---|
| `id` | uuid |
| `event_type` | text |
| `actor_id` | uuid |
| `subject_type` | text |
| `subject_id` | uuid |
| `metadata` | jsonb |
| `created_at` | timestamptz |

## 17.2 Analytics

Bandie should track conversion moments.

Important analytics events:

- Viewed locked feature.
- Clicked locked feature.
- Hit usage limit.
- Opened upgrade modal.
- Started checkout.
- Completed checkout.
- Cancelled checkout.
- Downgraded.
- Trial started.
- Trial converted.

These events will help refine pricing.

---

## 18. Migration and Seeding

## 18.1 Initial Seed Plans

Initial seed data should create:

- `player_free`
- `band_free`
- `band_standard`
- `band_pro`
- `organiser_free`
- `organiser_plus`
- Optional `open_mic_event_pack`

## 18.2 Initial Capability Keys

Suggested initial capability keys:

### Player

- `player_profile.create`
- `player_profile.edit`
- `band_invite.respond`
- `band.create`

### Band

- `band_profile.publish`
- `band_profile.custom_url`
- `band_directory.list`
- `band_members.invite`
- `band_members.max_count`
- `song.create`
- `songs.max_count`
- `song_folder.create`
- `song_file.upload`
- `storage.max_bytes`
- `setlist.create`
- `setlists.max_count`
- `calendar.use`
- `gig.create`
- `gigs.active_max_count`
- `booking_enquiry.receive`
- `poster.generate`
- `analytics.view`

### Organiser

- `organiser_profile.create`
- `venue.create`
- `venues.max_count`
- `band_directory.search`
- `booking_enquiry.send`
- `booking_enquiries.monthly_max_count`
- `event_brief.create`
- `event_briefs.active_max_count`
- `open_mic.create`
- `open_mic.monthly_max_count`
- `poster.generate`

---

## 19. Example User Journeys

## 19.1 Free Player Tries to Create a Band

1. Player creates free profile.
2. Player clicks “Create a band”.
3. System checks `band.create` for user/player subject.
4. Free tier does not include `band.create`.
5. User sees upgrade prompt:

> Creating a band workspace is available on Bandie Band plans. Upgrade to create a band, invite members and manage songs, setlists and gigs.

Alternative commercial decision: Bandie may allow free band creation but restrict usage. If so, `band.create` should be enabled on Player Free, and the created band should default to Band Free.

## 19.2 Free Band Reaches Song Limit

1. Band Free has 6 songs.
2. Band owner clicks “Add song”.
3. Backend checks `song.create` and `songs.max_count`.
4. Usage is 6 and limit is 6.
5. Request is denied.
6. UI shows:

> Your free band workspace includes 6 songs. Upgrade to Bandie Band to add up to 100 songs and unlock song folders.

## 19.3 Paid Band Creates Song Folder

1. Bandie Band account opens a song.
2. User clicks “Create song folder”.
3. Backend checks `song_folder.create`.
4. Plan includes feature.
5. Song folder is created.

## 19.4 Free Organiser Adds Second Venue

1. Organiser Free has one venue.
2. User clicks “Add venue”.
3. Backend checks `venue.create` and `venues.max_count`.
4. Usage is 1 and limit is 1.
5. User sees:

> Free organiser accounts can manage 1 venue. Upgrade to Organiser Plus to add more venues and run repeat events.

## 19.5 Organiser Buys One-Off Open Mic Event

1. Organiser wants to run a jam night.
2. Free organiser does not have `open_mic.create`.
3. User buys Open Mic Event Pack.
4. Stripe payment succeeds.
5. `open_mic_event_pack` add-on is assigned to organiser.
6. Entitlement now allows one open mic event.
7. Once event is created, usage meter increments.

---

## 20. Product Decisions Required

**Status:** Confirmed — 29 June 2026 (Phase 8.1, stakeholder review). See **§20.1 Resolved decisions** below for implementation authority. The illustrative tier tables in §6 remain product context; where they conflict with §20.1, §20.1 wins.

The following decisions should be resolved before implementation:

1. Can a free player create a free band, or is band creation paid from the start?
2. Should Band Free include song folders as locked preview, or no access at all?
3. Should Free Band allow 6 songs or a different number?
4. Should Free Band allow 1 setlist or 3 setlists?
5. Should organiser enquiries be capped or unlimited fair use?
6. Should Open Mic be a one-off purchase, organiser subscription feature, or both?
7. Should paid band plans be per band or per member seat?
8. Should files be stored in Bandie storage, Dropbox, or both for entitlement metering?
9. Should downgrade block editing existing over-limit resources or only block creation of new resources?
10. What internal admin roles can grant overrides?

Recommended MVP answers:

| Decision | Recommendation |
|---|---|
| Free player create band? | Yes, but created band starts on Band Free with limits |
| Free songs limit | 6 |
| Free setlist limit | 1 |
| Free song folders | Locked, visible upgrade prompt |
| Free organiser venues | 1 |
| Open mic monetisation | One trial event or paid event pack |
| Band billing | Per band/workspace, not per member |
| Downgrade handling | Keep content visible, block new over-limit creation |
| Admin overrides | Platform admins only |

## 20.1 Resolved decisions (authoritative)

| # | Question | **Decision** | Notes |
|---|---|---|---|
| 1 | Free player create band? | **Yes, with player-level cap.** Three **band-leader tiers** govern how many bands a user may create/own as primary leader: **Free = 1**, **Level 1 = 3**, **Level 2 = unlimited**. Player Free bands also have **up to 6 songs** and **1 setlist** per band. | See §20.2 band-leader tier table. Plan codes: `player_free`, `band_standard` (Level 1), `band_pro` (Level 2). |
| 2 | Band Free song folders | **Full access.** Song part folders, uploads and Dropbox integration are available on Player Free bands. Limits are song/setlist/band count only — not folder gating. | Supersedes spec §6.2 “song folders: no or limited preview”. |
| 3 | Free song limit | **6 active songs** per band (`songs.max_count`). Soft-deleted songs do not count. | Applies to bands led by a Player Free user unless overridden by leader tier. |
| 4 | Free setlist limit | **1 setlist** per band (`setlists.max_count`). | |
| 5 | Organiser booking enquiries | **Capped.** Organiser Free: **20 outbound enquiries per calendar month** (`booking_enquiries.monthly_max_count`). Organiser Plus: unlimited. Receiving enquiries on band profiles is not gated. | |
| 6 | Open mic monetisation | **Trial + packs.** Organiser Free: **one trial** open mic event. Ongoing use via **one-off Open Mic Event Pack** add-on and/or **Organiser Plus**. Same entitlement framework (§6.4). | Phase 17. |
| 7 | Billing subject | **Player (band leader), not band workspace.** Subscriptions attach to the **user**. Band features (songs, setlists, calendar tier, gigs, etc.) resolve from the **primary band leader’s** plan. Co-leader tier blending: **not in MVP** — use primary leader only. | Supersedes §5.4 workspace-level billing for band features. Organiser features resolve from the organiser user’s plan. |
| 8 | Storage metering | **Bandie does not meter Dropbox storage.** Song-part bytes live in the leader’s Dropbox; Bandie stores metadata only. If the user’s Dropbox plan allows the space, Bandie does not enforce a byte quota. Use **count-based limits** instead (e.g. **999 songs** on paid leader tiers as a practical ceiling). Do not implement `storage.max_bytes` for song parts in MVP. | Profile avatars and band marketing images remain outside this scope. |
| 9 | Downgrade / over-limit | **Preserve content; block new over-limit creation only.** No auto-delete. Existing songs, setlists and files remain visible and editable. | Option A from review. |
| 10 | Admin override roles | **Platform app admins only** (`is_app_admin`) for overrides, manual plans and trials in MVP. | Option A from review. |

### 20.2 Supplementary limit defaults (for seed data)

**Billing model:** `bandie_subscriptions.subject_type = 'user'` for player and organiser plans. Band feature checks resolve the band’s **primary leader** (`owner_user_id`) and evaluate that user’s active plan.

#### Band-leader tiers (player plans)

| Tier | Plan code | Display name | `bands.max_count` |
|---|---|---|---:|
| Free | `player_free` | Player Free | 1 |
| Level 1 | `band_standard` | Bandie Level 1 | 3 |
| Level 2 | `band_pro` | Bandie Level 2 | null (unlimited) |

#### Capability limits by plan

| Capability key | Player Free | Level 1 (`band_standard`) | Level 2 (`band_pro`) | Organiser Free | Organiser Plus |
|---|---:|---:|---:|---:|---:|
| `bands.max_count` | 1 | 3 | null (unlimited) | — | — |
| `songs.max_count` (per band led) | 6 | 999 | 999 | — | — |
| `setlists.max_count` (per band led) | 1 | 50 | null (fair use) | — | — |
| `song_folder.create` | true | true | true | — | — |
| `band_members.max_count` (per band) | 5 | 10 | 20 | — | — |
| `gigs.active_max_count` (per band) | 1 | 50 | null (fair use) | — | — |
| `calendar.use` | basic | full | full | — | — |
| `venues.max_count` | — | — | — | 1 | 10 |
| `booking_enquiries.monthly_max_count` | — | — | — | 20 | null (unlimited) |
| `open_mic.create` (trial) | — | — | — | 1 (lifetime trial) | included |

**Calendar tier behaviour:** `calendar.use = basic` while primary leader is Player Free = rehearsal + internal gig proposals only; **no public calendar publish**. `full` when leader on Level 1 or Level 2.

**Storage:** No `storage.max_bytes` enforcement for Dropbox song parts (§20.1 #8). Upload failures due to Dropbox quota are surfaced as integration errors, not Bandie upgrade prompts.

**Enforcement timing:** Phase 8 ships permissive dev defaults (8.5); Phase 14 turns on enforcement.

**Open for later confirmation:** whether **999 songs** on Level 1 / Level 2 is the final paid ceiling or placeholder for “unlimited fair use”.

---

## 21. Implementation Phases

## Phase 1 — Core Entitlement Framework

Build:

- Plan tables.
- Capability tables.
- Plan entitlement tables.
- Subscription table.
- Basic usage meters.
- Entitlement service.
- Server-side gate checks for songs, setlists, song folders and venues.
- Basic upgrade prompts.

Focus gates:

- `song.create`
- `songs.max_count`
- `setlist.create`
- `setlists.max_count`
- `song_folder.create`
- `venue.create`
- `venues.max_count`
- `band.create`

## Phase 2 — Billing Integration

Build:

- Stripe products/prices.
- Checkout session creation.
- Billing webhooks.
- Subscription state sync.
- Billing settings page.
- Plan upgrade/downgrade flow.

## Phase 3 — Usage Dashboard and Admin Overrides

Build:

- Workspace usage pages.
- Admin plan view.
- Admin override tools.
- Audit logs.
- Trial support.

## Phase 4 — Add-ons and Event Packs

Build:

- Add-on tables.
- One-off Open Mic Event Pack.
- Extra storage pack.
- Venue pack.
- Featured profile boost.

## Phase 5 — Experimentation and Optimisation

Build:

- Pricing experiments.
- Conversion analytics.
- Grandfathered plans.
- Plan versioning.
- Advanced admin pricing console.

---

## 22. Acceptance Criteria

## 22.1 Feature Entitlement

- A Free Band cannot create a song folder if `song_folder.create = false`.
- A Bandie Band account can create a song folder if `song_folder.create = true`.
- The frontend displays locked state for unavailable features.
- Direct API calls are blocked for unavailable features.

## 22.2 Usage Limits

- A Free Band with fewer than 6 songs can create another song.
- A Free Band with 6 songs cannot create a 7th song.
- A Free Band with 1 setlist cannot create a 2nd setlist.
- A Free Organiser with 1 venue cannot create a 2nd venue.
- Upgrade prompts explain the relevant limit and required plan.

## 22.3 Plan Changes

- Upgrading a band from Free to Bandie Band immediately unlocks paid features.
- Downgrading from Bandie Band to Free preserves existing content.
- Downgraded accounts over free limits cannot create additional limited resources.
- Retired plans continue to work for existing subscribers.

## 22.4 Admin Overrides

- Platform admin can grant a temporary higher song limit to a band.
- Override expires automatically when expiry date is reached.
- All overrides are audit logged.

## 22.5 Billing

- Successful Stripe checkout activates the selected plan.
- Failed payment moves subscription into grace/past-due state.
- Cancelled subscription reverts to free plan after period end.
- Webhook processing is idempotent.

---

## 23. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Hard-coded tier logic becomes difficult to change | Use data-driven entitlements |
| Users bypass frontend gates | Enforce server-side and via RLS where needed |
| Usage counts become inaccurate | Use transactions, triggers or regular reconciliation jobs |
| Downgrades create angry users | Preserve content; block only new over-limit creation |
| Pricing experiments break old customers | Support retired/grandfathered plans |
| Admin overrides become messy | Require reason, expiry and audit trail |
| Billing state and local entitlement state drift | Use idempotent webhooks and reconciliation job |
| Too many locked features harm adoption | Keep core profile and discovery free |

---

## 24. Recommended MVP Scope

For the first commercial implementation, build only the capabilities required to support the immediate model:

- Free Player.
- Band Free.
- Bandie Band.
- Bandie Pro Band.
- Organiser Free.
- Organiser Plus.
- Feature gates for song folders, poster generator, analytics, custom URL, open mic.
- Usage gates for songs, setlists, members, storage, venues and active events.
- Stripe subscription upgrade for band and organiser workspaces.
- One-off or manual Open Mic Event Pack support if open mic launches early.

Avoid building a complex admin pricing console until the tier structure has stabilised.

---

## 25. Summary Recommendation

Bandie should implement a flexible entitlement framework based on configurable plans, capabilities, limits, usage meters, subscriptions, add-ons and overrides.

The key design decision is to avoid embedding pricing logic directly inside product features. Product code should ask the entitlement service whether an action is allowed. This allows Bandie to change commercial packaging over time — for example, moving song folders from Pro to Bandie Band, increasing the free song limit from 6 to 10, or letting organisers register two free venues instead of one — without rewriting core product logic.

The MVP should focus on the highest-value gates:

- Can a user create a band?
- How many songs can a band create?
- How many setlists can a band create?
- Can a band use song folders?
- How much storage can a band use?
- How many venues can an organiser manage?
- Can an organiser run open mic events?

This framework will give Bandie the commercial flexibility needed to test freemium, paid tiers, usage limits, organiser plans, event packs and future marketplace monetisation without reworking the platform every time pricing changes.


---

## 26. Admin Portal Extension Overview

This extension expands the entitlement framework into a full **Bandie Platform Admin Portal**.

The admin portal is the internal control centre for Bandie. It should allow authorised Bandie administrators to manage commercial packaging, feature access, usage limits, subscription state, platform health, customer support operations and key business/product metrics.

The admin portal should not be treated as a simple back-office screen. It is a critical operating layer for Bandie because the pricing model is deliberately flexible. Administrators need to move capabilities between tiers, change usage limits, grant exceptions, monitor adoption, identify conversion points, review subscription health and understand how the product is being used by players, bands and organisers.

The admin portal should support two broad use cases:

1. **Control plane** — manage plans, tiers, entitlements, limits, trials, add-ons, overrides and account-level access.
2. **Insight plane** — view platform metrics such as DAU, MAU, active users by type, tier distribution, bands created, songs managed, setlists created, organiser venues, enquiries, events, open mic activity, conversion rates and platform health.

The admin portal should be built on the same data-driven entitlement model described earlier in this document. Administrators should be able to make commercial changes through admin workflows without developers needing to change code for every pricing experiment.

---

## 27. Admin Portal Goals

The admin portal should enable Bandie to:

1. Manage the platform's plan and entitlement configuration.
2. View and compare tiers across player, band and organiser account types.
3. Move capabilities between tiers with controlled publishing workflows.
4. Change usage limits such as songs, setlists, venues, storage and active events.
5. Grant account-specific overrides, trials, add-ons and custom plans.
6. View key business metrics and product usage metrics.
7. Track daily, weekly and monthly active users.
8. Understand user type breakdown: players, band owners, band members, organisers and platform admins.
9. Understand tier distribution across users, bands and organisers.
10. Track content growth: songs, setlists, song folders, files, bands, venues, events and booking enquiries.
11. Monitor conversion moments such as locked-feature views, limit hits, upgrade modal opens and completed upgrades.
12. Support customer support workflows such as finding a user, inspecting their workspace and explaining why an action is blocked.
13. Provide auditability for admin actions and commercial changes.
14. Support future pricing experiments and grandfathered plans.
15. Provide a secure internal interface that is protected by strict admin permissions.

---

## 28. Admin Portal Non-Goals for MVP

The first version of the admin portal does not need to include:

- A full business intelligence suite.
- Complex cohort analysis.
- Revenue recognition or accounting reports.
- Advanced CRM functionality.
- Full email campaign management.
- Manual card charging or refund processing beyond linking to Stripe.
- Complex experimentation frameworks with statistical significance calculations.
- Fully automated anomaly detection.
- External customer-facing admin access.
- Public self-service plan editing by customers.

These can be added later once product-market signals justify the complexity.

---

## 29. Admin User Roles and Permissions

The admin portal must have its own permission model. It should not assume that all internal administrators can perform all actions.

## 29.1 Admin Role Types

Recommended admin roles:

| Admin role | Purpose | Typical permissions |
|---|---|---|
| `platform_owner` | Full internal owner access | All admin functions |
| `commercial_admin` | Pricing, plans, subscriptions and entitlements | Plan/entitlement management, subscriptions, overrides |
| `support_admin` | Customer support | Read users/accounts, view entitlement decisions, grant limited trials if permitted |
| `content_moderator` | Public profile and directory moderation | View/flag/hide public profiles and content |
| `analytics_viewer` | Business/product reporting | Read dashboards and exports only |
| `technical_admin` | Operational support | View logs, system health, webhook status, reconciliation jobs |
| `read_only_admin` | Safe internal viewing | Read-only across selected admin modules |

## 29.2 Permission Principles

Admin permissions should be capability-based, not purely role-name based.

Example admin capabilities:

| Capability key | Description |
|---|---|
| `admin.dashboard.view` | View main admin dashboard |
| `admin.metrics.view` | View metrics dashboards |
| `admin.metrics.export` | Export metric CSVs |
| `admin.plans.view` | View plans |
| `admin.plans.create` | Create draft plans |
| `admin.plans.edit` | Edit draft plans |
| `admin.plans.publish` | Publish plan changes |
| `admin.plans.retire` | Retire plans |
| `admin.entitlements.edit` | Edit plan entitlements |
| `admin.entitlements.publish` | Publish entitlement changes |
| `admin.overrides.create` | Create account overrides |
| `admin.overrides.delete` | Remove account overrides |
| `admin.trials.create` | Start trials |
| `admin.subscriptions.view` | View subscription status |
| `admin.subscriptions.manual_assign` | Manually assign plans |
| `admin.users.view` | Search and inspect users |
| `admin.users.suspend` | Suspend user account |
| `admin.audit.view` | View audit events |
| `admin.system.view` | View technical health |
| `admin.webhooks.replay` | Replay failed billing webhooks |

For safety, high-risk permissions such as publishing entitlement changes or manually assigning paid plans should be restricted to a small group.

## 29.3 Dual-Control Option for High-Risk Changes

For later versions, Bandie may require a two-step approval workflow for sensitive changes.

Examples:

- Publishing a new public paid plan.
- Reducing a limit on an active plan.
- Removing a capability from a paid plan.
- Mass-applying a plan migration.
- Granting indefinite free paid access.

MVP can record audit logs without requiring dual approval, but the data model should not prevent this future workflow.

---

## 30. Admin Portal Information Architecture

The admin portal should be organised into clear modules.

Recommended navigation:

```text
Admin Portal
├── Overview Dashboard
├── Metrics & Analytics
│   ├── Active Users
│   ├── User Types
│   ├── Tier Distribution
│   ├── Content & Usage
│   ├── Conversion Funnel
│   ├── Organiser Activity
│   └── Revenue & Billing Summary
├── Plans & Entitlements
│   ├── Plan Catalogue
│   ├── Feature Matrix
│   ├── Usage Limits
│   ├── Add-ons
│   ├── Experiments / Draft Changes
│   └── Publish History
├── Accounts
│   ├── Users
│   ├── Bands
│   ├── Organisers
│   ├── Venues
│   └── Events / Open Mic Nights
├── Subscriptions & Billing
│   ├── Subscriptions
│   ├── Trials
│   ├── Past Due Accounts
│   ├── Stripe Webhooks
│   └── Reconciliation
├── Support Tools
│   ├── Entitlement Inspector
│   ├── Usage Inspector
│   ├── Gate Decision Logs
│   └── Manual Overrides
├── Moderation
│   ├── Public Band Profiles
│   ├── Player Profiles
│   ├── Organiser Profiles
│   └── Reported Content
├── System Health
│   ├── Jobs
│   ├── Webhooks
│   ├── Storage
│   ├── Error Logs
│   └── API Health
└── Audit Log
```

For MVP, the minimum useful modules are:

- Overview Dashboard
- Metrics & Analytics
- Plans & Entitlements
- Accounts
- Support Tools
- Audit Log

---

## 31. Admin Portal Functional Requirements

## 31.1 Admin Authentication and Access

The admin portal must require authenticated access and must only be available to authorised platform administrators.

Requirements:

- Admin users must authenticate through Bandie's existing auth system.
- Admin status must be checked server-side.
- Admin routes must be protected from non-admin users.
- Admin permission checks must occur on every admin API endpoint.
- Admin session activity should be logged.
- Admin users should be clearly labelled with their role and permissions.
- High-risk actions should require confirmation.
- Optional future enhancement: require multi-factor authentication for platform admins.

## 31.2 Overview Dashboard

The Overview Dashboard should provide a quick snapshot of platform health and growth.

Recommended cards:

| Metric | Definition |
|---|---|
| DAU | Distinct active users today |
| WAU | Distinct active users in last 7 days |
| MAU | Distinct active users in last 30 days |
| New users today | Users created today |
| Total users | Total registered users |
| Active bands | Bands with activity in selected period |
| Total bands | Total band workspaces |
| Paid bands | Bands on paid plans |
| Active organisers | Organisers with activity in selected period |
| Paid organisers | Organisers on paid plans |
| Songs managed | Active songs across all bands |
| Setlists managed | Active setlists across all bands |
| Venues registered | Active venues |
| Booking enquiries | Enquiries in selected period |
| Open mic events | Open mic events created in selected period |
| Limit hits | Usage limit denials in selected period |
| Upgrade conversions | Completed upgrades in selected period |

The dashboard should support:

- Date range selector: today, 7 days, 30 days, 90 days, custom.
- Comparison to previous period.
- Trend indicator up/down.
- Basic chart for active users over time.
- Alerts for key operational issues such as failed webhooks or large usage-meter drift.

## 31.3 Metrics & Analytics Dashboards

The admin portal should provide a metrics area with more detailed breakdowns.

### Active User Metrics

Definitions:

| Metric | Definition |
|---|---|
| DAU | Unique users with at least one tracked activity event on a calendar day |
| WAU | Unique users with at least one tracked activity event in the last 7 days |
| MAU | Unique users with at least one tracked activity event in the last 30 days |
| Stickiness | DAU / MAU |
| New users | Users whose account was created in the period |
| Returning users | Active users whose account was created before the period |
| Activated users | Users who complete a defined activation action |

Activation events may differ by user type:

| User type | Suggested activation event |
|---|---|
| Player | Creates profile and responds to or joins a band |
| Band owner | Creates band and adds first song or invites first member |
| Band member | Joins a band and views songs/setlists |
| Organiser | Creates organiser profile and sends first enquiry or registers first venue |

### User Type Breakdown

Dashboard should show:

- Total players.
- Total band owners.
- Total band members.
- Users in multiple bands.
- Total organisers.
- Venue managers.
- Users with more than one user type.
- User type by plan/tier.
- New user type signups by period.

### Tier Distribution

Dashboard should show current and historical tier distribution.

Examples:

| Segment | Metrics |
|---|---|
| Players | Free, Plus, unknown/no tier |
| Bands | Free, Bandie Band, Bandie Pro, custom, trialing |
| Organisers | Free, Plus, custom, event-pack users |
| Add-ons | Open mic packs, storage packs, featured boosts |

Tier dashboard should include:

- Count by tier.
- Percentage by tier.
- New upgrades in selected period.
- Downgrades/cancellations in selected period.
- Trial starts.
- Trial conversions.
- Past due subscriptions.
- Grandfathered plan count.
- Accounts with manual overrides.

### Content and Usage Metrics

Dashboard should show:

| Metric | Breakdown |
|---|---|
| Songs managed | Total, by tier, by active band, created per period |
| Song folders | Total, by tier, created per period |
| Song files | Total, storage size, external vs Bandie-hosted |
| Setlists | Total, by tier, created per period |
| Gigs | Active, confirmed, provisional, completed |
| Rehearsals | Created, confirmed, availability responses |
| Band members | Average per band, active members |
| Venues | Total, by organiser tier |
| Booking enquiries | Sent, received, accepted/declined where tracked |
| Posters generated | Total, by band/organiser, watermarked vs paid |
| Open mic events | Created, active, completed, signups, songs submitted |

### Conversion Funnel

Dashboard should show commercial funnel metrics:

```text
Free band created
  ↓
First song added
  ↓
Reached song/setlist/member/storage limit
  ↓
Upgrade modal viewed
  ↓
Checkout started
  ↓
Checkout completed
  ↓
Paid subscription active
```

For organisers:

```text
Organiser account created
  ↓
Venue registered
  ↓
Band directory searched
  ↓
Band profile viewed
  ↓
Enquiry sent
  ↓
Second venue attempted / open mic attempted
  ↓
Upgrade modal viewed
  ↓
Checkout completed
```

Conversion metrics should include:

- Locked feature clicks.
- Usage limit hits.
- Upgrade modal opens.
- Checkout starts.
- Checkout completions.
- Trial starts.
- Trial conversions.
- Upgrade abandonment points.

## 31.4 Plan Catalogue Management

Admins with the correct permission should be able to view and manage plan definitions.

Functional requirements:

- View all plans by subject type.
- Filter plans by status: draft, active, retired.
- Create new draft plan.
- Clone existing plan.
- Edit draft plan metadata.
- Set display name, description, billing interval and public visibility.
- Link plan to Stripe product/price IDs.
- Retire a plan.
- View all subscriptions currently using a plan.
- Prevent deletion of plans with historical subscriptions or audit references.
- Show warning before changing active public plan configuration.

Recommended rule: active published plan records should not be edited destructively. Admins should create a new plan version or draft change, then publish it.

## 31.5 Entitlement Matrix Management

The admin portal should provide a feature matrix where rows are capabilities and columns are plans.

Example:

| Capability | Band Free | Bandie Band | Bandie Pro |
|---|---:|---:|---:|
| `song.create` | Yes | Yes | Yes |
| `songs.max_count` | 6 | 100 | Unlimited |
| `setlists.max_count` | 1 | 50 | Unlimited |
| `song_folder.create` | No | Yes | Yes |
| `storage.max_bytes` | 250MB | 10GB | 50GB |
| `analytics.view` | No | No | Yes |
| `poster.generate` | Watermark | Yes | Yes |

Functional requirements:

- View matrix by subject type: player, band, organiser, event.
- Search capabilities.
- Filter by category.
- Edit draft entitlement values.
- Validate value type based on capability definition.
- Show changed values before publish.
- Show impacted accounts before publish.
- Publish changes with required audit reason.
- Retain historical versions of published entitlement sets.
- Roll back to a previous published version where safe.
- Export matrix to CSV.

## 31.6 Usage Limit Management

Admins should be able to manage usage limits as part of entitlement configuration.

Requirements:

- Numeric limits must support finite numbers and unlimited values.
- Storage limits should be editable in human-friendly units such as MB/GB.
- Rate limits should support period definitions such as daily, monthly or per event.
- Changes should show impact before publish.

Example impact preview:

> Changing `songs.max_count` for Band Free from 6 to 10 will affect 842 free band workspaces. 217 are currently at the old limit. 0 will become over-limit.

For limit reductions:

> Reducing `songs.max_count` from 10 to 6 will make 91 bands over-limit. Existing content will remain visible, but those bands will be blocked from creating new songs.

## 31.7 Entitlement Simulation / Preview

The admin portal should include an entitlement inspector that simulates whether a user or account can perform a specific action.

Inputs:

- Actor/user.
- Subject type.
- Subject/workspace.
- Capability key.
- Requested amount.
- Optional target resource.

Output:

- Allowed/denied.
- Role decision.
- Plan decision.
- Active plan.
- Active add-ons.
- Active overrides.
- Current usage.
- Limit.
- Required plan.
- Gate reason.
- Upgrade message.

This tool is important for support and debugging.

## 31.8 Account Search and Inspection

Admins should be able to search and inspect key account types.

### User search

Search by:

- Name.
- Email.
- User ID.
- Created date.
- User type.
- Tier.
- Last active date.

User profile view should show:

- User identity and contact email.
- User type(s).
- Created date.
- Last active date.
- Player profile status.
- Band memberships.
- Organiser memberships.
- Subscription subjects owned.
- Recent activity.
- Support notes.
- Admin audit events affecting user.

### Band inspection

Band view should show:

- Band name.
- Band ID.
- Owner/admins.
- Current plan and subscription status.
- Usage summary: members, songs, setlists, storage, gigs.
- Public profile status.
- Directory listing status.
- Recent activity.
- Limit hits.
- Active overrides.
- Active add-ons.
- Trial status.
- Billing owner.
- Stripe customer/subscription links.
- Entitlement inspector prefilled for the band.

### Organiser inspection

Organiser view should show:

- Organiser name.
- Owner/admins.
- Current plan and subscription status.
- Venues managed.
- Event briefs.
- Open mic events.
- Booking enquiries sent.
- Recent searches/profile views where tracked.
- Limit hits.
- Active overrides/add-ons.
- Billing owner.

## 31.9 Subscription and Billing Admin

The admin portal should show subscription state but should not replace Stripe for payment operations.

Functional requirements:

- View subscriptions by status.
- Filter by plan, status, subject type and billing interval.
- View current period start/end.
- View trial end date.
- View cancel-at-period-end state.
- View Stripe customer and subscription IDs.
- Link out to Stripe dashboard.
- Show latest invoice/payment status if available.
- Manually assign a free/manual plan where permitted.
- Start or extend a trial.
- Cancel manual trial.
- Trigger subscription reconciliation.
- View webhook processing status.
- Replay failed webhook where safe.

High-risk payment actions such as refunds, card changes and invoice edits should normally be performed in Stripe rather than Bandie.

## 31.10 Overrides, Trials and Custom Access

Admins should be able to manage overrides through the portal.

Requirements:

- Add feature override.
- Add limit override.
- Add temporary trial.
- Add manual comp access.
- Add account to custom plan.
- Set expiry date.
- Require reason.
- Require admin confirmation.
- Show all active and expired overrides.
- Audit all changes.

Override UI should warn admins when overrides are indefinite.

Example warning:

> This override has no expiry date. It will remain active until manually removed. Use indefinite overrides only for custom plans or approved partner accounts.

## 31.11 Platform Content and Usage Moderation

The admin portal should support moderation of public content.

MVP moderation capabilities:

- View public band profiles.
- Filter profiles by published/unpublished status.
- Hide or unpublish a profile.
- View player profiles.
- View organiser profiles.
- Mark content for review.
- Record moderation reason.
- Audit moderation actions.

Future moderation features:

- Reported content queue.
- Automated content checks.
- Public review/testimonial moderation.
- Blocked words and spam detection.
- User suspension workflow.

## 31.12 System Health Dashboard

The admin portal should provide a lightweight technical health dashboard.

Recommended metrics:

| Area | Metrics |
|---|---|
| Billing webhooks | Received, succeeded, failed, pending replay |
| Usage meter jobs | Last run, success/failure, drift count |
| Metrics aggregation jobs | Last run, duration, status |
| Storage | Total Bandie-hosted storage bytes, upload failures |
| API errors | Error count by endpoint/status |
| Auth | Signups, login failures, suspicious activity |
| Background jobs | Queue length, failed jobs |
| Database | Slow queries if available, connection pressure if available |

For MVP, this can be a simple status page backed by operational tables and logs.

## 31.13 Audit Log

Every meaningful admin action must be audit logged.

Events to audit:

- Admin login/access to portal.
- Plan created/edited/retired.
- Entitlement draft created.
- Entitlement change published.
- Limit changed.
- Subscription manually assigned.
- Trial started/extended/ended.
- Override created/removed.
- Add-on granted/removed.
- User suspended/reactivated.
- Public profile hidden/unhidden.
- Webhook replayed.
- Metrics export downloaded.

Audit log should support:

- Search by actor.
- Search by subject.
- Filter by event type.
- Filter by date.
- View metadata payload.
- Export for internal review where permitted.

---

## 32. Admin Portal Technical Architecture

## 32.1 Recommended Frontend Architecture

The admin portal can be implemented inside the same Bandie web application as a protected route group.

Example routes:

```text
/admin
/admin/metrics
/admin/metrics/active-users
/admin/metrics/tiers
/admin/metrics/content
/admin/plans
/admin/plans/:planId
/admin/entitlements
/admin/accounts/users
/admin/accounts/users/:userId
/admin/accounts/bands
/admin/accounts/bands/:bandId
/admin/accounts/organisers
/admin/accounts/organisers/:organiserId
/admin/subscriptions
/admin/support/entitlement-inspector
/admin/audit
/admin/system
```

Recommended implementation:

- Reuse Bandie's existing React/Next/Vite stack depending on final app architecture.
- Use server-side route protection.
- Use admin API endpoints rather than exposing direct database write access to the frontend.
- Use reusable dashboard card, chart, table and filter components.
- Use paginated tables for large data sets.
- Use CSV export endpoints for metrics where permitted.

## 32.2 Admin API Layer

Admin APIs should be separate from customer-facing APIs.

Example endpoint naming:

```text
GET    /api/admin/overview
GET    /api/admin/metrics/active-users
GET    /api/admin/metrics/tier-distribution
GET    /api/admin/metrics/content-usage
GET    /api/admin/plans
POST   /api/admin/plans
GET    /api/admin/plans/:planId
PATCH  /api/admin/plans/:planId
POST   /api/admin/plans/:planId/clone
POST   /api/admin/plans/:planId/retire
GET    /api/admin/entitlements/matrix
POST   /api/admin/entitlements/drafts
POST   /api/admin/entitlements/drafts/:draftId/publish
POST   /api/admin/entitlements/simulate
GET    /api/admin/users
GET    /api/admin/users/:userId
GET    /api/admin/bands
GET    /api/admin/bands/:bandId
GET    /api/admin/organisers
GET    /api/admin/organisers/:organiserId
POST   /api/admin/overrides
DELETE /api/admin/overrides/:overrideId
POST   /api/admin/trials
GET    /api/admin/audit
GET    /api/admin/system/health
POST   /api/admin/webhooks/:webhookEventId/replay
```

Every admin endpoint must:

1. Authenticate the user.
2. Check admin permission.
3. Validate input.
4. Apply row-level access restrictions where relevant.
5. Log high-risk actions.
6. Return structured errors.

## 32.3 Admin Database Tables

The entitlement document already defines the core plan, entitlement, subscription, usage and audit tables. The admin portal requires additional tables and views.

### `bandie_admin_users`

Stores internal admin role assignment.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth user/profile |
| `admin_role` | text | Primary admin role |
| `status` | text | `active`, `suspended`, `revoked` |
| `created_by` | uuid | Admin who granted access |
| `created_at` | timestamptz | Audit |
| `updated_at` | timestamptz | Audit |

### `bandie_admin_permissions`

Stores available admin permissions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `key` | text | e.g. `admin.plans.publish` |
| `name` | text | Display name |
| `description` | text | Explanation |
| `category` | text | `metrics`, `plans`, `support`, `system` |
| `created_at` | timestamptz | Audit |

### `bandie_admin_role_permissions`

Maps admin roles to permissions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `admin_role` | text | e.g. `commercial_admin` |
| `permission_key` | text | e.g. `admin.entitlements.edit` |
| `created_at` | timestamptz | Audit |

### `bandie_admin_sessions`

Optional table for tracking admin portal sessions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `admin_user_id` | uuid | FK to user |
| `started_at` | timestamptz | Start |
| `last_seen_at` | timestamptz | Last admin action |
| `ip_address` | text | Optional |
| `user_agent` | text | Optional |

### `bandie_admin_saved_views`

Allows admins to save dashboard filters.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `admin_user_id` | uuid | Owner |
| `view_type` | text | e.g. `metrics`, `accounts`, `audit` |
| `name` | text | Display name |
| `filters` | jsonb | Saved filters |
| `created_at` | timestamptz | Audit |

### `bandie_entitlement_drafts`

Stores staged entitlement changes before publishing.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Draft name |
| `description` | text | Change description |
| `status` | text | `draft`, `published`, `discarded` |
| `created_by` | uuid | Admin user |
| `published_by` | uuid | Nullable |
| `published_at` | timestamptz | Nullable |
| `created_at` | timestamptz | Audit |

### `bandie_entitlement_draft_items`

Stores individual draft changes.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `draft_id` | uuid | FK |
| `plan_id` | uuid | Target plan |
| `capability_key` | text | Target capability |
| `old_value` | jsonb | Current published value |
| `new_value` | jsonb | Draft value |
| `change_type` | text | `create`, `update`, `delete` |

### `bandie_metric_events`

Append-only event table for product analytics.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `event_name` | text | e.g. `song_created` |
| `user_id` | uuid | Nullable for anonymous/public events |
| `subject_type` | text | `user`, `band`, `organiser`, `venue`, `event` |
| `subject_id` | uuid | Nullable |
| `context` | jsonb | Event-specific metadata |
| `occurred_at` | timestamptz | Event time |
| `created_at` | timestamptz | Insert time |

### `bandie_daily_metric_snapshots`

Stores aggregated daily metrics for fast dashboards.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `metric_date` | date | Snapshot date |
| `metric_key` | text | e.g. `dau`, `songs_total` |
| `segment_type` | text | e.g. `global`, `user_type`, `plan`, `subject_type` |
| `segment_key` | text | e.g. `band_free`, `organiser_plus` |
| `value` | numeric | Metric value |
| `metadata` | jsonb | Optional |
| `created_at` | timestamptz | Insert time |
| `updated_at` | timestamptz | Last update |

### `bandie_gate_decision_logs`

Stores entitlement decisions, especially denials and limit hits.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `actor_id` | uuid | User attempting action |
| `subject_type` | text | Target subject |
| `subject_id` | uuid | Target ID |
| `capability_key` | text | Requested capability |
| `allowed` | boolean | Decision |
| `reason_code` | text | e.g. `limit_reached` |
| `current_plan_code` | text | Resolved plan |
| `required_plan_code` | text | Suggested plan |
| `usage_value` | numeric | Current usage |
| `limit_value` | numeric | Limit |
| `metadata` | jsonb | Additional decision context |
| `created_at` | timestamptz | Decision time |

### `bandie_system_jobs`

Tracks background jobs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `job_key` | text | e.g. `daily_metrics_aggregation` |
| `status` | text | `running`, `succeeded`, `failed` |
| `started_at` | timestamptz | Start |
| `finished_at` | timestamptz | End |
| `duration_ms` | integer | Duration |
| `metadata` | jsonb | Counts, errors, etc. |
| `created_at` | timestamptz | Insert time |

### `bandie_webhook_events`

Tracks inbound billing webhook processing.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `provider` | text | `stripe` |
| `provider_event_id` | text | Unique event ID |
| `event_type` | text | Stripe event type |
| `status` | text | `received`, `processed`, `failed`, `replayed` |
| `payload` | jsonb | Raw/sanitised event payload |
| `error_message` | text | Nullable |
| `received_at` | timestamptz | Received |
| `processed_at` | timestamptz | Nullable |

## 32.4 Metric Event Tracking

The admin metrics dashboard should be based on consistent product events.

Recommended initial event names:

### User events

- `user_signed_up`
- `user_logged_in`
- `player_profile_created`
- `player_profile_updated`
- `band_invite_responded`

### Band events

- `band_created`
- `band_profile_published`
- `band_member_invited`
- `band_member_joined`
- `song_created`
- `song_updated`
- `song_deleted`
- `song_folder_created`
- `song_file_uploaded`
- `setlist_created`
- `setlist_used`
- `gig_created`
- `availability_response_submitted`

### Organiser events

- `organiser_created`
- `venue_created`
- `band_directory_searched`
- `band_profile_viewed`
- `booking_enquiry_sent`
- `event_brief_created`
- `open_mic_created`
- `open_mic_signup_received`

### Commercial events

- `locked_feature_clicked`
- `usage_limit_reached`
- `upgrade_modal_opened`
- `checkout_started`
- `checkout_completed`
- `subscription_started`
- `subscription_cancelled`
- `trial_started`
- `trial_converted`
- `addon_purchased`

### Admin events

- `admin_plan_created`
- `admin_entitlement_published`
- `admin_override_created`
- `admin_trial_started`
- `admin_user_suspended`
- `admin_metrics_exported`

Product event tracking should avoid storing sensitive personal data in event payloads. Events should reference IDs and structured metadata.

## 32.5 Metrics Aggregation

The admin portal should not calculate all metrics from raw events on every page load. It should use a combination of live counts and aggregated snapshots.

Recommended approach:

| Metric type | Calculation method |
|---|---|
| Current totals | Direct database count or materialized view |
| DAU/WAU/MAU | Aggregated from `bandie_metric_events` |
| Tier distribution | Materialized view from subscriptions/plans |
| Content totals | Direct table counts or daily snapshots |
| Conversion funnel | Aggregated event counts |
| Billing state | Direct subscription table + Stripe sync |
| System health | Operational job/webhook tables |

## 32.6 Daily Metrics Job

A scheduled job should run daily to populate `bandie_daily_metric_snapshots`.

Example job:

```text
Job: daily_metrics_aggregation
Schedule: Every day at 02:00 Europe/London
Inputs: metric events, users, bands, organisers, subscriptions, content tables
Outputs: daily_metric_snapshots
```

The job should calculate:

- DAU for previous day.
- WAU ending previous day.
- MAU ending previous day.
- New users.
- New bands.
- Active bands.
- New organisers.
- Active organisers.
- Total songs.
- New songs.
- Total setlists.
- New setlists.
- Total venues.
- New venues.
- Tier counts.
- Trial counts.
- Upgrade events.
- Limit hits.
- Booking enquiries.
- Open mic events.

The job should write to `bandie_system_jobs` with status and counts.

## 32.7 Materialized Views

For dashboard performance, consider materialized views such as:

### `bandie_mv_current_tier_distribution`

```sql
select
  p.subject_type,
  p.code as plan_code,
  p.name as plan_name,
  s.status as subscription_status,
  count(*) as subject_count
from bandie_subscriptions s
join bandie_plans p on p.id = s.plan_id
where s.status in ('active', 'trialing', 'past_due')
group by p.subject_type, p.code, p.name, s.status;
```

### `bandie_mv_band_usage_summary`

```sql
select
  b.id as band_id,
  b.name as band_name,
  count(distinct s.id) filter (where s.deleted_at is null) as songs_count,
  count(distinct sl.id) filter (where sl.deleted_at is null) as setlists_count,
  count(distinct bm.user_id) as members_count,
  coalesce(sum(f.file_size_bytes) filter (where f.deleted_at is null), 0) as storage_bytes
from bandie_bands b
left join bandie_songs s on s.band_id = b.id
left join bandie_setlists sl on sl.band_id = b.id
left join bandie_band_members bm on bm.band_id = b.id
left join bandie_files f on f.band_id = b.id
group by b.id, b.name;
```

### `bandie_mv_active_users_daily`

```sql
select
  date_trunc('day', occurred_at)::date as metric_date,
  count(distinct user_id) as active_users
from bandie_metric_events
where user_id is not null
group by 1;
```

Materialized views should be refreshed on a schedule or after significant batch jobs.

## 32.8 DAU, WAU and MAU Calculation

Recommended definitions:

```sql
-- DAU for a date
select count(distinct user_id)
from bandie_metric_events
where user_id is not null
  and occurred_at >= :date::date
  and occurred_at < (:date::date + interval '1 day');

-- WAU ending at date
select count(distinct user_id)
from bandie_metric_events
where user_id is not null
  and occurred_at >= (:date::date - interval '6 days')
  and occurred_at < (:date::date + interval '1 day');

-- MAU ending at date
select count(distinct user_id)
from bandie_metric_events
where user_id is not null
  and occurred_at >= (:date::date - interval '29 days')
  and occurred_at < (:date::date + interval '1 day');
```

Bandie should decide which events count as "active". Recommended: exclude purely passive system events and include meaningful product interactions such as login, page view, profile update, song view/create, setlist view/create, enquiry sent and availability response.

## 32.9 Data Privacy and Security

The admin portal will expose sensitive operational data. It must be built with strong security controls.

Requirements:

- Admin data must never be accessible from public routes.
- Admin APIs must check admin permissions server-side.
- RLS policies must prevent non-admin access.
- Sensitive data should be minimised on dashboards.
- Avoid exposing raw personal data unless required for support.
- Exports should require specific permission.
- Export events must be audit logged.
- Admin actions must include actor ID.
- Use least privilege service keys.
- Never expose service role keys in frontend code.
- Consider IP allowlisting for admin routes in future.
- Consider requiring MFA for admin users in future.

## 32.10 Admin RLS Policy Approach

Recommended approach:

- Normal application tables retain existing RLS for user-facing access.
- Admin APIs run in a secure server context and apply explicit admin permission checks.
- Direct client-side Supabase access to admin-sensitive data should be avoided.
- If direct Supabase admin reads are used, create narrow security-definer functions or admin-specific views with explicit checks.

Example helper function:

```sql
create or replace function bandie_is_platform_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from bandie_admin_users au
    where au.user_id = p_user_id
      and au.status = 'active'
  );
$$;
```

Example RLS pattern:

```sql
create policy "platform admins can read audit events"
on bandie_audit_events
for select
using (bandie_is_platform_admin(auth.uid()));
```

## 32.11 Audit Event Payload Design

Audit payloads should be structured enough to reconstruct what happened.

Example entitlement publish event:

```json
{
  "event_type": "admin.entitlement_published",
  "actor_id": "user_admin_123",
  "subject_type": "plan",
  "subject_id": "plan_band_free",
  "metadata": {
    "draft_id": "draft_456",
    "changes": [
      {
        "capability_key": "songs.max_count",
        "old_value": 6,
        "new_value": 10
      }
    ],
    "reason": "Free tier launch experiment"
  }
}
```

Example override event:

```json
{
  "event_type": "admin.override_created",
  "actor_id": "user_admin_123",
  "subject_type": "band",
  "subject_id": "band_789",
  "metadata": {
    "capability_key": "songs.max_count",
    "value": 20,
    "expires_at": "2026-09-30T23:59:59Z",
    "reason": "Early adopter support"
  }
}
```

---

## 33. Admin Portal User Experience Requirements

## 33.1 Admin Home Page

The admin home page should answer:

- Is the platform healthy?
- Are users growing?
- Are bands adopting the workspace?
- Are organisers using the directory?
- Which tiers are users on?
- Are free users hitting limits?
- Are upgrades happening?
- Are any billing/system issues present?

Recommended layout:

```text
Top row:
DAU | MAU | Total Users | Paid Bands | Paid Organisers | MRR Estimate

Second row:
Active Users Trend
Tier Distribution
Limit Hits / Upgrade Funnel

Third row:
Content Growth
Organiser Activity
System Alerts
```

## 33.2 Plan and Entitlement Editing UX

Editing should be safe and intentional.

Recommended flow:

1. Admin opens Plan Catalogue.
2. Admin selects a plan.
3. Admin clicks "Create Draft Change".
4. Admin edits capabilities/limits.
5. Admin sees validation errors if value types are wrong.
6. Admin previews impacted accounts.
7. Admin enters change reason.
8. Admin publishes.
9. System writes audit event and updates plan entitlement records.
10. Admin sees publish confirmation.

Avoid instant destructive edits to live entitlement records.

## 33.3 Metrics UX

Metrics pages should include:

- Date range picker.
- Segment filters.
- Chart/table toggle where useful.
- Export button where permitted.
- Definitions tooltip for each metric.
- Previous-period comparison.
- Last updated timestamp.
- Clear distinction between live and snapshot metrics.

## 33.4 Account Inspector UX

Each inspected account should show a "support summary" at the top.

Example band support summary:

```text
Band: Skin Condition
Plan: Bandie Free
Status: Active
Usage: 6/6 songs, 1/1 setlists, 4/5 members, 180MB/250MB storage
Recent gate denial: song.create denied because songs limit reached
Recommended action: Upgrade to Bandie Band or grant temporary override
```

This gives support admins enough context to answer user questions quickly.

---

## 34. Admin Portal API Response Examples

## 34.1 Overview Dashboard Response

```json
{
  "dateRange": {
    "from": "2026-06-01",
    "to": "2026-06-29"
  },
  "summary": {
    "dau": 428,
    "wau": 1820,
    "mau": 5120,
    "totalUsers": 18422,
    "totalBands": 2140,
    "paidBands": 318,
    "totalOrganisers": 540,
    "paidOrganisers": 42,
    "songsManaged": 38620,
    "setlistsManaged": 8210,
    "venuesRegistered": 730,
    "bookingEnquiries": 1260,
    "limitHits": 390,
    "upgradeConversions": 58
  },
  "comparison": {
    "dauChangePct": 8.2,
    "mauChangePct": 12.4,
    "paidBandsChangePct": 5.8
  }
}
```

## 34.2 Tier Distribution Response

```json
{
  "subjectType": "band",
  "tiers": [
    {
      "planCode": "band_free",
      "planName": "Band Free",
      "count": 1822,
      "percentage": 85.1
    },
    {
      "planCode": "band_standard",
      "planName": "Bandie Band",
      "count": 260,
      "percentage": 12.1
    },
    {
      "planCode": "band_pro",
      "planName": "Bandie Pro Band",
      "count": 58,
      "percentage": 2.7
    }
  ]
}
```

## 34.3 Entitlement Simulation Response

```json
{
  "allowed": false,
  "reasonCode": "limit_reached",
  "actor": {
    "userId": "user_123",
    "role": "band_owner",
    "roleAllowed": true
  },
  "subject": {
    "type": "band",
    "id": "band_456",
    "name": "Skin Condition"
  },
  "plan": {
    "code": "band_free",
    "name": "Band Free"
  },
  "capability": {
    "key": "song.create",
    "enabled": true
  },
  "usage": {
    "meterKey": "songs.count",
    "current": 6,
    "limit": 6
  },
  "requiredPlan": {
    "code": "band_standard",
    "name": "Bandie Band"
  },
  "message": "Your free band workspace includes 6 songs. Upgrade to Bandie Band to add more songs."
}
```

---

## 35. Admin Portal Implementation Phases

## Phase A — Admin Foundation

Build:

- Admin user table.
- Admin role/permission model.
- Protected `/admin` route group.
- Admin API middleware.
- Basic audit logging for admin actions.
- Read-only overview dashboard shell.
- User/band/organiser search.

Acceptance criteria:

- Non-admin users cannot access admin routes.
- Admin APIs reject users without required permission.
- Admin actions are audit logged.
- Admin can search users, bands and organisers.

## Phase B — Metrics MVP

Build:

- `bandie_metric_events`.
- Event tracking helpers.
- Daily aggregation job.
- `bandie_daily_metric_snapshots`.
- Overview dashboard metrics.
- Active users dashboard.
- Tier distribution dashboard.
- Content usage dashboard.
- CSV export for permitted admins.

Acceptance criteria:

- Admin can view DAU, WAU, MAU.
- Admin can view users by type.
- Admin can view bands and organisers by tier.
- Admin can view total songs, setlists, venues and open mic events.
- Metrics show last updated timestamp.

## Phase C — Entitlement Admin MVP

Build:

- Plan catalogue view.
- Entitlement matrix view.
- Draft entitlement changes.
- Publish entitlement changes.
- Usage limit editor.
- Impact preview for limit changes.
- Entitlement inspector.
- Gate decision logs.

Acceptance criteria:

- Admin can move a capability between tiers through draft/publish workflow.
- Admin can change free song limit from 6 to another value without code change.
- Admin can simulate whether a band can create a song folder.
- Published changes are audit logged.
- Historical plan/entitlement versions are retained.

## Phase D — Support and Billing Admin

Build:

- Subscription dashboard.
- Trial management.
- Override management.
- Stripe customer/subscription links.
- Webhook status page.
- Reconciliation job trigger.
- Account support summaries.

Acceptance criteria:

- Admin can view subscription status for a band.
- Admin can start a trial with expiry.
- Admin can grant a temporary higher song limit.
- Admin can view failed Stripe webhooks.
- Admin can reconcile local subscription state against Stripe.

## Phase E — System Health and Moderation

Build:

- System jobs page.
- Storage health metrics.
- Error summaries.
- Public profile moderation.
- Reported content queue.
- Admin alerts.

Acceptance criteria:

- Admin can see whether metrics aggregation succeeded.
- Admin can see failed background jobs.
- Admin can hide a public band profile with reason.
- Moderation actions are audit logged.

---

## 36. Admin Portal Acceptance Criteria

## 36.1 Access Control

- Non-admin users cannot access `/admin`.
- Admin API calls fail if the user lacks the required admin permission.
- Admin role changes are audit logged.
- Admin users can only perform actions allowed by their role/capabilities.

## 36.2 Metrics

- Admin can view DAU, WAU and MAU.
- Admin can view total users by type.
- Admin can view number of users/accounts at each tier.
- Admin can view number of bands by tier.
- Admin can view number of organisers by tier.
- Admin can view total songs managed across the platform.
- Admin can view total setlists managed across the platform.
- Admin can view total venues, booking enquiries and open mic events.
- Metrics can be filtered by date range.
- Metrics show last updated timestamp.

## 36.3 Entitlement Control

- Admin can view plan catalogue.
- Admin can view a matrix of features and limits by plan.
- Admin can create a draft change.
- Admin can change a usage limit in draft.
- Admin can publish the change.
- Application entitlement checks use the new published value without code changes.
- Published changes are audit logged.
- Admin can see impacted accounts before reducing a limit.

## 36.4 Account and Support Tools

- Admin can search for a user by email.
- Admin can inspect a band and see its plan, usage, limits and recent gate denials.
- Admin can inspect an organiser and see venues, tier, enquiries and limits.
- Admin can simulate a feature gate decision.
- Admin can grant a temporary override with reason and expiry.
- Override expiry is respected by entitlement checks.

## 36.5 Billing and Trials

- Admin can see subscription status by account.
- Admin can identify past-due accounts.
- Admin can start and end manual trials.
- Admin can view Stripe customer/subscription references.
- Billing webhook failures are visible to technical admins.
- Webhook replay is permission-controlled and audit logged.

## 36.6 Auditability

- All plan, entitlement, override, trial, subscription and moderation admin actions are audit logged.
- Audit logs include actor, timestamp, subject, event type and metadata.
- Audit logs are searchable by actor, subject, event type and date.
- Metrics exports are audit logged.

---

## 37. Admin Portal Risks and Mitigations

| Risk | Description | Mitigation |
|---|---|---|
| Admin portal exposes sensitive user data | Internal dashboards can reveal personal and commercial data | Strict RBAC, minimal data, audit exports, admin route protection |
| Entitlement changes break live customers | Changing limits/features could unintentionally block users | Draft/publish workflow, impact preview, audit logs, rollback |
| Metrics become inconsistent | Event tracking and database counts may drift | Daily reconciliation jobs, metric definitions, last-updated timestamps |
| Too much admin power for support users | Support admins could grant inappropriate access | Permission-based roles, expiry-required overrides, audit trail |
| Dashboard queries become slow | Aggregating raw events at page load will not scale | Daily snapshots, materialized views, paginated APIs |
| Stripe and local subscription state drift | Webhook failure may leave wrong plan active | Webhook event table, idempotent processing, reconciliation job |
| Admin actions are not explainable | Hard to know who changed tier rules | Structured audit events with change reason |
| Pricing experiments become chaotic | Too many changes with no version history | Plan versions, entitlement drafts, publish history |
| Reduced limits create angry users | Existing customers may become over-limit | Preview impact, preserve content, block only new creation, grandfather plans |

---

## 38. Recommended MVP Admin Scope

For the first admin implementation, build the following:

1. Protected admin route group.
2. Admin user and permission model.
3. Overview metrics dashboard.
4. DAU, WAU, MAU metrics.
5. User type breakdown.
6. Tier distribution dashboard.
7. Content metrics: songs, setlists, song folders, files, bands, venues and events.
8. Plan catalogue view.
9. Entitlement matrix view.
10. Draft/publish flow for entitlement and limit changes.
11. Account inspector for users, bands and organisers.
12. Entitlement inspector.
13. Manual override and trial management.
14. Audit log.
15. Basic system health for jobs and Stripe webhooks.

Do not build advanced BI, complex experimentation, dual approval workflows or full moderation automation in MVP.

---

## 39. Combined Implementation Roadmap

The full monetisation and admin control platform should be implemented in the following sequence.

| Phase | Name | Main outcome |
|---|---|---|
| 1 | Core entitlement framework | App can enforce feature and usage gates |
| 2 | Admin foundation | Internal users can safely access admin portal |
| 3 | Metrics event tracking | Platform can record product and commercial events |
| 4 | Metrics dashboards | Admins can see active users, tiers and content usage |
| 5 | Plan and entitlement admin | Admins can change tiers/limits without code |
| 6 | Billing integration | Stripe subscription state updates plans |
| 7 | Support tools | Admins can inspect accounts and resolve access issues |
| 8 | Add-ons and event packs | Open mic/event packs and extra limits supported |
| 9 | System health and moderation | Operational/admin maturity |
| 10 | Experiments and optimisation | Pricing experiments, grandfathering and advanced analytics |

---

## 40. Updated Summary Recommendation

Bandie should implement the entitlement framework and admin portal as one connected operating system.

The entitlement framework decides what users, bands and organisers can do. The admin portal allows Bandie to control those rules, observe how the platform is being used, and make commercial changes safely.

The most important design principles are:

- Do not hard-code tiers into product features.
- Store plans, capabilities and limits as data.
- Enforce gates server-side.
- Track usage consistently.
- Make admin changes through draft and publish workflows.
- Show admins the impact of changing limits.
- Record audit logs for all high-risk actions.
- Use metrics to understand whether free limits are driving healthy upgrades or causing friction.
- Keep the admin portal secure, permissioned and observable.

With this design, Bandie can test and evolve commercial packaging such as free player profiles, free band workspaces with 6 songs and 1 setlist, paid song folders, organiser venue limits, open mic event packs and future marketplace pricing without rebuilding the product each time pricing changes.
