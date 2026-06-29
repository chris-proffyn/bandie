# Bandie — Project Status Tracker

**Document status:** Live project tracker  
**Product:** Bandie  
**Phase:** Phase 15 (billing) implemented — configure Stripe env vars and sync plans  
**Last updated:** 30 June 2026 (player plan entitlements, UX polish, test-data toggles, docs sync)

---

## Current state

| Item | Status |
|---|---|
| RSD foundational docs | Complete |
| Project-specific docs (product description, mockups, homepage spec) | Complete |
| Monorepo bootstrap (`apps/`, `packages/`, `supabase/`) | Complete |
| Governance docs (requirements, delivery map) | Complete |
| Web app scaffold (Vite + React + TypeScript) | Complete |
| Bandie homepage (Phase 1) | Complete |
| Mobile app (Phase 18) | Not started (placeholder only) |
| Supabase schema / migrations | Platform + Bandie through `20260630190000` (player plan entitlements); applied to remote (`supabase db push`) |
| Authentication & band membership (Phase 2) | Complete |
| Public band profile (Phase 3) | Complete |
| Band directory (Phase 4) | Complete |
| Musician / player profile | Complete |
| Player directory | Complete |
| Directory area filters | Complete — country + region on `/bands`, `/players`, `/app/bands`, `/app/players`; geo-detected default country |
| Private workspace shell (Phase 5) | Complete — tabbed overview, leader contact, lineup parts, recruitment, invitations |
| Workspace communications | Complete — unified hub at `/app/communications` (invites, outreach, messages, booking enquiries) |
| Booking enquiries | Complete — public form, structured inbox, entitlement rate limits when enforcing |
| Organiser venues | Complete — `/app/venues` in organiser workspace mode |
| Organiser gigs | Complete — `/app/gigs` in organiser workspace mode; band invites at `/app/:bandId/gigs` |
| Song-part file storage | **Dropbox** — leader OAuth, band song-parts root, upload/preview/download via Netlify (`bandie_dropbox_song_part_storage_spec.md`) |
| Songs & repertoire (Phase 6) | Complete — dashboard, song folder, Dropbox uploads, part templates, in-app PDF view, soft delete |
| Setlist management (Phase 7) | Complete — library, builder with drag reorder, live metrics, leader-only edit |
| Entitlement framework (Phase 8) | Complete — schema, seeds, service, gate hooks; enforcement off by default |
| Calendar & gigs (Phases 9–10) | Complete — `/app/:bandId/calendar`; organiser gigs `/app/gigs`; band invites `/app/:bandId/gigs` |
| Admin portal & metrics (Phases 12–14) | Complete — `/admin` (overview, accounts, metrics, editable plan catalogue, audit); enforcement toggle |
| Billing (Phase 15) | Implemented — Stripe checkout, webhooks, `/app/profile` billing, `/admin/billing`; requires env vars + plan sync |

## Active constraints

- Follow Proffyn RSD process: Understand → Summarise → Plan → Execute/Test → Document
- UI must not call Supabase directly — use `@bandie/data`
- All schema changes via `supabase/migrations/` with RLS enabled
- Work one task at a time; update this tracker after each capability
- **Supabase:** Shared multi-app instance `proff-rsd-mt-1` — multi-tenant approach **confirmed**
- **GitHub:** [github.com/chris-proffyn/bandie](https://github.com/chris-proffyn/bandie)
- **Web framework:** Vite + React + TypeScript (see technical requirements)
- **Hosting target:** Netlify

## Current focus

**Next capability:** Configure Stripe in Netlify and smoke-test checkout (Phase 15 deployment)

**Immediate task:** Run `supabase db push` for launch promo migration; enable **Enforce entitlements** at `/admin/entitlements`; confirm launch end date at `/admin/billing`

**Launch promo (Option 2):** 30-day Player Pro / Organiser Plus trials via `bandie_subscriptions` (`source: launch_promo`); no Stripe until promo ends. See `/admin/billing` and `/app/profile` billing panel.

**Before turning on enforcement in production:** smoke-test calendar, gigs, booking inbox, and `/admin`; turn on platform toggle for `entitlements_enforced` at launch

Reference documents:
- `docs/project/bandie_entitlements_admin_portal_functional_technical_spec.md` — authoritative for Phases 8, 12–15, 17
- `docs/project/product-functional-requirements.md` §10–12 (calendar, gigs, booking)
- `docs/project/bandie_dropbox_song_part_storage_spec.md`
- `docs/project/product-technical-requirements.md`

## Phase roadmap (unified)

Single numbering for product features, monetisation, admin, and mobile. Sub-phases (e.g. 2b, 6b) remain for parallel tracks within an area.

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0–7 | Foundations through setlists | Complete | Homepage, auth, directories, workspace, songs, Dropbox, setlists |
| **8** | **Entitlement framework** | **Complete** | Plans, `canPerform()`, gate hooks; enforcement off by default |
| **9** | **Calendar and availability** | **Complete** | Rehearsal + gig availability, voting, public publish sync |
| **10** | **Gig management** | **Complete** | Gig records, setlist linking, status workflow |
| **11** | **Booking enquiries** | **Complete** | Public form, structured inbox, entitlement rate limits when enforcing |
| **12** | **Admin portal foundation** | **Complete** | `/admin`, audit log, account search, overview shell |
| **13** | **Platform metrics** | **Complete** | Event tracking, daily snapshots, DAU/WAU/MAU, CSV export |
| **14** | **Entitlement admin** | **Complete** | Editable plan catalogue, draft/publish, overrides, gate logs, enforcement toggle |
| **15** | **Billing integration** | **Implemented** | Stripe checkout, webhooks, portal, admin billing page; env + plan sync required |
| 16 | Activity, notifications & polish | Partial | Comms hub done; activity feed, push, release verification |
| 17 | Open mic & event packs | Not started | `bandie_open_mic_jam_night_spec.md`; add-on entitlements |
| 18 | Mobile app | Not started | Expo scaffold; core member flows |
| 19 | System health & moderation | Not started | Job health, profile moderation, admin alerts |

**Sequencing rationale:** Phase 8 before 9–10 so calendar/gigs use entitlement hooks from day one. Admin foundation (12) follows core product calendar/gigs. Billing (15) after entitlement admin (14) so limits and plans are operable before charging. Full admin pricing console remains post-MVP per entitlements spec §16.2.

## Blockers

None.

---

### Where we are (June 2026)

```text
Bootstrap                 ██████████  monorepo + CI + GitHub + Netlify
Supabase platform         ██████████  bandie registered; migrations applied
Homepage                  ██████████  marketing landing page live
Auth & membership         ██████████  signup, login, bands, invites
Public profile & dir      ██████████  profiles + searchable directory
Player profiles & dir     ██████████  musician profiles + /players directory
Private workspace shell   ██████████  overview, leader, lineup parts, recruitment, invites
Songs & repertoire        ██████████  Phase 6 — dashboard, Dropbox files, templates, soft delete
Setlists                  ██████████  Phase 7 — library, builder, drag reorder, metrics
Entitlements              ██████████  Phase 8 — schema, seeds, service, gate hooks
Calendar & gigs           ██████████  Phases 9–10 — calendar, voting, gigs, setlist link
Booking & admin           ██████████  Phases 11–14 — enquiry inbox, /admin, metrics, enforcement toggle
Billing                   ░░░░░░░░░░  Phase 15 (next)
Mobile app                ░░░░░░░░░░  Phase 18 (deferred)
Release verification      ░░░░░░░░░░  Phase 16 — production smoke + a11y pass
```

`█` complete · `░` not started

---

## Delivery progress

### 0. Project foundations

- [x] 0.1 RSD documentation in repository
- [x] 0.2 Project-specific product documentation
- [x] 0.3 Monorepo folder structure
- [x] 0.4 Root configuration (`.cursorrules`, `README.md`, workspaces)
- [x] 0.5 Shared packages scaffold (`@bandie/ui`, `@bandie/data`, `@bandie/utils`)
- [x] 0.6 Web app scaffold (`@bandie/web`)
- [x] 0.7 Supabase directory structure
- [x] 0.8 Product requirements documents
- [x] 0.9 Delivery task map
- [x] 0.10 CI/CD pipeline (GitHub Actions + Netlify)
- [x] 0.11 Supabase app registration on shared instance
- [x] 0.12 Initial platform schema migrations

### 1. Bandie Homepage

- [x] 1.1 Create homepage route at `/`
- [x] 1.2 Marketing components (nav, hero, feature cards, etc.)
- [x] 1.3 Homepage content configuration
- [x] 1.4 Styling to match mockup
- [x] 1.5 Responsive behaviour
- [x] 1.6 Analytics stub
- [x] 1.7 SEO metadata
- [x] 1.8 Test and polish

### 2. Authentication and band membership

- [x] 2.1 User registration
- [x] 2.2 Login / logout (sign-out routes to homepage)
- [x] 2.3 Password reset
- [x] 2.4 Band creation flow
- [x] 2.5 Band membership and invitations
- [x] 2.6 Band switcher (multi-band users)
- [x] 2.7 Session persistence; marketing nav shows display name when signed in
- [x] 2.8 Pending invite detection and communications acceptance flow (`/app/communications`)

### 2b. Musician / player profile

- [x] 2b.1 Extended `bandie_profiles` (bio, location, genres, instruments, gear, years playing)
- [x] 2b.2 User avatar upload (`bandie-profile-images` bucket)
- [x] 2b.3 Profile editor at `/app/profile` with live preview
- [x] 2b.4 Display name synced to auth metadata; shown ahead of email across the app
- [x] 2b.5 Deputy/member invite preferences and directory visibility toggles

- [x] 2b.6 Player / organiser workspace roles and mode switching (`is_player`, `is_organiser`, workspace mode panel)
- [x] 2b.7 Profile usernames — unique handle, login by email or username, messaging by username
- [x] 2b.8 Leader contact phone on profiles (`contact_phone`); demo seed via migration

### 2d. Organiser venues

- [x] 2d.1 `bandie_organiser_venues` table with RLS
- [x] 2d.2 My venues page at `/app/venues` (organiser workspace mode)
- [x] 2d.3 Venue photo upload; venue picker on booking enquiry form

### 2c. Workspace communications

- [x] 2c.1 Communications page at `/app/communications` (legacy `/app/notifications` redirects)
- [x] 2c.2 Band invitation inbox (accept / decline one or accept all)
- [x] 2c.3 Player outreach inbox (join and audition invites from band leaders)
- [x] 2c.4 Direct messages between users with reply threading (`reply_to_message_id`)
- [x] 2c.5 Unified feed with All / Invites / Messages filters
- [x] 2c.6 Unread badge in workspace nav (`getCommunicationSummary`)
- [x] 2c.7 `/app/invites` redirect and post-auth routing to communications
- [ ] 2c.8 Activity feed and band-scoped threads (deferred)
- [ ] 2c.9 Email / push notifications (deferred)

### 3. Public band profile

- [x] 3.1 Band profile data model and RLS
- [x] 3.2 Public profile page (`/bands/:slug`)
- [x] 3.3 Profile editing (band workspace overview for leaders)
- [x] 3.4 Media and social links
- [x] 3.5 Public availability display
- [x] 3.6 Band name font picker and colour palette theming
- [x] 3.7 Logo and hero image upload
- [x] 3.8 Set length & fee packages (fixed and dynamic session-based offers)
- [x] 3.9 Public band members roster with primary contact badge
- [x] 3.10 Structured booking enquiry form (direct message to primary contact)

### 4. Band directory

- [x] 4.1 Directory data model and search
- [x] 4.2 Directory page (`/bands`)
- [x] 4.3 Filters (genre, location, price, rating, availability)
- [x] 4.4 Sorting and result cards
- [x] 4.5 Empty state handling

### 4b. Player directory

- [x] 4b.1 Public player listing data model and RLS
- [x] 4b.2 Directory page (`/players`) with Any, temporary (deputy), and permanent (member) search modes — **Any** is default
- [x] 4b.3 Mode-specific filters (gig date, budget, travel / experience)
- [x] 4b.4 Player cards and public profile page (`/players/:profileId`)
- [x] 4b.5 Profile editor fields for deputy fee and travel distance

### 5. Private band workspace

- [x] 5.1 Workspace shell and navigation (sidebar, band switcher, protected `/app/*`)
- [x] 5.2 Member-only access enforcement (`ProtectedRoute` + RLS)
- [x] 5.3 Tabbed overview at `/app/:bandId` — **Members** tab (lineup parts, active members, invitations) and **Band details** tab (leaders, public profile editor)
- [x] 5.4 Band leader contact section (all leaders; primary contact badge; leaders edit own contact fields)
- [x] 5.4a Assign primary contact — leaders use **Make primary** on active member card menu (`bandie_set_primary_band_contact`)
- [x] 5.4b Multiple band leaders — add/remove co-leaders; last leader protected; `owner_user_id` is primary public contact
- [x] 5.4c Band leader invariant — every band has an active owner; interim platform admin assigned when leader leaves
- [x] 5.5 Lineup band parts (Vocalist, guitars, bass, drums, custom roles) with auto-calculated band size
- [x] 5.6 Find players flow — part-scoped player directory search and audition/join invites
- [x] 5.6b Active member card actions — hamburger menu (make leader, make primary, assign part, unavailable, remove)
- [x] 5.6c Platform admin mode — toggle on profile; admins manage all bands, edit profiles, recruit players
- [x] 5.7 Songs and setlists navigation — complete (Phases 6–7); calendar and gigs deferred to Phases 9–10

### 6. Songs and repertoire

- [x] 6.1 Songs data model (`bandie_songs`, integration and storage tables)
- [x] 6.2 Songs dashboard (search, filter, metrics)
- [x] 6.3 Song folder / workspace UI
- [x] 6.4 Song part folders — band-level templates (default: Guitar, Bass, Drums, Vocals, Shared); per-song add/remove/toggle required
- [x] 6.5 Readiness tracking (part completeness from current files per spec §6.7)
- [x] 6.6 Dropbox OAuth connect/callback and token storage (`bandie_user_integrations` + secrets table)
- [x] 6.7 Band song-part storage setup (`bandie_band_song_part_storage`, health checks)
- [x] 6.8 Upload song-part files to Dropbox via Bandie; metadata in `bandie_song_part_files`
- [x] 6.9 Preview/download through Bandie-controlled endpoints (members without Dropbox access)
- [x] 6.10 File status, activity log, disconnect/reconnect error states (upload/preview unavailable when storage inactive)
- [x] 6.11 In-app PDF viewer for song-part files (browser-native modal; PDF only in v1)
- [x] 6.12 Song soft delete and restore (`is_deleted`, `deleted_at`; leaders only)
- [x] 6.13 Leader-only part folder management, templates, and file uploads (members view/download)

### 6b. Dropbox song-part storage (detail)

Authoritative spec: `docs/project/bandie_dropbox_song_part_storage_spec.md`

**Principle:** Bandie owns structured data; Dropbox stores song-part file bytes only (tabs, PDFs, charts, lyrics). Leader-owned OAuth per user; one song-parts root per band. Not used for setlists, gigs, rehearsals, calendar, or public media.

**MVP build order (from spec §9):**
1. Foundation — OAuth, token storage, settings UI — **done (29 Jun 2026)**
2. Band folder setup — initialise `/Bandie/bands/{bandSlug}/song-parts/…` — **done (setup endpoint + auto-init after OAuth)**
3. Song part uploads — lazy part folders, upload, metadata, activity — **done (29 Jun 2026)**
4. Preview and download — permission-controlled endpoints — **done (29 Jun 2026)**
5. Readiness integration — part completeness → song readiness metrics — **done (29 Jun 2026)**

### 7. Setlist management

- [x] 7.1 Setlist data model
- [x] 7.2 Setlist library
- [x] 7.3 Setlist builder (drag/reorder)
- [x] 7.4 Setlist metrics and status

### 8. Entitlement framework

Authoritative spec: `docs/project/bandie_entitlements_admin_portal_functional_technical_spec.md` (§8, §9, §21 Phase 1, §24 MVP scope)

**Principle:** Plans, capabilities and limits are data — product code calls `canPerform()`, not hard-coded tier checks. **Subscriptions attach to users (players/organisers); band features resolve from the primary leader’s plan** (§20.1 #7). Enforce server-side in `@bandie/data` and critical DB writes. Ship permissive seed plans first so product work is not blocked; enforce freemium limits in Phase 14.

**Product decisions:** Confirmed 30 June 2026 — spec §20.1–§20.2; player plan update migration `20260630190000`.

- [x] 8.1 Document resolved product decisions (§20) — authoritative in `bandie_entitlements_admin_portal_functional_technical_spec.md` §20.1–§20.2
- [x] 8.2 Schema — `bandie_plans`, `bandie_capabilities`, `bandie_plan_entitlements`, `bandie_subscriptions`, `bandie_usage_meters`, `bandie_entitlement_overrides` (RLS on all); migration `20260630100000`
- [x] 8.3 Seed plans — five-plan catalogue; limits per §20.2; migrations `20260630110000`, `20260630170000`, **`20260630190000`** (Player Free member-first model)
- [x] 8.4 `@bandie/data` entitlement service — `canPerform()`, plan resolution, usage summary, `EntitlementGateError`
- [x] 8.5 Dev-mode permissive defaults — `VITE_BANDIE_ENFORCE_ENTITLEMENTS=false` by default (enforcement in Phase 14)
- [x] 8.6 Gate pattern for new features — `checkBandLeaderCapability()` / `assertCanPerform()` exported for calendar/gigs
- [x] 8.7 Retrofit gate hooks — bands, songs, setlists, folders, uploads, venues, member invites
- [x] 8.8 Upgrade prompts UI — `UpgradePromptModal`, `useUpgradePrompt`, `FeatureGate`
- [x] 8.9 Usage meter maintenance — count helpers, `syncUsageMeter`, `reconcileBandUsageMeters`, `reconcileUserUsageMeters`

### 9. Calendar and availability

Reference: `product-functional-requirements.md` §10; mockup `bandie_calendar_mockup.html`. Capability keys: `calendar.use` (Phase 8).

- [x] 9.1 Calendar data model (`bandie_calendar_events`, `bandie_availability_votes`; RLS)
- [x] 9.2 Rehearsal mode — leader proposes series; internal only
- [x] 9.3 Gig availability mode — leader proposes windows; may publish publicly
- [x] 9.4 Member voting — available / maybe / no / pending; status rules (confirmed / provisional / proposed)
- [x] 9.5 Public calendar publishing — confirmed and provisional on public profile

### 10. Gig management

Reference: `product-functional-requirements.md` §11. Capability keys: `gig.create`, `gigs.active_max_count` (organiser scope, Phase 8).

- [x] 10.1 Gig data model (`bandie_gigs`, `bandie_gig_bands`; RLS)
- [x] 10.2 Organiser gig list and detail — `/app/gigs`, `/app/gigs/:gigId` (create, venue, invite bands, running order)
- [x] 10.3 Band gig invitations — `/app/:bandId/gigs` (view invites; leaders accept/reject)
- [x] 10.4 Band setlist assignment on accepted invites — `/app/:bandId/gigs/:gigId`
- [x] 10.5 Gig status workflow — enquiry through archived
- [x] 10.6 Entitlements moved to organiser plans (`gig.create`, `gigs.active_max_count` per organiser user)
- [x] 10.7 Organiser nav and workspace routing — `/app/gigs` in organiser mode nav; `isPlayerWorkspaceRoute` excludes organiser segments; reserved `:bandId` segments in `bandRoutes.ts`

### 11. Booking enquiries

- [x] 11.1 Enquiry form (public) — structured form on band profile; sends direct message to primary contact
- [x] 11.2 Enquiry management (private workspace) — dedicated booking enquiries inbox in communications
- [x] 11.3 Notifications for new enquiries — communications summary badges and unread counts
- [x] 11.4 Enquiry rate limits via entitlement service (`booking_enquiry.send`, `booking_enquiries.monthly_max_count`) when enforcing

### 12. Admin portal foundation

Authoritative spec: entitlements spec §35 Phase A, §38 MVP admin scope (foundation items).

Builds on existing `is_app_admin` / `bandie_current_user_is_app_admin()` — extend into dedicated admin surface, not a separate ad-hoc skeleton.

- [x] 12.1 Protected `/admin` route group and admin API middleware
- [x] 12.2 Admin permission model — roles beyond binary app admin where needed
- [x] 12.3 Audit log for admin actions (`bandie_audit_events`)
- [x] 12.4 User, band and organiser search
- [x] 12.5 Overview dashboard shell (read-only)

### 13. Platform metrics

Authoritative spec: entitlements spec §35 Phase B.

- [x] 13.1 `bandie_metric_events` and client/server tracking helpers
- [x] 13.2 Daily aggregation job and `bandie_daily_metric_snapshots`
- [x] 13.3 Overview dashboards — DAU, WAU, MAU, users by type, tier distribution, content usage (songs, setlists, venues, gigs)
- [x] 13.4 CSV export for permitted admins; last-updated timestamps on metrics

### 14. Entitlement admin and enforcement

Authoritative spec: entitlements spec §35 Phase C, §7.6–7.8 (overrides, trials, grandfathering).

Turn on freemium limits for features built in Phases 6–11. Avoid full pricing console until tiers stabilise (spec §16.2).

- [x] 14.1 Plan catalogue and entitlement matrix views — **editable** plan metadata and entitlement values in `/admin/entitlements` (audit logged)
- [x] 14.2 Draft/publish workflow for entitlement and limit changes
- [x] 14.3 Usage limit editor with impact preview
- [x] 14.4 Entitlement inspector and gate decision logs
- [x] 14.5 Manual overrides and trial management (platform admins)
- [x] 14.6 Enforce limits on songs, setlists, folders, storage, venues, members, gigs, calendar tiers

### 15. Billing integration

Authoritative spec: entitlements spec §15, §21 Phase 2, §35 Phase D (support/billing admin).

- [x] 15.1 Stripe products and prices mapped to `bandie_plans` — auto-sync via `/admin/billing` (`ensureStripePlanCatalogue`; £4 / £10 / £15 GBP monthly)
- [x] 15.2 Checkout session creation and workspace billing settings page — `/app/profile` Billing & plans panel; Stripe Customer Portal
- [x] 15.3 Webhook handlers — idempotent subscription state sync (`bandie_stripe_webhook_events`)
- [x] 15.4 Grace period, downgrade and over-limit behaviour — `past_due` + 7-day grace; cancel reverts to free plan; content preserved (entitlements spec §20.1 #9)
- [x] 15.5 Admin subscription dashboard — `/admin/billing` webhook log, plan sync, Stripe dashboard links
- [x] 15.6 Launch promo — 30-day Player Pro / Organiser Plus trials (`launch_promo_ends_at`, backfill, expiry RPC, billing banner)

### 16. Activity, notifications and platform polish

Consolidates deferred communications, activity feed, and release verification. Profile images and Dropbox song-part storage are **complete** (Phases 2b and 6).

- [x] 16.1 Profile image storage (`bandie-profile-images` bucket with RLS)
- [x] 16.2 Song-part file storage — Dropbox per `bandie_dropbox_song_part_storage_spec.md` (Phase 6)
- [x] 16.3 Song-part file activity log (`bandie_song_part_file_activity`)
- [ ] 16.4 Workspace activity feed and band-scoped threads (deferred from 2c.8)
- [ ] 16.5 Email and push notifications (deferred from 2c.9)
- [ ] 16.6 Production smoke tests and accessibility pass

### 17. Open mic and event packs

Authoritative spec: `bandie_open_mic_jam_night_spec.md`; monetisation via entitlements spec §6.4, §21 Phase 4 (add-on tables, not a separate billing path).

- [ ] 17.1 Add-on schema — `bandie_addons`, `bandie_addon_entitlements`, `bandie_subject_addons`
- [ ] 17.2 Open mic / jam night product flows per open mic spec
- [ ] 17.3 One-off and pack entitlements (`open_mic.create`, `open_mic.monthly_max_count`)
- [ ] 17.4 Admin visibility for open mic events in metrics

### 18. Mobile app

- [ ] 18.1 Expo / React Native scaffold
- [ ] 18.2 Core member flows (availability, setlists, songs) — reuse `@bandie/data` including entitlements
- [ ] 18.3 Performance mode (deferred post-MVP; tier-gated per entitlements spec §6.2)

### 19. System health and moderation

Authoritative spec: entitlements spec §35 Phase E. Deferred until admin portal mature.

- [ ] 19.1 System jobs and background task health page
- [ ] 19.2 Storage and integration health summaries
- [ ] 19.3 Public profile moderation and reported-content queue
- [ ] 19.4 Admin alerts for failed jobs and webhooks

---

## Session notes

**30 June 2026 — Organiser-owned gigs and `/app/gigs` routing**
- Migration `20260630220000_bandie_organiser_gigs.sql` applied to remote — `bandie_gig_bands` invites, organiser-owned `bandie_gigs`, band-leader RPCs (`bandie_respond_gig_invite`, `bandie_assign_gig_setlist`)
- Organiser UI: `/app/gigs`, `/app/gigs/:gigId` (My gigs nav); band UI: `/app/:bandId/gigs` (invites + setlist assignment only)
- `gig.create` and `gigs.active_max_count` on organiser plans (removed from player plans)
- **Routing fix:** `isPlayerWorkspaceRoute` excludes `/app/gigs` so organiser mode no longer redirects to `/app/bands`; `bandRoutes.ts` reserves `gigs` (and other top-level segments) from `:bandId` matching
- Docs: product functional/technical requirements, product requirements, build elements, delivery map, tracker §10

**30 June 2026 — Documentation alignment (full sweep)**
- Entitlements spec §§5–7, 10, 13, 19, 22, 25, 31, 33–35, 37: examples, matrices, API samples, and acceptance criteria aligned to §20.2 / `20260630190000`
- Product functional/technical requirements, delivery map, UX framework, README, `.env.example` synced (player plans, test-data toggles, billing UX, plan catalogue UI)
- Seed migration `20260630110000` annotated — live limits authoritative in `20260630190000`

**30 June 2026 — Player plan entitlements (product update)**
- Migration `20260630190000_bandie_player_plan_entitlements.sql` applied to remote
- **Player Free:** profile + join bands by invite; view-only on band repertoire — no `band.create`, songs, setlists, uploads, or gig creates
- **Player Plus:** 1 band, 20 songs, 3 setlists; full song folders and calendar (`calendar.use = full`)
- **Player Pro:** unlimited bands; 999 songs and 999 setlists per band
- Docs: entitlements spec §20.1–§20.2, product functional/technical requirements, tracker

**30 June 2026 — UX and test-data polish**
- **Billing & plans** (`/app/profile`): light-surface card, readable current-plan row, high-contrast buttons (`entitlements.css`, `RSD_UX_DESIGN_FRAMEWORK.md` §6.5)
- **Admin plan catalogue** (`/admin/entitlements`): select-one plan picker (Player / Organiser groups) + single edit panel — no accordion per plan
- **Player directory:** default search mode **Any role** (was temporary / permanent on workspace)
- **Hide test data:** toggle on My Bands (`/app`), band directory, and player directory; shared session preference; toggles hidden when `VITE_BANDIE_DATA_MODE=live`
- **Test data badges:** `TestDataBadge` on directory cards and workspace band cards when `test_user = true`

**30 June 2026 — Phase 15 Stripe billing**
- Implemented checkout, Customer Portal, webhooks, `/app/profile` billing panel, `/admin/billing`
- GBP pricing: Player Plus £4/mo, Player Pro £10/mo, Organiser Plus £15/mo
- Migration `20260630180000` applied to remote

**30 June 2026 — Plan code alignment with display names**
- Renamed plan codes to match `bandie_plans.name` (snake_case): `band_standard` → `player_plus`, `band_pro` → `player_pro`; migration `20260630170000`
- Updated `@bandie/data` `PLAN_CODES` (`PLAYER_PLUS`, `PLAYER_PRO`), seed migration, and docs

**30 June 2026 — Plan catalogue names and admin editing**
- Renamed paid band-leader plan display names to **Player Plus** / **Player Pro**; migration `20260630160000` (display names; superseded by code alignment above)
- `/admin/entitlements`: inline edit plan metadata and entitlement values; draft/publish and overrides retained
- Commits: `47199a7` (admin typography), `9ebcd17` (admin routing), `d3159a6` (editable catalogue + plan names)
- Docs synced to §20.2 naming across entitlements spec, tracker, delivery map, migrations README, product docs (`PRODUCT_REQUIREMENTS`, `product-functional-requirements`, `product-technical-requirements`, `bandie_build_elements`); legacy `band_free` code references corrected to `player_free`

**30 June 2026 — Docs sync after Phases 8–14 commit**
- Committed and pushed `ec8b41c` to `main` — entitlements, calendar/gigs, booking inbox, admin portal
- Migrations `20260630100000`–`20260630150000` applied to remote Supabase
- Tracker, delivery map, and product docs aligned to unified phase roadmap

**29 June 2026 — Phases 9–14 (calendar, gigs, booking, admin, enforcement)**
- Migrations `20260630120000`–`20260630150000`: calendar, gigs, booking enquiries, audit, metrics, entitlement drafts, platform settings
- `@bandie/data`: `calendar`, `gigs`, `bookingEnquiries`, `metrics`, `adminPortal`, `entitlementAdmin`, `platformSettings`, `gateLogs`
- Web: Calendar and Gigs pages; booking enquiry inbox; `/admin` portal; platform enforcement toggle (env `VITE_BANDIE_ENFORCE_ENTITLEMENTS` OR `bandie_platform_settings.entitlements_enforced`)

**29 June 2026 — Phase 8 entitlement framework (8.3–8.9)**
- Seed migration `20260630110000`: plans, capabilities, entitlements, `plan_scope` on subscriptions, default user subscriptions + profile trigger
- `@bandie/data`: `entitlements.ts`, `usageMeters.ts`, enforcement toggle, gate hooks on create flows
- Web: `UpgradePromptModal`, `FeatureGate`, `useUpgradePrompt`; `VITE_BANDIE_ENFORCE_ENTITLEMENTS` (default false)

**29 June 2026 — Phase 8.2 entitlement schema**
- Migration `20260630100000_bandie_entitlements_foundation.sql`: plans, capabilities, plan_entitlements, subscriptions, usage_meters, entitlement_overrides
- Helpers: `bandie_get_band_primary_leader_user_id`, `bandie_user_can_view/manage_entitlement_subject`, `bandie_set_usage_meter` RPC
- RLS: catalogue read for Bandie users; writes admin-only; subscriptions/overrides readable by subject; usage meter writes via RPC only

**29 June 2026 — Phase 8.1 product decisions (confirmed)**
- Stakeholder review locked §20.1–§20.2 in entitlements spec
- **Player-centric billing:** leader’s subscription unlocks band features; not per-band workspace plans
- **Player Free (updated):** profile + join bands by invite; view songs/setlists only — no band/song/setlist/upload creates
- **Player Plus:** 1 band, 20 songs, 3 setlists; full song folders and calendar
- **Player Pro:** unlimited bands; 999 songs and 999 setlists per band
- **Organiser Free:** 1 venue, 20 enquiries/month; open mic trial + event packs
- **Downgrade:** keep content, block new over-limit creates; admin overrides platform admins only
- Migration: `20260630190000_bandie_player_plan_entitlements.sql`

**29 June 2026 — Unified phase roadmap (entitlements + admin + billing)**
- Renumbered post–Phase 7 work: **8** entitlement framework, **9** calendar, **10** gigs, **11** booking, **12–14** admin portal and entitlement admin, **15** billing, **16** activity/polish, **17** open mic packs, **18** mobile, **19** system health
- Rationale: Phase 8 thin entitlement layer before calendar/gigs to avoid retrofit; billing after entitlement admin; consolidates former Phase 11 platform foundations into Phases 12–16
- Authoritative spec: `docs/project/bandie_entitlements_admin_portal_functional_technical_spec.md`

**29 June 2026 — Setlist management (Phase 7)**
- Migration `20260629160000_bandie_setlists.sql`: `bandie_setlists`, `bandie_setlist_items`, member read / leader write RLS
- `@bandie/data` `setlists.ts`: CRUD, duplicate, archive, reorder, computed metrics and status helpers
- Web routes `/app/:bandId/setlists` (library) and `/app/:bandId/setlists/:setlistId` (builder with drag reorder)
- Setlists nav item in band workspace; leader-only create/edit aligned with functional requirements §9

**29 June 2026 — Song soft delete**
- `bandie_songs.is_deleted` + `deleted_at`; partial unique slug for active songs only
- Leaders delete from edit modal; deleted songs hidden from list; checkbox to show and restore
- Trigger enforces leader-only delete/restore

**29 June 2026 — Song parts leader-only**
- Reverted member template seeding RPC; part folder create/update/delete restricted to band leaders (RLS)
- Upload endpoint and UI: leaders only; members see leader guidance message
- Shared `SONG_PARTS_LEADER_ONLY_MESSAGE` in `@bandie/data`

**29 June 2026 — In-app PDF viewer for song parts**
- PDF **View** opens `SongPartFileViewerModal` with browser-native iframe renderer (Dropbox temp URL); no new npm deps
- View shown only for PDFs (`canPreviewSongPartFile`); other types remain download-only
- Escape to close, focus trap, **Open in new tab** fallback; activity log unchanged via preview API
- If iframe still forces download on Safari/iOS, next step is blob stream for files under ~5 MB (not proxied 25 MB files)

**29 June 2026 — Configurable song part folders**
- Migration `20260629120000_bandie_band_song_part_templates.sql`: `bandie_band_song_part_templates`; band leaders manage default folders for new songs
- Default template uses single **Guitar** folder (not lead/rhythm split); Bass, Drums, Vocals, Shared
- `@bandie/data` `songPartTemplates` module; folder CRUD on `songs` (`createSongPartFolder`, `updateSongPartFolder`, `deleteSongPartFolder`, `recalculateSongReadiness`)
- UI: `BandSongPartTemplatesPanel` on songs dashboard; `SongPartFoldersEditor` on song folder page (add/remove parts, toggle required for readiness)

**29 June 2026 — Phase 6.2+ songs dashboard, song folder, uploads**
- Migration `20260629110000_bandie_song_part_folders_files.sql`: `bandie_song_part_folders`, `bandie_song_part_files`, `bandie_song_part_file_activity` (RLS applied to remote)
- `@bandie/data` `songs` + `songParts` modules: CRUD, filters, metrics, readiness, upload/preview/download clients
- Netlify Functions: `song-part-file-upload`, `song-part-file-preview`, `song-part-file-download`
- UI: `/app/:bandId/songs` dashboard (search, filter, metrics, activity); `/app/:bandId/songs/:songId` song folder (part folders, upload, file list)
- Default part folders created on song add; readiness recalculated server-side after upload
- Web upload limit 4 MB (Netlify request body); spec 25 MB deferred to chunked upload

**29 June 2026 — Phase 6.1 foundation (songs + Dropbox)**
- Migration `20260629100000_bandie_songs_dropbox_foundation.sql`: `bandie_songs`, `bandie_user_integrations`, `bandie_user_integration_secrets`, `bandie_integration_oauth_states`, `bandie_band_song_part_storage`
- Netlify Functions: Dropbox OAuth connect/callback/disconnect; band song-part storage setup and health
- `@bandie/data` `songPartStorage` module; `BandSongPartStoragePanel` on band workspace → Band details tab
- Tokens encrypted server-side (`BANDIE_INTEGRATION_TOKEN_KEY`); never exposed to client
- Local dev: run `npm run dev:api` (Netlify dev) alongside `npm run dev` for `/api` routes

**29 June 2026 — Dropbox song-part storage (Phase 6 decision)**
- Adopted `docs/project/bandie_dropbox_song_part_storage_spec.md` as authoritative for song-part files
- **Decision:** Dropbox (leader-owned OAuth) stores file bytes; Bandie Postgres stores metadata, permissions, status, readiness, activity
- **Not in Dropbox:** setlists, gigs, rehearsals, calendar, booking, public profile media
- **MVP file types:** PDF, JPEG/PNG/WebP, plain text/markdown, ChordPro, Guitar Pro; max 25 MB; no video
- **Readiness:** required part has ≥1 current, available file → contributes to song completeness (spec §6.7)
- Updated functional requirements, technical requirements, delivery map, product requirements, and build elements

**28 June 2026 — Directory area filters**
- Reference tables `bandie_countries` and `bandie_regions` with UK regions (South West through Northumberland)
- `country_id` / `region_id` on bands and profiles; directory filters match FK or location keywords
- Browser locale/timezone detection sets default country (`apps/web/src/lib/directoryAreaDefaults.ts`)
- Shared filter UI on public and workspace band/player directories

**28 June 2026 — Brand identity & UI polish**
- Shared Bandie logo mark: lowercase white **b** in gradient tile (`apps/web/src/lib/brand.ts`, `apps/web/src/styles/brand.css`); used on homepage, auth, app header, directories, and public profiles
- Public profile **Band members** grid: fixed card overlap (removed `min-height: 100%` on grid cards; documented in `RSD_UX_DESIGN_FRAMEWORK.md` §7.2.1)
- Organiser venue photos: `image_url` column + storage at `venues/{venue_id}/photo.{ext}` (`20260628300000_bandie_organiser_venue_images.sql`)
- Active member cards: compact actions, hamburger menu, View profile for all members, primary contact badge

**28 June 2026 — Documentation sync (post–last commit review)**
- Aligned tracker, product requirements, delivery map, build elements, technical requirements, and migrations README with current codebase
- Documented: band overview tabs, member hamburger actions (including **Make primary**), set/dynamic fee offers, public members roster, booking enquiry via messaging, usernames, admin mode, organiser venues, directory card layout

**28 June 2026 — Band overview UX**
- **Members** / **Band details** tabs on `/app/:bandId` (lineup, members, invites vs leaders + profile editor)
- Active member cards: hamburger menu with Make leader, Make primary, assign part, unavailable, remove
- Shared responsive card grid for lineup parts and active members (consistent section width; no overlap)
- Band directory: compact availability pills on listing cards

**28 June 2026 — Primary contact assignment**
- RPC `bandie_set_primary_band_contact` updates `bandie_bands.owner_user_id` among active leaders
- UI: **Make primary** in active member card menu (not on band leaders list)

**28 June 2026 — Set fees and public profile**
- Fixed set offers (`bandie_band_set_offers`) and dynamic session-based offers (`bandie_band_dynamic_fee_offers`)
- Public profile shows members roster and primary contact; booking form references primary contact

**28 June 2026 — Band overview: leader contact, lineup parts, player recruitment**
- **Band leader section** on `/app/:bandId`: shows leader name, email and phone for communication between bands, players and organisers
- Leaders edit `contact_email` and `contact_phone` on their profile from the overview; email falls back to auth email via `bandie_get_band_leader_contact` RPC
- **Lineup & band parts** (`bandie_band_parts`): leaders add roles (templates: Vocalist, Lead Guitar, Rhythm Guitar, Bass, Drums, or custom)
- **Band size** auto-synced from part count (`bandie_sync_band_size_from_parts`); public profile shows calculated size (no manual override)
- **Find players** per part routes to `/app/players?forBand=…&part=…&instrument=…` with directory pre-filtered (permanent mode, primary instrument)
- **Player invites** from player profile when recruiting: **Join the band** (creates membership invitation) or **Audition** (records outreach with optional message) via `bandie_create_player_outreach` RPC
- Migration: `20260628150000_bandie_band_parts_leader_contact.sql` — `contact_email`/`contact_phone` on profiles, `bandie_band_parts`, `bandie_player_outreach`, RLS
- Data layer: `@bandie/data` modules `bandParts`, `bandLeader`, `playerOutreach`

**28 June 2026 — Organiser venues (My venues)**
- `/app/venues` in organiser workspace mode — list and manage venues the organiser is associated with
- Fields: name, type, address, city, postcode, contact name/email/phone, capacity, notes
- Migration `20260628290000_bandie_organiser_venues.sql`; data access via `@bandie/data` (`organiserVenues`)
- Nav: Find bands, My gigs, My venues, My profile

**28 June 2026 — Player / organiser workspace roles**
- Users declare player, organiser, or both on profile (`is_player`, `is_organiser`)
- Workspace mode switcher filters nav and routes (organiser mode → band directory focus)

**28 June 2026 — Multiple band leaders**
- Bands can assign more than one leader (`owner` membership role); `bandie_bands.owner_user_id` remains the primary public contact
- Migration `20260628230000_bandie_multiple_band_leaders.sql` — `bandie_add_band_leader`, `bandie_remove_band_leader`, `bandie_list_band_leaders`; RLS treats any active owner as a band leader
- Band overview: leader section lists all leaders; members tab supports Make leader / Remove leader (last leader protected)
- `@bandie/data`: `listBandLeaders`, `addBandLeader`, `removeBandLeader`

**28 June 2026 — Band leader invariant**
- Every band must have at least one active leader (`owner` role on membership)
- Migration `20260628183000_bandie_band_leader_invariant.sql` repairs existing bands and adds trigger on membership changes
- When all leaders leave, a Bandie platform admin is assigned as interim leader until a new leader is added

**28 June 2026 — Workspace communications page**
- Extended notifications into a full **Communications** hub at `/app/communications`
- **All / Invites / Messages** filter tabs with chronological unified feed
- Band invitations: accept or decline; player outreach inbox (join/audition from directory)
- Direct messages: reply threading via `reply_to_message_id`
- Migration `20260628182000_bandie_communications.sql` — decline invitation RPC, player outreach inbox/respond RPCs, message replies
- Nav label **Communications**; `/app/notifications` redirects for backwards compatibility

**28 June 2026 — Workspace notifications page**
- Added `/app/notifications` for band invitations and direct messages (superseded by communications hub above)
- `bandie_user_messages` table with RLS; inbox/send via `@bandie/data`
- Nav badge for unread count; `/app/invites` redirects to notifications
- Post-auth and app entry redirect pending invites to notifications

**28 June 2026 — Player directory gender filter**
- Added optional `gender` on player profiles (female, male, non-binary, prefer not to say)
- Gender filter in player directory; profile editor field at `/app/profile`
- Test seed players assigned gender values for demo filtering

**28 June 2026 — Test seed London locations**
- Relocated all 10 test bands and 50 test players to London and surrounding area (within ~25 miles)
- Updated seed migration and added patch migration for existing databases

**28 June 2026 — Homepage three-modes redesign**
- Rebuilt marketing homepage from `bandie_homepage_three_modes_v3.html`
- Hero with three audience CTAs, mode summary cards, per-audience how-it-works sections, platform strip and capabilities grid
- Updated homepage content config, marketing components, styles and product docs

**27 June 2026 — Admin player profile editing**
- Shared `UserProfileEditor` for self-service and admin edit flows
- Admins edit any player profile at `/app/profiles/:profileId/edit` (same fields as `/app/profile`)
- Edit links on band member cards and workspace player profile views for admins
- Admin avatar upload uses existing storage helpers and RLS

**27 June 2026 — Platform app admin**
- Added `is_app_admin` generated column on `platform_user_app_memberships` (`role` in `admin`, `owner`)
- Bandie admin RLS: full read/update on profiles, bands, members, media, invitations, and profile image storage
- `@bandie/data`: `isCurrentUserAppAdmin()`, admin profile/image helpers; admins see all bands in workspace
- `AuthContext` exposes `isAppAdmin` for UI gating
- Promote via SQL: `update platform_user_app_memberships set role = 'admin' where user_id = … and app_code = 'bandie'`

**27 June 2026 — Test data mode**
- Added `test_user` on `bandie_bands` and `bandie_profiles`
- `VITE_BANDIE_DATA_MODE`: `live` hides test rows from API queries; `test` shows all directory data including seeds
- **Hide test data** toggle (test mode only): `/app` My Bands, `/bands`, `/players`, `/app/bands`, `/app/players` — session preference `bandie:directory:hide-test-data`
- Seeded 10 fictitious bands and 50 test players for development/demo (London area, within ~25 miles)

**27 June 2026 — Player directory “Any role” search mode**
- Added third search mode that lists all published players regardless of invite preference
- Any mode exposes both deputy and permanent filter groups; recommended sort boosts dual availability

**27 June 2026 — Player directory dual availability**
- Directory result cards show all invite preferences when a player is open to deputy gigs and permanent membership
- Profile editor and filter copy clarify that both invitation types can be selected independently

**27 June 2026 — Player directory in workspace**
- Authenticated player directory at `/app/players` with sidebar nav and band-leader entry points
- Defaults to **Any role** search mode (shared `PlayerDirectoryView` for public and workspace); band recruitment links still pre-set **Permanent member** + instrument
- “Find players” on My bands hub and band overview (leaders)

**27 June 2026 — Homepage “For players” section**
- Added third audience panel on homepage for musicians promoting themselves (deputy gigs or permanent membership)
- Nav anchor `#players`, CTA routes to `/signup?intent=player-profile` then `/app/profile`
- Updated homepage spec, mockup and product functional requirements

**27 June 2026 — Documentation sync**
- Aligned project docs with implemented routes, data layer, and migration history
- Phase 5 (workspace shell) marked complete; Phase 6 (songs) is next focus

**27 June 2026 — Sign-out routing**
- `logout()` navigates to `/` before clearing session so users land on homepage, not `/login`
- `BrowserRouter` moved to `main.tsx` so `AuthContext` can use `useNavigate`

**27 June 2026 — Display name ahead of email**
- `resolveDisplayName()` prefers profile name, then auth metadata, then email local-part
- `formatUserWithEmail()` renders **Name · email** when both are known
- Pending invitations list shows invitee display name before email via `bandie_list_band_invitations_for_owner` RPC
- Profile editor shows display name field before read-only email

**28 June 2026 — Booking venue picker**
- Booking form loads organiser venues from profile and offers a venue dropdown when any exist
- Selecting a venue auto-fills the field and includes full venue details in the sent enquiry message

**28 June 2026 — Band profile layout refresh**
- Profile opens with band name (configured font), hero with logo top-left and availability pill top-right
- Tagline, bio, and location/travel shown under hero; fees as flat cards without fixed/dynamic labels or calculations
- Smaller video cards on public profile and workspace overview

**28 June 2026 — Structured booking enquiry form**
- Book card uses date, time, set duration (from band fee options), venue, budget, and notes fields
- Sender name, Bandie username, email, phone, and location auto-populated from signed-in profile

**28 June 2026 — Public profile card grid layout**
- Fixed overlapping band member and fee cards by switching compact grids from flex-grow to CSS Grid auto-fill
- Added §7.2.1 Compact card grids to `RSD_UX_DESIGN_FRAMEWORK.md` to prevent flex-shrink overlap regressions

**28 June 2026 — Public band profile members & booking contact**
- Public profiles show active band members (avatar, role, instrument, lineup part, primary contact badge)
- Set length & fee cards use compact single-row layout on public profiles when space allows
- Book section references the band primary contact and sends booking enquiries via in-app messaging
- Migration adds `bandie_list_public_band_members` and `bandie_get_public_band_primary_contact` RPCs

**27 June 2026 — Player directory**
- Public player directory at `/players` with temporary (deputy) and permanent (member) search modes
- Temporary filters: instrument, genre, location, gig date, budget, travel distance
- Permanent filters: instrument, genre, location, minimum years playing
- Migration adds deputy fee/travel fields and public RLS for published player profiles
- Player profile editor updated with directory visibility and deputy gig preferences

**27 June 2026 — Player invitation preferences**
- Added `open_to_deputy_invites` and `open_to_member_invites` on `bandie_profiles`
- Player profile editor at `/app/profile` includes opt-in checkboxes for deputy and permanent member invites
- `@bandie/data` exposes `formatPlayerInvitePreferences()` for player directory filters

**27 June 2026 — Temporary email verification bypass**
- Disabled Supabase `auth.email.enable_confirmations` on remote project (config push)
- Signup signs users in immediately via `signUpAndSignInWithEmail`; no confirmation email sent
- Added password confirmation and show/hide toggle on signup, login, and reset password flows
- Re-enable email verification when Resend SMTP rate limits are resolved

**26 June 2026 — Split profile location fields**
- Overview separates tagline, location (home city + travel distance), and genres into distinct editable rows
- Added `travel_distance_miles` on bands; public profile shows location and genres separately

**26 June 2026 — Edgy colour palettes**
- Added Punk Riot, Anarcho Black, Acid Clash, and Garage Grit palettes for punk and garage bands

**26 June 2026 — Band colour palettes**
- Eight curated palettes (Bandie Gold, Stage Red, Midnight Blue, etc.) stored on `bandie_bands.color_palette`
- Shared palette tokens in `@bandie/data` for public profiles and future poster templates
- Palette picker on create band and band workspace overview; live preview on public profile

**26 June 2026 — Public-style band workspace overview**
- Overview mirrors public profile layout: hero, logo, band name in profile font
- Inline Edit buttons per section; font picker only when editing band name
- Members and invitations remain below the profile preview

**26 June 2026 — Unified band workspace overview**
- Combined Overview, Public profile, and Members into single `/app/:bandId` page
- Leader can edit public profile inline; members see read-only summary
- Band member cards with player profile details; invitations section for leaders
- Legacy `/profile` and `/members` routes redirect to overview

**26 June 2026 — Player profile gear section**
- Added `gear_items` and `gear_notes` on `bandie_profiles`
- Gear section on `/app/profile` with gear list and setup notes

**26 June 2026 — Musician / player profile**
- Extended `bandie_profiles` with bio, location, genres, instruments, years playing, visibility flag
- User avatar upload to `bandie-profile-images` at `users/{user_id}/avatar.{ext}` with storage RLS
- `@bandie/data` user profile APIs; display name synced to auth metadata and used in app shell
- Profile editor at `/app/profile` with photo upload, musician fields, and live preview

**26 June 2026 — Sign-up invite acceptance**
- Added `bandie_list_my_pending_invitations()` RPC for invitees to see open invites by email
- Sign-up and login route to `/app/communications` when pending invitations or player outreach exist
- Pending invites page supports accept one or accept all, then continues to My bands

**26 June 2026 — My bands hub**
- Post-login landing at `/app` shows directory-style cards for each band membership
- Shared `BandCard` component used by directory and workspace views
- Removed auto-redirect to single band or create-band flow; users always pick from My bands

**26 June 2026 — Public profile layout & name font**
- Redesigned public profile hero: logo at top (no card), band name below with selectable font
- Added `name_font` column on `bandie_bands` with curated Google Font options
- Profile editor includes band name font picker in Visuals section

**26 June 2026 — Band directory (Phase 4)**
- Added `@bandie/data` directory listing, client-side filter/sort helpers
- Built `/bands` directory page with filters, sort, result cards, and empty states
- Rating filter deferred until reviews data exists; sort by recommended uses availability + profile completeness

**26 June 2026 — Public band profile (Phase 3)**
- Extended `bandie_bands` with profile, booking, and availability fields
- Added media, social link, and public date tables with RLS
- Public profile page at `/bands/:slug` and workspace editor at `/app/:bandId`
- Build, lint, and migration verified

**26 June 2026 — Authentication & band membership (Phase 2)**
- Added `@bandie/data` auth, membership, bands, and invitations modules
- Applied `20260626200000_bandie_invitations.sql` migration (invites table, RLS, accept RPC)
- Auth pages: signup, login, forgot/reset password; protected `/app/*` workspace shell
- Band creation, member invitations, accept-invite flow, and multi-band switcher
- Build, lint, and Supabase connectivity verified

**26 June 2026 — Phase 0 foundations**
- Added GitHub Actions CI (lint + build)
- Applied platform core + Bandie bootstrap migrations to `proff-rsd-mt-1`
- Registered `bandie` in `platform_apps`
- Added `npm run verify:supabase` connectivity check

**26 June 2026 — Homepage (Phase 1)**
- Implemented marketing homepage at `/` matching mockup and spec
- Marketing nav links to live `/bands` and `/login` routes
- Added `netlify.toml` and SPA redirects for client routing
- Build and lint verified

**26 June 2026 — Bootstrap**
- Created monorepo structure per `RSD_PROJECT_BOOTSTRAP.md`
- Documented architectural decisions: Vite + React, shared Supabase with `bandie_` prefix
- Next step: implement homepage per functional/technical spec
