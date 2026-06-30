# Bandie — Product Technical Requirements

**Document status:** Authoritative technical requirements  
**Product:** Bandie  
**Last updated:** 30 June 2026

---

## 1. Purpose

This document defines **how Bandie is built** — stack, architecture, repository structure, backend approach, and technical constraints. It supplements generic RSD architecture docs with Bandie-specific decisions.

Generic RSD rules in `docs/RSD_SYSTEM_ARCHITECTURE.md` apply unless explicitly overridden here.

---

## 2. Architectural decisions (recorded)

### 2.1 Web framework: Vite + React + TypeScript

**Decision:** Use Vite + React + TypeScript for `@bandie/web`.

**Rationale:**
- Homepage MVP is primarily static marketing content — Vite is sufficient
- Aligns with `RSD_SUPABASE_MULTI_TENANT_DB.md` environment variable conventions (`VITE_*`)
- Fast dev experience; Netlify deployment is straightforward
- Shared packages integrate cleanly via workspace aliases

**Future consideration:** If public profile SEO becomes a blocker, evaluate SSR/prerender (Vite SSR plugin or migration to Next.js). Document any change here before proceeding.

### 2.2 Mobile: React Native (Expo) — deferred

**Decision:** Mobile scaffold is a placeholder. Expo + React Native when mobile work begins.

**Rationale:** Web-first delivery; mobile focuses on member tasks (availability, setlists, song viewing) after core web workspace exists.

### 2.3 Backend: Shared Supabase multi-app instance

**Decision:** Bandie uses the **shared Proffyn Supabase project** with app-prefixed naming.

**Confirmed by product owner:** Multi-tenant database approach is in use.

| Item | Value |
|---|---|
| Supabase project name | `proff-rsd-mt-1` |
| Supabase project ID | `cjmgrsvbrcgozgjxbriz` |
| Supabase URL | `https://cjmgrsvbrcgozgjxbriz.supabase.co` |
| App code | `bandie` |
| Table prefix | `bandie_` |
| Storage buckets | `bandie-*` (e.g. `bandie-song-files`) |
| Edge functions | `bandie_*` prefix |

**GitHub repository:** [https://github.com/chris-proffyn/bandie](https://github.com/chris-proffyn/bandie)

**Rationale:** Cost-effective for MVP/prototype stage; documented split path if Bandie scales independently.

**Reference:** `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`

### 2.4 Hosting: Netlify

Web app deploys to Netlify with CI from GitHub. Separate Supabase projects per environment (dev/staging/production).

### 2.5 Monorepo structure

```
/
├── apps/
│   ├── web/          @bandie/web — Vite React app (Netlify)
│   └── mobile/       Placeholder — Expo (future)
├── packages/
│   ├── ui/           @bandie/ui — shared components
│   ├── data/         @bandie/data — Supabase data-access layer
│   └── utils/        @bandie/utils — pure utilities, analytics
├── supabase/
│   ├── migrations/   SQL migrations (authoritative)
│   └── seed/         Dev seed data
└── docs/             Governance and project docs
```

---

## 3. Technology stack

| Layer | Technology |
|---|---|
| Web UI | React 19, TypeScript, Vite |
| Routing | React Router |
| Styling | CSS modules / component-scoped CSS (Tailwind optional later) |
| Mobile (future) | Expo, React Native |
| Backend | Supabase (Auth, Postgres, RLS, Storage) |
| Email (Auth) | Resend SMTP via Supabase |
| Testing | Jest (Vitest acceptable for Vite packages) |
| CI/CD | GitHub Actions |
| Web hosting | Netlify |
| Source control | GitHub |

---

## 4. Data access rules (strict)

- **UI code must NOT import `@supabase/supabase-js` directly**
- All Supabase access goes through `@bandie/data`
- RLS enabled on every user-facing table
- No service-role keys in client code
- Schema changes only via `supabase/migrations/`
- UUID primary keys, `timestamptz` timestamps per `RSD_DATA_MODELLING_GUIDE.md`

---

## 5. Environment variables

```bash
# Client (web / mobile) — publishable key only
VITE_SUPABASE_URL=https://cjmgrsvbrcgozgjxbriz.supabase.co
VITE_SUPABASE_ANON_KEY=   # sb_publishable_... (modern publishable key)
VITE_APP_CODE=bandie
VITE_APP_URL=
# live = hide fictitious test bands/players; test = show all directory data
VITE_BANDIE_DATA_MODE=live

# Server / CLI / migrations — never in client code
SUPABASE_URL=https://cjmgrsvbrcgozgjxbriz.supabase.co
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=      # sb_secret_... (replaces legacy service_role)
```

Copy from `.env.example`. Never commit `.env` files.

---

## 6. Core data model (Bandie tables)

All tables prefixed `bandie_`. Full schema to be defined in migrations. Conceptual entities from product description:

| Entity | Purpose |
|---|---|
| `bandie_profiles` | Musician / player profile (display name, username, instruments, gear, directory visibility, player/organiser roles, leader contact fields, optional `entitlement_test_leader_plan_code` for launch-promo tier simulation) |
| `bandie_bands` | Band workspace + public profile |
| `bandie_band_members` | User ↔ band with roles |
| `bandie_band_invitations` | Email invitations with accept token |
| `bandie_band_parts` | Lineup roles (title, instrument filter, sort order, assigned member) |
| `bandie_player_outreach` | Leader-initiated audition/join invites to directory players |
| `bandie_user_messages` | Direct messages between Bandie users (inbox / send by username, reply threading) |
| `bandie_band_set_offers` | Fixed set length & fee packages per band |
| `bandie_band_dynamic_fee_offers` | Session-based dynamic fee packages (appearance + per-session fees) |
| `bandie_organiser_venues` | Organiser-managed venues (pub, club, festival site, etc.) |
| `bandie_countries` | Directory filter reference — ISO country codes (public read) |
| `bandie_regions` | Directory filter reference — regions within a country with search keywords (public read) |
| `bandie_band_media` | Band photos, videos, tracks (URLs) |
| `bandie_band_social_links` | Social platform links |
| `bandie_band_public_dates` | Manual public availability dates |
| `bandie_songs` | Repertoire entries |
| `bandie_song_part_folders` | Logical part folders per song; optional Dropbox path mapping |
| `bandie_song_part_files` | Song-part file metadata; bytes in Dropbox |
| `bandie_song_part_file_activity` | Audit log for song-part file actions |
| `bandie_user_integrations` | Leader OAuth connections — Dropbox |
| `bandie_band_song_part_storage` | Per-band Dropbox song-parts root folder mapping |
| `bandie_setlists` | Setlist definitions |
| `bandie_setlist_items` | Songs in setlist order |
| `bandie_calendar_events` | Rehearsals and availability windows (`series_key`, `repeat_pattern` for repeating series) |
| `bandie_availability_votes` | Member votes on calendar events |
| `bandie_gigs` | Gig records (enquiry through archived) |
| `bandie_booking_enquiries` | Structured booking enquiry metadata (links to `bandie_user_messages`; `metadata` may include `gig_id`, `gig_title`, budget, event time) |
| `bandie_plans` | Subscription plan catalogue |
| `bandie_capabilities` | Entitlement capability definitions |
| `bandie_plan_entitlements` | Plan → capability values |
| `bandie_subscriptions` | User subscriptions (`plan_scope`: leader \| organiser) |
| `bandie_usage_meters` | Usage counters for limit enforcement |
| `bandie_entitlement_overrides` | Manual admin overrides |
| `bandie_audit_events` | Admin audit log |
| `bandie_metric_events` | Product analytics events |
| `bandie_daily_metric_snapshots` | Aggregated daily metrics |
| `bandie_gate_decision_logs` | Entitlement gate decisions (especially denials) |
| `bandie_entitlement_drafts` / `bandie_entitlement_draft_items` | Staged entitlement changes |
| `bandie_platform_settings` | Platform config (e.g. `entitlements_enforced`) |

Plus platform tables from multi-tenant guide (`platform_apps`, `platform_app_memberships`, etc.).

RLS policies must enforce band membership for all private data.

**Communications data access (`@bandie/data`):**
- `listPendingInvitationsForCurrentUser`, `acceptBandInvitation`, `declineBandInvitation`, `acceptAllPendingInvitations` — band invitations
- `listMyPendingPlayerOutreach`, `respondToPlayerOutreach`, `countMyPendingPlayerOutreach` — player outreach inbox
- `listMyMessages`, `sendDirectMessage`, `replyToMessage`, `markMessageRead`, `countUnreadMessages` — direct messages
- `listCommunications`, `filterCommunications`, `filterResolvedInviteCommunications`, `filterReadGeneralMessages`, `getCommunicationCategory`, `getCommunicationSummary`, `getNotificationSummary` — unified feed (three categories: player invite, gig invite, general message) and nav badge
- `listMyBookingEnquiries`, `sendBookingEnquiry`, `markBookingEnquiryRead` — structured booking enquiries
- RPCs: `bandie_list_my_pending_invitations`, `bandie_decline_invitation`, `bandie_list_my_pending_player_outreach`, `bandie_respond_to_player_outreach`, `bandie_list_my_messages`, `bandie_count_my_unread_messages`, `bandie_list_my_booking_enquiries`, `bandie_count_booking_enquiries_sent_this_month`

**Band overview data access (`@bandie/data`):**
- `getBandLeaderContact`, `listBandLeaders` — RPCs for primary and all leader contact details
- `addBandLeader`, `removeBandLeader` — RPCs `bandie_add_band_leader`, `bandie_remove_band_leader` (any leader can add/remove co-leaders; last leader cannot be removed)
- `setPrimaryBandContact` — RPC `bandie_set_primary_band_contact` (assign primary public contact among active leaders)
- `assignBandLeader` — alias for `addBandLeader` (legacy name)
- `ensureBandLeader` — RPC `bandie_ensure_band_leader` (reconcile primary contact; interim admin fallback)
- `listBandParts`, `createBandPart`, `updateBandPart`, `deleteBandPart`, `createDefaultBandParts`, `syncBandSizeFromParts`, `assignMemberToPart` — lineup parts; syncs `bandie_bands.band_size`
- `createPlayerOutreach`, `listPlayerOutreachForBand` — RPC `bandie_create_player_outreach` (audition/join from player directory)
- Public profile roster: RPCs `bandie_list_public_band_members`, `bandie_get_public_band_primary_contact` (via `getPublicBandProfile`)
- Set/fee offers: managed via `updateBandProfile` / `replaceBandSetOffers`, `replaceBandDynamicFeeOffers`
- Leader contact fields on `UserProfile`: `contact_email`, `contact_phone` (via `updateUserProfile`)

**Organiser venues (`@bandie/data`):**
- `listMyOrganiserVenues`, `createOrganiserVenue`, `updateOrganiserVenue`, `deleteOrganiserVenue`
- `uploadOrganiserVenueImage`, `removeOrganiserVenueImage` — storage helpers

**Admin mode (`@bandie/data`):**
- `isCurrentUserAppAdmin`, `setBandieAdminModeActive`, `isBandieAdminModeActive` — client-side admin mode flag; admins bypass membership checks when active

**Entitlements (`@bandie/data`):**
- `canPerform`, `assertCanPerform`, `checkBandLeaderCapability`, `checkUserOrganiserCapability`
- `isEntitlementEnforcementEnabled` — env (`VITE_BANDIE_ENFORCE_ENTITLEMENTS`) OR platform setting (`entitlements_enforced`)
- `loadPlatformEntitlementEnforcement`, `setEntitlementsEnforced` — platform toggle (admin)
- **Plan catalogue (display names in `bandie_plans.name`, codes stable):**

| Code | Display name | Scope |
|---|---|---|
| `player_free` | Player Free | Player (default) — member-first; no band creates |
| `player_plus` | Player Plus | Band leader (paid) |
| `player_pro` | Player Pro | Band leader (paid) |
| `organiser_free` | Organiser Free | Organiser (default) |
| `organiser_plus` | Organiser Plus | Organiser (paid) |

Band workspace limits resolve from the **primary leader’s** active subscription (`plan_scope = leader`). Upgrade prompt labels use `PLAN_DISPLAY_NAMES` for known codes; live plan names also load from the DB on subscription join.

**Launch promo plan override:** When a user has an active `launch_promo` leader subscription, `bandie_profiles.entitlement_test_leader_plan_code` may be set to `player_free`, `player_plus`, or `player_pro`. `loadActiveSubscription()` and `listUserSubscriptions()` resolve the **effective** plan from this override for entitlement checks and billing UI; the subscription row is unchanged. Cleared or null uses full launch access (Player Pro).

**Player plan limits (seeded in `20260630190000`; authoritative in entitlements spec §20.2):**

| Code | `bands.max_count` | `songs.max_count` | `setlists.max_count` | Creates (band/song/setlist/upload) |
|---|---:|---:|---:|---|
| `player_free` | 0 | 0 | 0 | No | No directories |

**Player Free scope:** `band_directory.browse` and `player_directory.browse` are false. Users access band workspace features only as invited members (RLS + membership). Organiser venues use the organiser plan (`organiser_free` / `organiser_plus`), not the player tier.
| `player_plus` | 1 | 20 | 3 | Yes |
| `player_pro` | unlimited | 999 | 999 | Yes |

**Test data (`VITE_BANDIE_DATA_MODE`):**
- `live` — `@bandie/data` `filterTestRows()` excludes `test_user` rows from directory APIs; web hides **Hide test data** toggles
- `test` — all rows returned; web may filter client-side via `directoryTestDataPreference.ts` (session storage)

**Platform admin (`@bandie/data`):**
- `adminPortal.ts` — search, audit, overview counts
- `metrics.ts` — `trackMetricEvent`, snapshots, aggregation RPC
- `entitlementAdmin.ts` — editable plan catalogue, plan matrix, drafts, overrides, publish (`updatePlanCatalogueEntry`, `updatePlanEntitlement`, `removePlanEntitlement`, …)
- `gateLogs.ts` — gate decision logging

**Calendar, gigs, booking (`@bandie/data`):**
- `calendar.ts` — events, votes, repeating series (`calendarRecurrence.ts`: weekly, monthly nth weekday), `calendar.use` tier (`none` on Player Free; `full` on Player Plus / Player Pro)
- `gigs.ts` — organiser gig CRUD, band invites, setlist assignment RPCs, `gig.create` limits (organiser scope)
- `bookingEnquiries.ts` — send, inbox, `booking_enquiry.send` limits

**Usernames (`@bandie/data`):**
- `normalizeUsername`, `validateUsernameInput`, `ensureProfileUsername`
- Login accepts email or username (`signInWithEmailOrUsername`)
- Direct messages addressed by username

**Directory geography (`@bandie/data`):**
- `listBandieCountries`, `listBandieRegions`, `loadGeographyIndex` — reference data for filter dropdowns
- `matchesAreaFilter`, `inferDefaultCountryCode` — client-side filter matching and geo defaults
- `bandie_bands.country_id` / `region_id` and `bandie_profiles.country_id` / `region_id` — optional FKs; text location fallback via region `search_keywords`

**Dropbox song-part storage (implemented — Phase 6):**

Authoritative spec: `docs/project/bandie_dropbox_song_part_storage_spec.md`

- OAuth connect/callback — server-side only; encrypted tokens in `bandie_user_integrations`
- Band song-parts root initialisation — `bandie_band_song_part_storage`
- Upload, attach, preview, download — Bandie API routes proxy Dropbox; path validated under band root
- File metadata and status — `bandie_song_part_files`; activity — `bandie_song_part_file_activity`
- Provider abstraction — `ExternalStorageProvider` interface; MVP implements Dropbox only
- UI must not receive refresh tokens; members access files via Bandie permissions, not Dropbox ACLs

---

## 7. Storage

| Store | Purpose | Notes |
|---|---|---|
| `bandie-profile-images` (Supabase) | Band logos/heroes, user avatars, organiser venue photos | `bands/{band_id}/…`, `users/{user_id}/avatar.{ext}`, `venues/{venue_id}/…` |
| **Dropbox** (external) | Song-part file bytes only — tabs, PDFs, charts, lyrics | Leader-owned OAuth; one song-parts root per band. See `bandie_dropbox_song_part_storage_spec.md` |
| Bandie Postgres | Song metadata, part folders, file metadata, status, readiness, activity | Source of truth for permissions and relationships |

- Profile images: JPEG, PNG, WebP, GIF up to 5 MB
- Storage RLS uses `security definer` helpers (`bandie_can_manage_profile_image`, `bandie_can_manage_user_profile_image`)
- **Song-part files (decided):** Dropbox, not `bandie-song-files` Supabase bucket
- Song-part MVP types: PDF, JPEG/PNG/WebP, plain text/markdown, ChordPro, Guitar Pro
- Song-part MVP size limit: **25 MB** per file; video not allowed in MVP
- Dropbox tokens: encrypted at rest, server-side only; never exposed to frontend

---

## 8. Authentication

- Supabase Auth (email + password)
- **Temporary:** email verification disabled to avoid Supabase auth email rate limits during early development; signup signs users in immediately. Re-enable `auth.email.enable_confirmations` in Supabase when Resend SMTP verification is restored.
- Signup requires password confirmation; password fields include show/hide toggle
- Flows: register, login, logout, password reset
- Session persisted in `localStorage` with auto-refresh and URL detection
- Sign-out navigates to `/` before clearing session (avoids redirect to `/login`)
- Post-auth routing based on band membership and pending invitations/outreach (`routeAfterAuth`); pending items route to `/app/communications`
- App membership via `platform_user_app_memberships` (multi-tenant pattern)
- Display name resolution: profile `display_name` → auth `user_metadata.display_name` → email local-part → `"Band member"`

**Workspace mode routing (`@bandie/data` `workspaceMode.ts`, `AuthContext`):**
- `resolveWorkspaceMode` — player-only, organiser-only, or stored preference when user has both roles
- `workspaceModeHomePath` — player → `/app`; organiser → `/app/bands`
- `isPlayerWorkspaceRoute` — true for `/app/:bandId/...` band workspaces; **false** for organiser routes (`/app/venues`, `/app/gigs`, `/app/bands`, `/app/players`, …). Organisers on a player band URL are redirected to `/app/bands`.
- `bandRoutes.ts` — `RESERVED_APP_BAND_SEGMENTS` prevents `/app/gigs`, `/app/venues`, etc. from matching `:bandId`

---

## 9. Web application structure

```
apps/web/src/
├── components/
│   ├── app/           App shell (layout, header, band switcher)
│   ├── auth/          Auth layout, protected/guest routes, workspace mode route
│   ├── band/          Band workspace (overview tabs, leader section, lineup parts, profile editor, members, invitations)
│   ├── bands/         Band cards (My bands, workspace)
│   ├── communications/ Invitations, player outreach, messages panels and unified feed
│   ├── directory/     Band and player directory filters and cards
│   ├── marketing/     Public homepage nav and sections (three-mode layout)
│   ├── organiser/     Organiser venue forms and cards
│   └── profile/       Profile editors, public profile views, `BandBookingContactCard`, `BandBookingModal`
├── content/           Static content configs (e.g. homepageContent.ts)
├── context/           AuthContext (session, profile, bands, displayName)
├── pages/
│   ├── app/           Protected workspace pages
│   └── auth/          Login, signup, password reset
├── lib/               Client init, helpers, hooks (`brand.ts` — shared logo mark)
├── styles/            auth.css, directory.css, communications.css, workspace.css, bandProfile.css, brand.css
└── main.tsx           BrowserRouter + AuthProvider
```

Homepage component breakdown per `bandie_homepage_functional_technical_spec.md` §13.3.

---

## 10. Design tokens (Bandie brand)

From homepage spec — use consistently across public pages:

```ts
colors: {
  background: '#0b0d12',
  backgroundAlt: '#111521',
  paper: '#f8f2e8',
  text: '#f8f4ec',
  muted: '#bdb7ab',
  accent: '#ffcf4a',
  accentPink: '#ff5e7e',
  accentTeal: '#55e0c0',
}
```

Breakpoints: mobile 0–639px, tablet 640–1023px, desktop 1024px+.

**Logo mark:** `bandie_logo.svg` in `apps/web/public/` (PNG fallback: `bandie logo.png`). Rendered via `BandieLogo` component and `BANDIE_LOGO_SVG` / `BANDIE_LOGO_PNG` in `apps/web/src/lib/brand.ts`; sizing in `apps/web/src/styles/brand.css`.

## 11. Routing (implemented)

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Marketing homepage |
| `/bands` | Public | Band directory |
| `/bands/:slug` | Public | Public band profile |
| `/players` | Public | Player directory |
| `/players/:profileId` | Public | Public player profile |
| `/invite/:token` | Public | Accept band invitation |
| `/signup` | Guest | Registration |
| `/login` | Guest | Login |
| `/forgot-password` | Guest | Request password reset |
| `/reset-password` | Auth | Set new password |
| `/app` | Protected | My bands hub |
| `/app/communications` | Protected | Communications hub (invitations, player outreach, messages) |
| `/app/notifications` | Protected | Redirects to `/app/communications` |
| `/app/invites` | Protected | Redirects to `/app/communications` |
| `/app/profile` | Protected | Musician / player profile editor |
| `/app/players` | Protected | Player directory (find members or deps); supports `?forBand=&part=&instrument=` for lineup recruitment |
| `/app/players/:profileId` | Protected | Workspace player profile with invite panel when recruiting from a band part |
| `/app/bands` | Protected | Band directory (workspace view) |
| `/app/bands/new` | Protected | Create band |
| `/app/venues` | Protected (organiser mode) | Organiser venues |
| `/app/gigs` | Protected (organiser mode) | Organiser gig list and create |
| `/app/gigs/:gigId` | Protected (organiser mode) | Organiser gig detail (venue, band invites, running order) |
| `/app/profiles/:profileId/edit` | Protected (admin mode) | Admin edit player profile |
| `/app/:bandId/songs` | Protected | Songs dashboard |
| `/app/:bandId/songs/:songId` | Protected | Song folder |
| `/app/:bandId/setlists` | Protected | Setlist library |
| `/app/:bandId/setlists/:setlistId` | Protected | Setlist builder |
| `/app/:bandId/calendar` | Protected | Calendar and availability |
| `/app/:bandId/gigs` | Protected | Band gig invitations |
| `/app/:bandId/gigs/:gigId` | Protected | Band gig invitation detail (accept/reject, setlist) |
| `/admin` | Protected (app admin) | Platform admin overview |
| `/admin/accounts` | Protected (app admin) | User/band search |
| `/admin/metrics` | Protected (app admin) | Platform metrics |
| `/admin/entitlements` | Protected (app admin) | Entitlement admin and enforcement toggle |
| `/admin/audit` | Protected (app admin) | Admin audit log |
| `/app/:bandId` | Protected | Band workspace overview (Members / Band details tabs) |

Legacy routes `/app/:bandId/profile` and `/app/:bandId/members` redirect to overview.

---

## 12. Analytics

Provider-neutral `trackEvent()` in `@bandie/utils`. Homepage events per `bandie_homepage_functional_technical_spec.md` §16.

---

## 13. Testing requirements

Per `RSD_TESTING_STRATEGY.md`:

- Unit tests: utilities, hooks, data-access functions
- Component tests: core UI, complex interactions
- CI must pass lint, test, and build before merge

---

## 14. CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. Install (`npm ci`)
2. Lint
3. Build (all workspaces)

Netlify deploys from `main` using `netlify.toml` with SPA redirects.

Supabase migrations applied via `supabase db push` to `proff-rsd-mt-1`.

---

## 15. Security requirements

- RLS on all band-scoped tables
- Private file URLs must not be guessable; use signed URLs where appropriate
- Input validation on all public forms (booking enquiry)
- Rate limiting on enquiry submission via entitlement service when enforcing (`booking_enquiry.send`, `booking_enquiries.monthly_max_count`)
- No secrets in client bundle or repository

---

## 16. Deferred technical decisions

| Topic | Options | Resolve before |
|---|---|---|
| Tailwind vs CSS modules | CSS modules / scoped CSS in use | Resolved |
| Vitest vs Jest | Vitest fits Vite; Jest per RSD | First test pack |
| Song-part file hosting | ~~Supabase Storage~~ vs Dropbox vs multi-provider | **Resolved — Dropbox for MVP** (`bandie_dropbox_song_part_storage_spec.md`) |
| Song-part file size / types | Spec §6.6 | **Resolved — 25 MB; PDF, images, text, ChordPro, Guitar Pro** |
| Real-time (Supabase Realtime) | Availability voting live updates | Optional polish — calendar polls on save today |
| SSR/prerender for SEO | Vite plugin vs Next.js | Public profile launch |
| Additional storage providers | Google Drive, OneDrive, Box, Bandie native | Post-MVP |

Record decisions in this document when resolved.
