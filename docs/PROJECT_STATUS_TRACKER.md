# Bandie — Project Status Tracker

**Document status:** Live project tracker  
**Product:** Bandie  
**Phase:** Phase 1 complete — homepage live  
**Last updated:** 26 June 2026

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
| Mobile app | Not started (placeholder only) |
| Supabase schema / migrations | Not started |

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

**Next capability:** Authentication and band membership (Phase 2)

Reference documents:
- `docs/project/product-functional-requirements.md` §6
- `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`

## Blockers

None.

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
- [ ] 0.10 CI/CD pipeline (GitHub Actions + Netlify)
- [ ] 0.11 Supabase app registration on shared instance
- [ ] 0.12 Initial platform schema migrations

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

- [ ] 2.1 User registration
- [ ] 2.2 Login / logout
- [ ] 2.3 Password reset
- [ ] 2.4 Band creation flow
- [ ] 2.5 Band membership and invitations
- [ ] 2.6 Band switcher (multi-band users)

### 3. Public band profile

- [ ] 3.1 Band profile data model and RLS
- [ ] 3.2 Public profile page (`/bands/[slug]`)
- [ ] 3.3 Profile editing (band settings)
- [ ] 3.4 Media and social links
- [ ] 3.5 Public availability display

### 4. Band directory

- [ ] 4.1 Directory data model and search
- [ ] 4.2 Directory page (`/bands`)
- [ ] 4.3 Filters (genre, location, price, rating, availability)
- [ ] 4.4 Sorting and result cards
- [ ] 4.5 Empty state handling

### 5. Private band workspace

- [ ] 5.1 Workspace shell and navigation
- [ ] 5.2 Member-only access enforcement
- [ ] 5.3 Dashboard / home view

### 6. Songs and repertoire

- [ ] 6.1 Songs data model
- [ ] 6.2 Songs dashboard
- [ ] 6.3 Song directory (search, filter, metrics)
- [ ] 6.4 Song folder / workspace
- [ ] 6.5 Part folders and file uploads
- [ ] 6.6 Readiness tracking

### 7. Setlist management

- [ ] 7.1 Setlist data model
- [ ] 7.2 Setlist library
- [ ] 7.3 Setlist builder (drag/reorder)
- [ ] 7.4 Setlist metrics and status

### 8. Calendar and availability

- [ ] 8.1 Calendar data model
- [ ] 8.2 Rehearsal mode
- [ ] 8.3 Gig availability mode
- [ ] 8.4 Member voting
- [ ] 8.5 Public calendar publishing

### 9. Gig management

- [ ] 9.1 Gig data model
- [ ] 9.2 Gig list and detail views
- [ ] 9.3 Linked setlists and readiness
- [ ] 9.4 Gig status workflow

### 10. Booking enquiries

- [ ] 10.1 Enquiry form (public)
- [ ] 10.2 Enquiry management (private workspace)
- [ ] 10.3 Notifications for new enquiries

### 11. Platform foundations

- [ ] 11.1 File storage (Supabase Storage, `bandie` buckets)
- [ ] 11.2 Activity feed / audit log
- [ ] 11.3 Notifications
- [ ] 11.4 Admin portal (skeleton)

### 12. Mobile app

- [ ] 12.1 Expo / React Native scaffold
- [ ] 12.2 Core member flows (availability, setlists, songs)
- [ ] 12.3 Performance mode (deferred post-MVP)

---

## Session notes

**26 June 2026 — Homepage (Phase 1)**
- Implemented marketing homepage at `/` matching mockup and spec
- Added placeholder routes `/bands` and `/signup`
- Added `netlify.toml` and SPA redirects for client routing
- Build and lint verified

**26 June 2026 — Bootstrap**
- Created monorepo structure per `RSD_PROJECT_BOOTSTRAP.md`
- Documented architectural decisions: Vite + React, shared Supabase with `bandie_` prefix
- Next step: implement homepage per functional/technical spec
