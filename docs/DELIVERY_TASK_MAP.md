# Bandie — Delivery Task Map

**Document status:** Structural delivery plan (no progress tracking)  
**Product:** Bandie  
**Last updated:** 30 June 2026 (aligned with tracker Phases 8–14 complete)

**Progress tracking:** Use `docs/PROJECT_STATUS_TRACKER.md` for live status. The tracker uses finer-grained phases (0–19) than this map; see tracker §Phase roadmap for the authoritative numbering.

---

## Purpose

This document defines **delivery phases, sequencing, and dependencies**. It is a structural plan only — not updated for every task completion.

---

## Phase 0 — Foundations

**Goal:** Repository, tooling, and platform ready for feature work.

**Deliverables:**
- Monorepo scaffold (`apps/`, `packages/`, `supabase/`)
- Governance documents
- Web app shell
- CI/CD pipeline
- Supabase app registration + platform migrations
- Environment configuration

**Exit criteria:** `npm run dev` and `npm run build` succeed; Supabase client connects; CI green.

**Dependencies:** None.

**Status:** Complete.

---

## Phase 1 — Public marketing surface

**Goal:** Bandie homepage live at `/`.

**Deliverables:**
- Marketing homepage per spec and mockup
- SEO metadata, accessibility baseline
- Analytics stub
- Live links to `/bands`, `/login`, `/signup`

**Exit criteria:** Homepage MVP acceptance criteria (spec §20) met.

**Dependencies:** Phase 0.

**Reference:** `bandie_homepage_functional_technical_spec.md`

**Status:** Complete.

---

## Phase 2 — Authentication and band bootstrap

**Goal:** Users can register, log in, create a band, and invite members.

**Deliverables:**
- Supabase Auth integration via `@bandie/data`
- Registration, login, password reset, sign-out to homepage
- Band creation wizard
- Membership and invitation flow
- Band switcher shell
- Musician / player profile at `/app/profile`
- Pending invite detection and acceptance

**Exit criteria:** User can create account, create band, invite member, member can access workspace.

**Dependencies:** Phase 0 (Supabase migrations for auth-related band tables).

**Status:** Complete.

---

## Phase 3 — Public band presence

**Goal:** Bands have publishable public profiles; organisers can browse directory.

**Deliverables:**
- Band profile data model + RLS
- Public profile page with font and colour palette theming
- Profile editor in workspace overview
- Band directory with search/filter/sort
- Player directory with deputy/member search modes
- Public player profiles
- Booking enquiry form
- Public band members roster and set/fee offers on profiles

**Exit criteria:** Band profile publishable; directory searchable; enquiry submitted and delivered to band primary contact.

**Dependencies:** Phase 2.

**Status:** Complete — including structured booking enquiry inbox in communications (tracker Phase 11).

---

## Phase 4 — Private workspace core

**Goal:** Operational band workspace with songs, setlists, and files.

**Deliverables:**
- Workspace shell and navigation
- Songs dashboard
- Song folder with part folders
- **Dropbox song-part storage** (leader OAuth, upload, preview/download — see `bandie_dropbox_song_part_storage_spec.md`)
- Setlist library and builder
- Readiness tracking (part completeness from current files)

**Exit criteria:** Band can manage repertoire, upload files, build and save a setlist.

**Dependencies:** Phase 2, Phase 3 (profile/settings integration).

**Status:** Complete — songs MVP (dashboard, Dropbox, templates, PDF viewer, soft delete), setlists (library, builder, metrics).

---

## Phase 5 — Calendar, availability, and gigs

**Goal:** Coordinate rehearsals and gig availability; manage confirmed gigs.

**Deliverables:**
- Calendar (rehearsal + gig modes)
- Member availability voting
- Status rules (confirmed/provisional/proposed)
- Public calendar publishing
- Gig management area
- Gig ↔ setlist linking

**Exit criteria:** Band can propose dates, members vote, confirmed dates appear on public profile; gig record links to setlist.

**Dependencies:** Phase 4, Phase 8 entitlement hooks (tracker).

**Status:** Complete (tracker Phases 9–10). MVP calendar UI is functional; richer monthly grid vs mockup may follow in polish (Phase 16).

---

## Phase 6 — Activity, notifications, and polish

**Goal:** Cross-feature visibility and member engagement.

**Deliverables:**
- Activity feed
- Review tasks on songs
- Basic in-app notifications
- Performance and UX polish pass

**Exit criteria:** Recent activity visible; members notified of key events.

**Dependencies:** Phases 4–5.

**Status:** Partial — `/app/communications` ships unified communications (invitations, player outreach, direct messages, **booking enquiries**); activity feed, review tasks, and push remain deferred (tracker Phase 16).

---

## Phase 7 — Mobile app (post-MVP web)

**Goal:** Mobile member experience for high-priority tasks.

**Deliverables:**
- Expo scaffold
- Login, band switcher
- View setlists and song files
- Availability voting
- Push notifications (optional)

**Exit criteria:** Core mobile journeys from product description §9.3 work on device.

**Dependencies:** Phases 2–5 stable on web.

**Status:** Not started (tracker Phase 18).

---

## Phase 8 — Admin and platform operations

**Goal:** Operational tooling for platform management.

**Deliverables:**
- Admin portal per `RSD_ADMIN_PORTAL_GUIDE.md` and `bandie_entitlements_admin_portal_functional_technical_spec.md`
- User/band search, metrics, entitlement admin, audit log
- Content moderation, system health (deferred)

**Exit criteria:** Admin can view users, operate entitlements, and audit commercial changes.

**Dependencies:** Phase 2+, entitlement framework (tracker Phase 8).

**Status:** Partial — `/admin` portal shipped (overview, accounts, metrics, entitlements, audit); billing admin (Phase 15), moderation and system health (Phase 19) deferred.

---

## Dependency diagram

```text
Phase 0 (Foundations)
    │
    ▼
Phase 1 (Homepage)
    │
    ▼
Phase 2 (Auth + Bands + Player profiles)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Public)   Phase 4 (Workspace core)
    │                  │
    └────────┬─────────┘
             ▼
      Phase 5 (Calendar + Gigs)  ← requires entitlement hooks (tracker Phase 8)
             │
             ▼
      Phase 6 (Activity)
             │
      ┌──────┴──────┐
      ▼             ▼
Phase 7 (Mobile)  Phase 8 (Admin)
```

---

## MVP boundary

Phases 0–5 constitute the **core product MVP** as defined in `PRODUCT_REQUIREMENTS.md`. Entitlement enforcement, billing, mobile, and full admin operations extend beyond MVP.

**Monetisation path (tracker):** Phase 8 entitlements → Phase 14 enforcement admin → Phase 15 Stripe billing.

---

## Current position

**Completed:** Delivery map Phases 0–5; Phase 6 partial (communications); Phase 8 partial (admin portal foundation)  
**Tracker alignment:** Phases 0–14 complete on web; remote DB migrated through `20260630150000`  
**Next:** Phase 15 billing (Stripe); then Phase 16 polish, Phase 17 open mic, Phase 18 mobile

See `docs/PROJECT_STATUS_TRACKER.md` for the unified phase roadmap and item-level checklist (Phases 0–19).
