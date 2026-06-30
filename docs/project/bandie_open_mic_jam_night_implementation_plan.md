# Bandie Open Mic / Jam Night — Implementation Plan

**Product:** Bandie  
**Source spec:** [`bandie_open_mic_jam_night_spec.md`](./bandie_open_mic_jam_night_spec.md)  
**Document type:** Implementation task plan (progress tracking)  
**Status:** Not started — product decisions locked 30 June 2026  
**Created:** 30 June 2026  
**Intended audience:** Engineering, Cursor implementation workflow  

---

## How to use this document

- Check boxes as work completes: `- [ ]` → `- [x]`
- When phases land, update `docs/PROJECT_STATUS_TRACKER.md` (Phase 17) and `product-functional-requirements.md` / `product-technical-requirements.md`
- Follow `.cursorrules` reading order and RLS checklist (`.cursor/rules/supabase-rls.mdc`) for all schema work
- All Supabase access must go through `@bandie/data`; UI must not call Supabase directly
- Manual QA default: **Netlify production deploy from `main`**, not local Vite alone (API routes require Netlify)

---

## 1. Executive summary

Implement **Open Mic / Jam Night** as an organiser-facing product area: create events, build song lists with instrument slots, let players sign up (open, moderated, invite-only, or organiser-assigned), and run the evening from a **live control room** with running order, progress states, and readiness tracking.

Delivery follows the spec’s four MVP releases (§17), plus entitlement/add-on integration (entitlements spec §20.1 #6) and post-MVP backlog.

**Primary success test (spec §20):** A pub open mic host can run a busy evening from a tablet without falling back to a clipboard.

---

## 2. Locked product decisions (spec §19)

**Confirmed 30 June 2026** — do not implement contrary assumptions.

| # | Topic | **Decision** |
|---|---|---|
| 1–2 | Monetisation | **Organiser Plus required**; gate on **create**; Organiser Free cannot create open mic events |
| 3 | Guest sign-up | Name + email **or** phone (organiser chooses); **Bandie members flagged** when logged in |
| 4 | Guest verification | **No** magic-link verification in MVP |
| 5 | Player song suggestions | **Yes** — propose songs for organiser approval |
| 6 | Public directory | **No** — slug URL + QR only |
| 7 | Song list on public page | **Organiser toggle** |
| 8 | File visibility | **Bandie members only** when organiser enables; **never** for non-members/guests |
| 9 | Contact privacy | Email/phone **organiser only**; **names visible to all** on event |
| 10 | Venue | **Optional** saved venue FK or ad hoc |
| 11 | Roles | **Full spec roles** — `bandie_organiser_members` (Owner, Admin, Host, House Band) |
| 12 | House band | **Flag on players** — pre-assign, hide slots from public sign-up |
| 13–14 | URLs | **Globally unique slug**; public path **`/events/:slug`** |
| 15 | Files | **Dropbox** via band-leader integration; link band song parts |
| 16 | Export | **PDF running order in MVP** |
| 17 | Recurrence | **Duplicate only** |
| 18 | Add-ons | **Release 1** — addon schema with first migration wave |

**Entitlements migration required:** Change `organiser_free` `open_mic.create` from trial `1` to **deny** when Phase 17 ships (see spec §19 entitlements note).

---

## 3. Existing codebase alignment

Reuse these patterns — do not reinvent:

| Area | Reference |
|---|---|
| Organiser workspace | `workspaceMode.ts`, organiser routes in `App.tsx`, `/app/gigs`, `/app/venues` |
| Organiser gigs | `packages/data/src/gigs.ts`, `OrganiserGigsDashboardPage`, `OrganiserGigDetailPage` |
| Venues | `packages/data/src/organiserVenues.ts`, `MyVenuesPage`, `bandie_organiser_venues` |
| Entitlements | `open_mic.create` already seeded (`20260630110000`); `assertCanPerform()` in `@bandie/data` |
| Setlist / running order | `packages/data/src/setlists.ts` — drag reorder patterns in `SetlistBuilderPage` |
| Song parts / templates | `bandie_band_song_part_templates`, part folder concepts (Release 4 linking) |
| Band songs / Dropbox | `packages/data/src/songs.ts`, Dropbox spec — link, do not duplicate bytes in MVP file attach |
| Public pages | `PublicBandProfilePage`, slug patterns, marketing CSS |
| Calendar recurrence | `calendarRecurrence.ts` — **defer** full recurrence; **duplicate event** for MVP |
| Realtime | Supabase Realtime channels (new for open mic live room) |
| Analytics | `apps/web/src/lib/analytics.ts`, `trackEvent()` |
| RLS helpers | `bandie_current_user_is_band_member`, platform app access checks |

**Net-new surface:**

- 7+ core tables (§10.1, adapted — see Phase 1 schema)
- `packages/data/src/openMicEvents.ts` (or split modules: events, songs, slots, signups, live)
- Organiser routes: `/app/open-mic`, `/app/open-mic/:eventId`, `/app/open-mic/:eventId/live`
- Public route: **`/events/:slug`** (globally unique slug)
- Styles: `apps/web/src/styles/openMic.css`
- File storage: **Dropbox** (band leader OAuth) — link/reference band song parts; no `bandie-open-mic-files` Supabase bucket in MVP
- Tables: `bandie_organiser_members` for delegated roles (spec §9.2)

---

## 4. Pre-implementation checklist

- [ ] Read source spec end-to-end (`bandie_open_mic_jam_night_spec.md`)
- [ ] Read entitlements spec §6.4, §20.1 #6, §21 Phase 4 (open mic packs)
- [ ] Read `docs/project/product-functional-requirements.md` (organiser, gigs, venues)
- [ ] Read `docs/RSD_DATA_MODELLING_GUIDE.md` and `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`
- [ ] Confirm no conflicting `bandie_open_mic_*` migrations exist
- [ ] Agree phase order with `docs/DELIVERY_TASK_MAP.md` and tracker **Phase 17**
- [x] Confirm organiser model: user-scoped owner + `bandie_organiser_members` for delegated roles
- [x] Product sign-off on §2 locked decisions (30 June 2026)

---

## 5. Release 1 — Event setup and promotion

**Goal:** Organiser creates, publishes, and shares an open mic event with public page and printable poster.  
**Spec reference:** §6.1, §6.2, §17 Release 1  
**Exit criteria:** Published event has public URL + QR; poster prints A4; duplicate event works; `open_mic.create` gate enforced.

### 5.1 Database schema & RLS

**Migration:** `supabase/migrations/20260702100000_bandie_open_mic_events.sql` (timestamp may shift)

- [ ] **5.1.1** Create `bandie_open_mic_events` (adapt spec §10.1)
  - [ ] `organiser_user_id uuid not null` (event owner)
  - [ ] `venue_id uuid nullable` → `bandie_organiser_venues(id)`
  - [ ] `title`, `slug` (**globally unique**)
  - [ ] `required_contact_field` enum: `email`, `phone`, `email_or_phone` (organiser chooses for guest sign-up)
  - [ ] `event_type` enum: `open_mic`, `jam_night`, `songbook_jam`, `house_band_guest_night`
  - [ ] `status` enum: `draft`, `published`, `signup_open`, `signup_closed`, `in_progress`, `completed`, `cancelled`, `archived`
  - [ ] `visibility` enum: `public`, `unlisted`, `private`
  - [ ] `starts_at`, `ends_at`, `timezone`
  - [ ] `description`, `host_name`, `house_band_name`, `entry_price`, `age_restrictions`, `equipment_notes`, `backline_notes`
  - [ ] `signup_mode` enum: `open`, `moderated`, `invite_only`, `organiser_only`
  - [ ] `signup_opens_at`, `signup_closes_at`, `max_songs_per_player`, `max_slots_per_player`
  - [ ] `public_song_list_enabled boolean`
  - [ ] `poster_template_id`, `event_image_url` (nullable)
  - [ ] `created_by`, `updated_by`, timestamps
- [ ] **5.1.2** Create `bandie_organiser_members` — delegated roles (owner, admin, host, house_band_member) per spec §10.1
- [ ] **5.1.3** Create `bandie_open_mic_activity_log` (spec §10.1 audit trail)
- [ ] **5.1.4** Create add-on tables — `bandie_addons`, `bandie_addon_entitlements`, `bandie_subject_addons` (Release 1 per decision #18)
- [ ] **5.1.5** Entitlement migration — set `organiser_free` `open_mic.create` to **deny**; Organiser Plus only
- [ ] **5.1.6** Indexes: `(organiser_user_id, status)`, `(slug)` unique, `(starts_at)`
- [ ] **5.1.7** Enable RLS on all new tables
- [ ] **5.1.8** **Select (organiser team)** — owner or active `bandie_organiser_members` or app admin
- [ ] **5.1.9** **Insert/update/delete** — role checks per spec §9.2 matrix
- [ ] **5.1.10** **Public read** — security definer RPC `bandie_get_public_open_mic_event(p_slug)` — anon-safe field subset
- [ ] **5.1.11** `updated_at` triggers
- [ ] **5.1.12** `supabase db push` + RLS smoke test (organiser plus, organiser free denied, outsider, public anon)
- [ ] **5.1.13** Update `supabase/migrations/README.md`

### 5.2 Security definer RPCs (Release 1)

- [ ] **5.2.1** `bandie_create_open_mic_event(...)` — validate required fields; default `draft`; log activity
- [ ] **5.2.2** `bandie_update_open_mic_event(...)` — organiser owner; block when terminal status
- [ ] **5.2.3** `bandie_publish_open_mic_event(p_event_id)` — validate title, date/time, venue; → `published` or `signup_open`
- [ ] **5.2.4** `bandie_cancel_open_mic_event(p_event_id)`
- [ ] **5.2.5** `bandie_duplicate_open_mic_event(p_event_id)` — copy event shell (songs copied in Release 2 RPC)
- [ ] **5.2.6** `bandie_get_public_open_mic_event(p_slug)` — anon-safe field subset
- [ ] **5.2.7** `grant execute` to `authenticated` / `anon` as appropriate

### 5.3 `@bandie/data` — events module (Release 1)

**File:** `packages/data/src/openMicEvents.ts` (expand across releases)

- [ ] **5.3.1** TypeScript types: `OpenMicEvent`, `OpenMicEventStatus`, `OpenMicEventType`, `OpenMicSignupMode`, `OpenMicVisibility`
- [ ] **5.3.2** Label/format helpers (`formatOpenMicEventStatus`, status pill class)
- [ ] **5.3.3** `listOrganiserOpenMicEvents(organiserUserId)` — with summary counts (songs, signups — stub 0 until Release 2)
- [ ] **5.3.4** `getOpenMicEvent(eventId)` / `getOpenMicEventBySlug(slug)`
- [ ] **5.3.5** `createOpenMicEvent(input)` — `assertCanPerform({ capability: 'open_mic.create' })` — **Organiser Plus only**
- [ ] **5.3.6** `updateOpenMicEvent`, `publishOpenMicEvent`, `cancelOpenMicEvent`, `duplicateOpenMicEvent`
- [ ] **5.3.7** `getPublicOpenMicEvent(slug)` — for public page
- [ ] **5.3.8** Constants: `OPEN_MIC_ORGANISER_ONLY_MESSAGE`
- [ ] **5.3.9** Export from `packages/data/src/index.ts`

### 5.4 Web routes & navigation (Release 1)

- [ ] **5.4.1** Organiser routes in `App.tsx` (organiser workspace mode)
  - [ ] `/app/open-mic` — events dashboard
  - [ ] `/app/open-mic/new` — create flow
  - [ ] `/app/open-mic/:eventId` — event overview
  - [ ] `/app/open-mic/:eventId/poster` — poster preview
- [ ] **5.4.2** Public route: **`/events/:slug`** — no auth required
- [ ] **5.4.3** Organiser nav link: **Open mic / Jam nights** alongside My gigs, My venues
- [ ] **5.4.4** Entitlement route guard — hide create when `open_mic.create` blocked; show upgrade prompt

### 5.5 UI components (Release 1)

**Styles:** `apps/web/src/styles/openMic.css`

- [ ] **5.5.1** `OpenMicEventsDashboardPage` — list cards: status, date, venue, signups count, CTA
- [ ] **5.5.2** `CreateOpenMicEventPage` / wizard — spec §6.1.1 required + optional fields
- [ ] **5.5.3** Venue picker — reuse organiser venues (`OrganiserVenueForm` patterns) or ad hoc venue fields
- [ ] **5.5.4** `OpenMicEventOverviewPage` — summary cards (spec §14.1): status, songs planned (0 until R2), signups, time until event
- [ ] **5.5.5** Primary actions: Publish, Create poster, Open sign-up page (disabled until R2), Manage songs (R2), Launch live mode (R3)
- [ ] **5.5.6** `OpenMicPosterPage` — HTML/CSS poster component (spec §11.4)
  - [ ] Template variants: pub open mic, blues jam, rock jam, acoustic night, community music night (spec §6.2.2)
  - [ ] QR code from public event URL (client library)
  - [ ] Print stylesheet for A4
  - [ ] Share link copy
- [ ] **5.5.7** `PublicOpenMicEventPage` — event header, description, sign-up CTA, QR (spec §6.2.3)
- [ ] **5.5.8** Empty states — no events yet; draft unpublished
- [ ] **5.5.9** Mobile-first public page; 44px+ tap targets

### 5.6 Release 1 documentation

- [ ] **5.6.1** Tracker Phase 17 checklist updated
- [ ] **5.6.2** Functional requirements subsection (organiser open mic)
- [ ] **5.6.3** Technical requirements — tables, routes, module

### 5.7 Release 1 acceptance

- [ ] **5.7.1** Organiser creates draft event with required fields
- [ ] **5.7.2** Publish blocked without title, date/time, venue
- [ ] **5.7.3** Public page loads via slug (unlisted URL)
- [ ] **5.7.4** Poster renders and prints
- [ ] **5.7.5** Duplicate event creates new draft
- [ ] **5.7.6** Organiser Free user sees upgrade prompt; cannot create event

---

## 6. Release 2 — Song list and player sign-up

**Goal:** Organiser builds song list with instrument slots; players sign up via public page; moderated approval queue.  
**Spec reference:** §6.3–§6.6, §17 Release 2  
**Exit criteria:** Songs + slots editable; templates apply; guest + logged-in sign-up; approval workflow; player “my sign-ups” view.

### 6.1 Database schema & RLS (Release 2)

**Migration:** `supabase/migrations/20260702110000_bandie_open_mic_songs_signup.sql`

- [ ] **6.1.1** Create `bandie_open_mic_songs` (spec §10.1)
  - [ ] `event_id`, `source_song_id nullable`, `source_type` enum
  - [ ] `title`, `artist`, `key`, `duration_seconds`, `bpm`, `genre`, `difficulty`, `notes`
  - [ ] `readiness_status`, `readiness_override`, `sort_order`, `live_status`
- [ ] **6.1.2** Create `bandie_open_mic_song_slots`
  - [ ] `event_song_id`, `slot_name`, `required`, `min_players`, `max_players`
  - [ ] `status`, `public_signup_enabled`, `notes`, `sort_order`
- [ ] **6.1.3** Create `bandie_open_mic_players` — guest + linked `user_id`; `is_bandie_member` computed or flagged in UI
- [ ] **6.1.4** Create `bandie_open_mic_assignments` — requested/approved/rejected/cancelled/withdrawn/backup
- [ ] **6.1.5** Create `bandie_open_mic_song_suggestions` — player-proposed songs (`pending` / `approved` / `rejected`); organiser approves before entering song list
- [ ] **6.1.6** Create `bandie_open_mic_instrument_templates` + seed rows (rock, acoustic, blues — spec §6.4.1)
- [ ] **6.1.6** Indexes and FK cascades
- [ ] **6.1.7** RLS: organiser full access; players read own assignments; public read slots when event published + policy allows
- [ ] **6.1.8** Readiness computed helper function (required slots filled → `ready`)

### 6.2 RPCs (Release 2)

- [ ] **6.2.1** Song CRUD + `bandie_reorder_open_mic_songs`
- [ ] **6.2.2** Slot CRUD + `bandie_apply_instrument_template`
- [ ] **6.2.3** `bandie_request_open_mic_slot(...)` — guest or authenticated; enforce signup_mode, caps, cut-off; **flag Bandie members**
- [ ] **6.2.4** `bandie_submit_open_mic_song_suggestion(...)` — player proposes song; organiser approves
- [ ] **6.2.5** `bandie_approve_open_mic_assignment`, `bandie_reject_open_mic_assignment`
- [ ] **6.2.5** `bandie_assign_player_to_slot` — organiser manual assign
- [ ] **6.2.6** `bandie_cancel_open_mic_assignment` — player or organiser
- [ ] **6.2.7** Duplicate event copies songs + slots (extend 5.2.5)
- [ ] **6.2.8** Activity log entries for sign-up lifecycle

### 6.3 `@bandie/data` (Release 2)

- [ ] **6.3.1** Types: `OpenMicSong`, `OpenMicSongSlot`, `OpenMicPlayer`, `OpenMicAssignment`
- [ ] **6.3.2** `listOpenMicSongs(eventId)`, `getOpenMicSongDetail`
- [ ] **6.3.3** `addOpenMicSong`, `updateOpenMicSong`, `deleteOpenMicSong`, `reorderOpenMicSongs`
- [ ] **6.3.4** `addSongSlot`, `updateSongSlot`, `deleteSongSlot`, `applyInstrumentTemplate`
- [ ] **6.3.5** `requestOpenMicSlot`, `approveAssignment`, `rejectAssignment`, `assignPlayerToSlot`, `cancelAssignment`
- [ ] **6.3.6** `listOpenMicSignups(eventId)` — moderation queue
- [ ] **6.3.7** `listMyOpenMicAssignments(eventId, viewerContext)`
- [ ] **6.3.8** Pure functions: `computeSongReadiness`, `conflictWarnings` (spec §6.6.3)
- [ ] **6.3.9** `importOpenMicSongsFromPreviousEvent`, `importOpenMicSongsFromBand` (stub permission check)

### 6.4 UI (Release 2)

- [ ] **6.4.1** `OpenMicSongListPage` / tab on event overview — table spec §6.3.2
- [ ] **6.4.2** Inline edit key, duration, notes; drag reorder handle
- [ ] **6.4.3** Slot chips under each song; empty required slots highlighted
- [ ] **6.4.4** Side panel: selected song detail + slot editor
- [ ] **6.4.5** Instrument template picker (rock / acoustic / blues)
- [ ] **6.4.6** Bulk actions: delete selected, lock selected (MVP subset spec §6.3.3)
- [ ] **6.4.7** `OpenMicSignUpPage` (public) — guest form respects organiser `required_contact_field`; Bandie member badge when logged in
- [ ] **6.4.8** Player **song suggestion** form — propose song for organiser approval
- [ ] **6.4.9** `OpenMicModerationPanel` — approve/reject sign-ups **and song suggestions**
- [ ] **6.4.9** `OpenMicMySignUpsPage` — player view spec §6.5.3
- [ ] **6.4.10** Conflict warning badges for organiser
- [ ] **6.4.11** Filters: readiness, empty slots, player, instrument (organiser list)

### 6.5 Release 2 acceptance

- [ ] **6.5.1** Add song manually; apply template creates slots
- [ ] **6.5.2** Guest signs up for open slot (open mode)
- [ ] **6.5.3** Moderated mode: request → approve → filled slot
- [ ] **6.5.4** Max songs per player enforced
- [ ] **6.5.5** Readiness reflects empty required slots

---

## 7. Release 3 — Live running order

**Goal:** Live control room for the night — reorder, progress states, walk-ups, event summary.  
**Spec reference:** §6.7, §17 Release 3  
**Exit criteria:** Realtime updates between devices; mark playing/complete/skip; walk-up add; summary at end.

### 7.1 Schema & RPCs (Release 3)

- [ ] **7.1.1** Ensure `live_status` on songs supports: `queued`, `called`, `on_deck`, `playing`, `completed`, `skipped`, `cancelled`
- [ ] **7.1.2** Optional `bandie_open_mic_breaks` or break rows in running order (insert break — spec §6.7.3)
- [ ] **7.1.3** RPCs: `bandie_start_open_mic_event`, `bandie_set_current_open_mic_song`, `bandie_update_open_mic_song_live_status`
- [ ] **7.1.4** RPCs: `bandie_skip_open_mic_song`, `bandie_complete_open_mic_song`, `bandie_reorder_open_mic_running_order`
- [ ] **7.1.5** RPCs: `bandie_add_walk_up_player`, `bandie_add_ad_hoc_open_mic_song`
- [ ] **7.1.6** RPC: `bandie_end_open_mic_event` → `completed` + summary snapshot

### 7.2 Realtime (Release 3)

- [ ] **7.2.1** Supabase Realtime channel per `event_id`
- [ ] **7.2.2** Broadcast: running order, live status, new sign-ups, withdrawals
- [ ] **7.2.3** Scope channel to organiser + event participants only
- [ ] **7.2.4** Conflict handling: last-updated timestamp; organiser override (spec §16)
- [ ] **7.2.5** Fallback polling when Realtime disconnected

### 7.3 `@bandie/data` (Release 3)

- [ ] **7.3.1** Live service functions wrapping RPCs
- [ ] **7.3.2** `subscribeOpenMicEvent(channel, handlers)` — Realtime wrapper
- [ ] **7.3.3** `getOpenMicLiveDashboard(eventId)` — now playing, up next, issues
- [ ] **7.3.4** `getOpenMicEventSummary(eventId)` — spec §6.11 MVP metrics

### 7.4 UI — Live control room (Release 3)

**Route:** `/app/open-mic/:eventId/live`

- [ ] **7.4.1** `OpenMicLiveControlPage` — spec §14.4: high contrast, large tap targets
- [ ] **7.4.2** **Now Playing** panel — current song, players, complete/skip
- [ ] **7.4.3** **Up Next** — next 3–5 songs, readiness warnings, call players
- [ ] **7.4.4** **Running Order** — full list, drag/drop, status indicators
- [ ] **7.4.5** **Issues** panel — empty slots, withdrawals, not ready
- [ ] **7.4.6** **Walk-Up Add** — quick player + song + slot assign
- [ ] **7.4.7** Lock running order action
- [ ] **7.4.8** Estimate end time from durations
- [ ] **7.4.9** `OpenMicEventSummaryPage` — post-event read-only stats
- [ ] **7.4.10** **Export running order PDF** — print stylesheet / browser print-to-PDF (MVP)

### 7.5 Release 3 acceptance

- [ ] **7.5.1** Start event → first song playable
- [ ] **7.5.2** Reorder reflects on second device via Realtime
- [ ] **7.5.3** Mark complete advances queue
- [ ] **7.5.4** Walk-up player added mid-event
- [ ] **7.5.6** Running order exports to PDF

---

## 8. Release 4 — Song resources integration (Dropbox)

**Goal:** Link band song folders / Dropbox part files where organiser is band leader; Bandie-member-only visibility.  
**Spec reference:** §6.8, §17 Release 4  
**Exit criteria:** Organiser links band song file; assigned Bandie members can view; guests cannot.

### 8.1 Schema (Release 4)

- [ ] **8.1.1** Create `bandie_open_mic_event_files` — metadata only; `source_file_id` → `bandie_song_part_files` or external URL
- [ ] **8.1.2** Visibility enum: `organiser_only`, `bandie_members_assigned`, `bandie_members_event` (organiser enables for logged-in Bandie users)
- [ ] **8.1.3** RLS — **deny anon**; require authenticated Bandie user + assignment/membership check for reads
- [ ] **8.1.4** No new Supabase Storage bucket — bytes via existing Dropbox paths

### 8.2 Band song integration (Release 4)

- [ ] **8.2.1** `importOpenMicSongsFromBand(bandId, songIds)` — copy metadata + slot mapping from part templates
- [ ] **8.2.2** `linkBandSongFileToOpenMicEvent(...)` — reference Dropbox file metadata via `bandie_song_part_files`
- [ ] **8.2.3** Permission check: organiser must be band leader for linked band
- [ ] **8.2.4** Default visibility: organiser + assigned Bandie members only

### 8.3 `@bandie/data` + UI (Release 4)

- [ ] **8.3.1** `linkOpenMicEventFile`, `listOpenMicEventFiles`, `updateFileVisibility`
- [ ] **8.3.2** `getAvailableResources(eventId, viewerContext)` — returns empty for guests/non-members
- [ ] **8.3.3** Link file UI on song detail panel (pick from band song folder)
- [ ] **8.3.4** Bandie member resource view on “My sign-ups”
- [ ] **8.3.5** Copyright/content responsibility warning (spec §6.8.4)

### 8.4 Release 4 acceptance

- [ ] **8.4.1** Organiser links band Dropbox PDF; assigned Bandie member can preview
- [ ] **8.4.2** Guest / non-member cannot access file
- [ ] **8.4.3** Import song from band creates event song + slots

---

## 9. Phase 5 — Admin metrics and analytics

**Goal:** Platform visibility for open mic usage. Add-on assign UI for future packs (schema shipped Release 1).

### 9.1 Admin & analytics

- [ ] **9.1.1** Admin metrics: open mic events created, sign-ups received, song suggestions
- [ ] **9.1.2** Analytics events: `open_mic_created`, `open_mic_signup_received`, `open_mic_song_suggested`, `open_mic_event_started`, `open_mic_event_completed`
- [ ] **9.1.3** Gate decision logging for denied creates (Organiser Free)
- [ ] **9.1.4** Admin manual assign `open_mic_event_pack` (when product enables packs beyond Plus)

---

## 10. Phase 6 — Notifications, search polish, and deferred spec items

**Goal:** In-app notifications, email defer, CSV export, recurring events.  
**Spec reference:** §6.9, §6.10, §6.1.3, §18

### 10.1 Notifications (MVP subset)

- [ ] **10.1.1** In-app: player sign-up, approve/reject, assignment change
- [ ] **10.1.2** Integrate with communications hub where feasible
- [ ] **10.1.3** Defer email and push (spec §6.9)

### 10.2 Search & filters (polish)

- [ ] **10.2.1** Full organiser filter set spec §6.10
- [ ] **10.2.2** Player sign-up filters: difficulty, genre, key

### 10.3 Post-MVP backlog (track, do not build in Phase 17 MVP)

- [ ] **10.3.1** Public Bandie event directory
- [ ] **10.3.2** Recurring events (weekly/monthly)
- [ ] **10.3.3** Stage display / public screen mode (spec §6.7.4)
- [ ] **10.3.4** Server-side poster PNG export
- [ ] **10.3.5** CSV running order export
- [ ] **10.3.6** Waitlist automation
- [ ] **10.3.7** Fair rotation algorithms
- [ ] **10.3.8** Offline live mode
- [ ] **10.3.9** Guest magic-link verification
- [ ] **10.3.10** Event history → song/player popularity
- [ ] **10.3.11** Supabase Storage bucket for organisers without Dropbox

---

## 11. Testing strategy

### 11.1 Unit tests (`packages/data`)

- [ ] **11.1.1** `computeSongReadiness` — required vs optional slots
- [ ] **11.1.2** Sign-up constraint validation (max songs, cut-off, duplicate slot)
- [ ] **11.1.3** Running order uniqueness helpers

### 11.2 Integration / manual QA

- [ ] **11.2.1** RLS: outsider cannot read organiser draft event
- [ ] **11.2.2** RLS: public RPC exposes no private organiser notes
- [ ] **11.2.3** Guest sign-up without auth
- [ ] **11.2.4** Player withdraws; organiser sees issue in live room
- [ ] **11.2.5** Event cancelled after sign-ups — players notified (when notifications ship)
- [ ] **11.2.6** Poor connectivity — polling fallback works
- [ ] **11.2.7** Entitlement: second event blocked on Organiser Free when enforcing

### 11.3 CI

- [ ] **11.3.1** `npm run build` green after each release
- [ ] **11.3.2** Add `@bandie/data` tests when jest/vitest configured

---

## 12. Security checklist

- [ ] RLS enabled on all new tables and storage bucket (same migration)
- [ ] Public event RPC exposes field allowlist only
- [ ] Guest PII (email/phone) organiser-only read
- [ ] File visibility default restrictive; no accidental public on band Dropbox links
- [ ] State transitions (publish, start, complete) via RPC where client could bypass rules
- [ ] No service-role key in client
- [ ] Activity log for publish, sign-up, approve, live status changes
- [ ] Rate-limit public sign-up RPC (Edge Function or pg throttle) — post-MVP if needed

---

## 13. Task summary by release

| Layer | Release 1 | Release 2 | Release 3 | Release 4 | Phase 5 |
|---|---|---|---|---|---|
| Migrations / RLS | 5.1–5.2 | 6.1–6.2 | 7.1 | 8.1 | 9.1 |
| `@bandie/data` | 5.3 | 6.3 | 7.3 | 8.3 | 9.2 |
| Web UI | 5.4–5.5 | 6.4 | 7.4 | 8.3 | 9.3 |
| Realtime | — | — | 7.2 | — | — |
| Storage | — | — | — | 8.1 | — |
| QA | 5.7 | 6.5 | 7.5 | 8.4 | 11.x |

---

## 14. Suggested implementation order (sprint-sized)

1. **Sprint A:** 5.1 + 5.2 schema/RPCs + `db push`
2. **Sprint B:** 5.3 data module + 5.4 routes
3. **Sprint C:** 5.5 create/publish/public page/poster (Release 1)
4. **Sprint D:** 6.1–6.3 songs, slots, templates (Release 2 backend)
5. **Sprint E:** 6.4 sign-up + moderation UI (Release 2 frontend)
6. **Sprint F:** 7.x live control room + Realtime (Release 3)
7. **Sprint G:** 8.x files + band linking (Release 4)
8. **Sprint H:** 9.x entitlements add-ons + admin metrics

---

## 16. Resolved product decisions (chat 30 June 2026)

Authoritative copy in spec §19–§20. Summary:

| # | Decision |
|---|---|
| 1–2 | Organiser Plus required; gate on create |
| 3 | Guest sign-up with email or phone (organiser chooses); Bandie members flagged |
| 4 | No guest verification MVP |
| 5 | Player song suggestions with organiser approval |
| 6–7 | No public directory; organiser toggle for song list |
| 8 | Files for Bandie members only when organiser enables |
| 9 | Contact organiser-only; names public on event |
| 10–12 | Optional venue; full organiser roles; house band flag |
| 13–14 | Global slug; `/events/:slug` |
| 15 | Dropbox file linking |
| 16 | PDF export MVP |
| 17 | Duplicate only |
| 18 | Add-on schema Release 1 |

---

## 17. References

- Functional spec: [`bandie_open_mic_jam_night_spec.md`](./bandie_open_mic_jam_night_spec.md)
- Entitlements: [`bandie_entitlements_admin_portal_functional_technical_spec.md`](./bandie_entitlements_admin_portal_functional_technical_spec.md) §6.4, §20.1 #6
- Organiser gigs (pattern): `packages/data/src/gigs.ts`, `OrganiserGigDetailPage`
- Product FR/TR: `docs/project/product-functional-requirements.md`, `product-technical-requirements.md`
- Tracker: `docs/PROJECT_STATUS_TRACKER.md` Phase 17
- RLS rules: `.cursor/rules/supabase-rls.mdc`
- UX: `docs/RSD_UX_DESIGN_FRAMEWORK.md` §6.4–6.5 (light modals on dark shell)
