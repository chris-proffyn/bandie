# Bandie — Delivery Task Map

**Document status:** Structural delivery plan (no progress tracking)  
**Product:** Bandie  
**Last updated:** 26 June 2026

**Progress tracking:** Use `docs/PROJECT_STATUS_TRACKER.md` for live status.

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

---

## Phase 1 — Public marketing surface

**Goal:** Bandie homepage live at `/`.

**Deliverables:**
- Marketing homepage per spec and mockup
- SEO metadata, accessibility baseline
- Analytics stub
- Placeholder routes for signup and directory

**Exit criteria:** Homepage MVP acceptance criteria (spec §20) met.

**Dependencies:** Phase 0.

**Reference:** `bandie_homepage_functional_technical_spec.md`

---

## Phase 2 — Authentication and band bootstrap

**Goal:** Users can register, log in, create a band, and invite members.

**Deliverables:**
- Supabase Auth integration via `@bandie/data`
- Registration, login, password reset
- Band creation wizard
- Membership and invitation flow
- Band switcher shell

**Exit criteria:** User can create account, create band, invite member, member can access workspace.

**Dependencies:** Phase 0 (Supabase migrations for auth-related band tables).

---

## Phase 3 — Public band presence

**Goal:** Bands have publishable public profiles; organisers can browse directory.

**Deliverables:**
- Band profile data model + RLS
- Public profile page
- Profile editor in workspace
- Band directory with search/filter/sort
- Booking enquiry form

**Exit criteria:** Band profile publishable; directory searchable; enquiry submitted and visible to band.

**Dependencies:** Phase 2.

---

## Phase 4 — Private workspace core

**Goal:** Operational band workspace with songs, setlists, and files.

**Deliverables:**
- Workspace shell and navigation
- Songs dashboard
- Song folder with part folders
- File upload to Supabase Storage
- Setlist library and builder
- Readiness tracking (basic)

**Exit criteria:** Band can manage repertoire, upload files, build and save a setlist.

**Dependencies:** Phase 2, Phase 3 (profile/settings integration).

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

**Dependencies:** Phase 4.

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

---

## Phase 8 — Admin and platform operations

**Goal:** Operational tooling for platform management.

**Deliverables:**
- Admin portal skeleton per `RSD_ADMIN_PORTAL_GUIDE.md`
- User management, content moderation, usage visibility

**Exit criteria:** Admin can view users and moderate reported content.

**Dependencies:** Phase 2+.

---

## Dependency diagram

```text
Phase 0 (Foundations)
    │
    ▼
Phase 1 (Homepage)
    │
    ▼
Phase 2 (Auth + Bands)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Public)   Phase 4 (Workspace)
    │                  │
    └────────┬─────────┘
             ▼
      Phase 5 (Calendar + Gigs)
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

Phases 0–5 constitute the **MVP** as defined in `PRODUCT_REQUIREMENTS.md`. Phases 6–8 are post-MVP or parallel where resources allow.

---

## Current position

**Completed:** Phase 0 (partial — CI and Supabase migrations pending)  
**Next:** Phase 1 — Bandie Homepage
