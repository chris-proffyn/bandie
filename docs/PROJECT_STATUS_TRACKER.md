# Bandie — Project Status Tracker

**Document status:** Live project tracker  
**Product:** Bandie  
**Phase:** Phase 5 complete (workspace shell) — Phase 6 communications partial; booking enquiry partial  
**Last updated:** 28 June 2026 (directory area filters — countries & regions)

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
| Supabase schema / migrations | Platform + Bandie bootstrap through organiser venues (`20260628300000`); apply with `supabase db push` |
| Authentication & band membership (Phase 2) | Complete |
| Public band profile (Phase 3) | Complete |
| Band directory (Phase 4) | Complete |
| Musician / player profile | Complete |
| Player directory | Complete |
| Directory area filters | Complete — country + region on `/bands`, `/players`, `/app/bands`, `/app/players`; geo-detected default country |
| Private workspace shell (Phase 5) | Complete — tabbed overview (Members / Band details), leader contact, lineup parts, player recruitment, member actions, invitations; songs/setlists deferred |
| Workspace communications | Partial — unified hub at `/app/communications` (invites, player outreach, messages with replies) |
| Booking enquiries | Partial — structured enquiry form on public band profile sends direct message to primary contact |
| Organiser venues | Complete — `/app/venues` in organiser workspace mode |

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

**Next capability:** Songs and repertoire (Phase 6)

Reference documents:
- `docs/project/product-functional-requirements.md` §7
- `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`

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
Songs & repertoire        ░░░░░░░░░░  Phase 6 — next up
Mobile app                ░░░░░░░░░░  Phase 12 (deferred)
Release verification      ░░░░░░░░░░  production smoke + a11y pass
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
- [x] 4b.2 Directory page (`/players`) with temporary vs permanent search modes
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
- [ ] 5.7 Songs, setlists, calendar, and gigs navigation (deferred to Phases 6–8)

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

- [x] 10.1 Enquiry form (public) — structured form on band profile; sends direct message to primary contact
- [ ] 10.2 Enquiry management (private workspace) — received in `/app/communications` as messages; dedicated inbox deferred
- [ ] 10.3 Notifications for new enquiries

### 11. Platform foundations

- [x] 11.1 Profile image storage (`bandie-profile-images` bucket with RLS)
- [ ] 11.2 Song file storage (`bandie-song-files` bucket)
- [ ] 11.3 Activity feed / audit log
- [ ] 11.4 Communications — partial (invitations, player outreach, direct messages with replies; activity feed deferred)
- [ ] 11.5 Admin portal (skeleton)

### 12. Mobile app

- [ ] 12.1 Expo / React Native scaffold
- [ ] 12.2 Core member flows (availability, setlists, songs)
- [ ] 12.3 Performance mode (deferred post-MVP)

---

## Session notes

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
- Nav: Find bands, My venues, My profile

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
- `VITE_BANDIE_DATA_MODE`: `live` hides test rows; `test` shows all directory data
- Seeded 10 fictitious bands and 50 test players for development/demo (London area, within ~25 miles)

**27 June 2026 — Player directory “Any role” search mode**
- Added third search mode that lists all published players regardless of invite preference
- Any mode exposes both deputy and permanent filter groups; recommended sort boosts dual availability

**27 June 2026 — Player directory dual availability**
- Directory result cards show all invite preferences when a player is open to deputy gigs and permanent membership
- Profile editor and filter copy clarify that both invitation types can be selected independently

**27 June 2026 — Player directory in workspace**
- Authenticated player directory at `/app/players` with sidebar nav and band-leader entry points
- Defaults to permanent member search; shared `PlayerDirectoryView` for public and workspace layouts
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
