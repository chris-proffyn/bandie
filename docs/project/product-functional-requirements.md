# Bandie — Product Functional Requirements

**Document status:** Authoritative functional requirements  
**Product:** Bandie  
**Last updated:** 30 June 2026

**Source documents:** `bandie_product_description.md`, `bandie_build_elements.md`, feature specs in `docs/project/`

---

## 1. Purpose

This document defines **what Bandie must do** from a user and business perspective. Technical implementation details are in `product-technical-requirements.md`.

---

## 2. User roles

| Role | Description |
|---|---|
| Anonymous visitor | Browses homepage, directory, public profiles; submits booking enquiries |
| Registered user | Has a Bandie account; may belong to zero or more bands |
| Band member | Approved member of a band with workspace access |
| Band leader | Member with `owner` role; can manage band settings, members, public profile, and invitations. Multiple leaders allowed; one is primary public contact (`owner_user_id`) |
| Guest/Dep | Limited access to specific songs or setlists (planned) |
| Platform admin | Bandie app admin (`is_app_admin`); optional admin mode toggle for cross-band management |

A user may hold different roles in different bands.

---

## 3. Public marketing homepage

**Spec:** `bandie_homepage_functional_technical_spec.md`  
**Mockup:** `bandie_homepage_three_modes_v3.html` (supersedes `bandie_homepage_mockup.html`)

### Requirements

- Public, unauthenticated access at `/`
- Explain Bandie proposition to **players**, **bands** and **event organisers** as three equal modes
- Route players toward signup/player profile and the player directory
- Route bands toward signup/band creation
- Route organisers toward band directory
- Responsive (mobile, tablet, desktop)
- SEO metadata and accessible markup
- Analytics events on CTA clicks (provider-neutral stub acceptable for MVP)
- Static content for MVP; no live band data

### Key sections

Sticky navigation, hero with three audience CTAs and jump cards, example public band profile card, three-mode summary cards, per-audience “how it works” sections (players, bands, organisers), platform connection strip, core capabilities grid, footer.

---

## 4. Public band profile

**Mockup:** `bandie_skin_condition_homepage.html`

Each band has a public mini-site at `/bands/[slug]`.

### Content

Band name (with selectable display font), logo at the top of the profile (not in a card), location, genres, bio, photos, videos, track links, social links, active band members roster (with primary contact badge), set length & fee packages (fixed and dynamic), equipment notes, public availability, structured booking enquiry form, ratings/reviews (future).

### Layout

- Logo displayed prominently at the top of the profile, followed by the band name
- Logo is not contained in a card; the band name uses the font chosen in profile settings
- Optional hero image may appear above the identity block
- Booking stats (band size, set length, fee guidance) appear below the bio in a separate meta row
- Set length & fee cards use a compact grid layout on public profiles
- Active members shown in a card grid (avatar, role, instrument, lineup part, primary contact badge)

### Booking enquiry (implemented)

Signed-in organisers submit a structured enquiry from the public profile **Book** section: date, time, set duration (from band fee options), venue (with organiser venue picker when venues exist on profile), budget, and notes. Sender name, username, email, phone and location are included automatically. The enquiry is delivered as a direct message to the band's **primary contact** (band leader). Sign-in required.

### Behaviour

- Only intentionally published content is visible
- Private songs, files, notes, and internal availability are never exposed
- Confirmed/provisional gig availability may appear on public calendar (synced from calendar gig-availability events when the band leader’s plan includes full calendar — **Player Plus** or **Player Pro** / `calendar.use = full`)
- Booking enquiries arrive in `/app/communications` under **Booking enquiries** (structured inbox with status)

---

## 5. Band directory

**Mockup:** `bandie_band_directory_mockup.html`

Public searchable directory at `/bands`.

### Search and filters

Band name, genre, **country**, **area (region)**, town/postcode, price range (min/max), availability state.

**Area filters:** Country defaults from browser locale/timezone (United Kingdom when detected). United Kingdom regions include South West, South East, Greater London, Midlands, Cambridge and the East, Essex, Lancashire, Yorkshire, Cumbria, and Northumberland. Listings match assigned `region_id`/`country_id` or location text against region keywords.

### Result cards

Band name, genre, location, availability, rating, description, tags, price range, visual identity, link to profile.

### Sorting

Recommended, rating (high→low), price (low→high, high→low), name A–Z.

### Availability states

Available, limited availability, unavailable (derived from internal calendar in later versions; manual/static acceptable early).

### Implemented (June 2026)

- Live at `/bands` and `/app/bands` with country/area filter panel, town search, sort control, result cards, and empty states
- Three-column card grid on desktop; compact availability status pills on listing cards
- Rating filter deferred until reviews data exists
- Signed-in users see their display name in the marketing nav when visiting the homepage

### Test data mode

Fictitious bands and players are flagged with `test_user = true` on `bandie_bands` and `bandie_profiles`.

| `VITE_BANDIE_DATA_MODE` | Behaviour |
|---|---|
| `live` (default) | Test rows hidden from band directory, player directory, and public profiles; **Hide test data** toggles are not shown |
| `test` | All published bands and players shown, including 10 seeded test bands and 50 test players (all based in London and surrounding area, within ~25 miles) |

Real user-created records always have `test_user = false`.

**Hide test data (test mode only):** When build mode is `test` and the current list includes seeded rows, users can hide them client-side without changing the API. Toggle appears on:

- **My Bands** (`/app`)
- Band directory (`/bands`, `/app/bands`)
- Player directory (`/players`, `/app/players`)

Preference is stored in session storage (`bandie:directory:hide-test-data`) and shared across those screens. Cards for test rows show a **Test data** badge when visible.

---

## 4b. Player directory

Public searchable directory at `/players` for finding musicians open to deputy or permanent member invitations.

### Search modes

| Mode | Purpose | Default |
|---|---|---|
| Any | Browse all listed musicians; optional deputy and member filters | **Yes** — default on `/players` and `/app/players` |
| Temporary (deputy) | Find stand-in musicians for a specific gig | |
| Permanent (member) | Find musicians open to joining a band long-term | Used when arriving from band recruitment (`?forBand=…`) |

### Filters

**Any:** country, area, instrument, genre, gender, town/postcode, plus optional gig date, budget, travel distance, and minimum years playing.

**Temporary:** country, area, instrument, genre, gender, town/postcode, gig date, budget, travel distance.

**Permanent:** country, area, instrument, genre, gender, town/postcode, minimum years playing.

Area filter behaviour matches the band directory (geo-detected default country; UK regions seeded in `bandie_regions`).

### Result cards

Display name, primary instrument, location, genres, invite preferences, travel distance, deputy fee guidance (temporary mode), years playing (permanent mode). Link to public player profile.

### Public player profile

Each opted-in musician has a public profile at `/players/:profileId` showing avatar, bio, instruments, gear, genres, location, and invite preferences.

### Behaviour

- Only users with `public_player_profile_enabled` appear in the directory
- `open_to_deputy_invites` and `open_to_member_invites` are independent; a player may opt into deputy gigs, permanent membership, or both
- Each flag controls visibility in the matching search mode; players open to both appear in temporary and permanent searches
- Result cards show all active invite preferences, not just the current search mode
- Profile data edited at `/app/profile`
- Band leaders search from `/app/players` inside the authenticated workspace (defaults to **Any role** unless recruitment context applies)
- **Band-scoped recruitment:** from a lineup part on `/app/:bandId`, **Find players** opens `/app/players?forBand=…&part=…&instrument=…` with filters pre-set to **Permanent member** and the part instrument; player profiles show invite actions (audition / join) when reached from this flow

---

## 4c. Musician / player profile

Each registered user has a musician identity at `/app/profile`, separate from band-specific membership.

### Content

Display name (required, shown ahead of email across the platform), profile photo, gender (optional), primary instrument, all instruments, location, bio, genres, years playing, gear list, gear/setup notes, deputy fee guidance, travel distance, invite preferences, directory visibility toggle.

### Behaviour

- Display name is synced to Supabase auth `user_metadata` on save
- When resolving a user's label, prefer profile display name, then auth metadata, then email local-part
- When both name and email are shown together, display name always appears first
- Avatar uploaded to Supabase Storage (`users/{user_id}/avatar.{ext}`)
- Live preview shows how the profile appears to bandmates and in the directory

---

## 6. Band account, workspace, and membership

### Band creation

A registered user can create a band, becoming band leader. Band receives a private workspace and configurable public profile.

**Band leader invariant:** Every band must always have at least one active leader (`owner` membership role). Bands may assign multiple leaders; `bandie_bands.owner_user_id` points at the primary public contact. If all leaders leave, a Bandie platform admin is assigned as interim leader until a new leader is added.

### Membership

- Users join bands via invitation or approval flow
- On sign-up or login, pending invitations for the user's email are detected automatically
- New users with open invites are routed to `/app/communications` to accept before entering a workspace
- Membership includes musical role(s) and permission role
- Multi-band: user switches between band workspaces via band switcher
- After login, users land on `/app` (My bands) — a card grid of every band they belong to
- All private data scoped to selected band
- Sign-out routes to the marketing homepage (`/`)

### Workspace navigation (implemented)

| Route | Purpose |
|---|---|
| `/app` | My bands hub |
| `/app/communications` | Communications hub (invitations, gig invites, player outreach, booking enquiries, direct messages) |
| `/app/profile` | Musician / player profile editor |
| `/app/players` | Player directory (find members or deps) |
| `/app/invites` | Redirects to `/app/communications` (legacy route) |
| `/app/notifications` | Redirects to `/app/communications` (legacy route) |
| `/app/bands/new` | Create a new band |
| `/app/bands` | Band directory (authenticated workspace view) |
| `/app/venues` | Organiser venues list and editor (organiser workspace mode) |
| `/app/gigs` | Organiser gig list and create (organiser workspace mode) |
| `/app/gigs/:gigId` | Organiser gig detail — eight-step workflow (placeholder → venue → structure → invites → confirm → branding) |
| `/app/:bandId/gigs` | Band gig invitations (all members view; leaders accept/reject) |
| `/app/:bandId/gigs/:gigId` | Band gig invitation detail — setlist assignment (leaders only) |
| `/app/profiles/:profileId/edit` | Admin edit any player profile |
| `/app/:bandId` | Band overview — **Members** tab (lineup, members, invitations) and **Band details** tab (leaders, public profile) |

Top navigation shows My bands, Communications (with unread badge when applicable), My profile, and directory links. **Player** workspace mode adds band-scoped links (Songs, Setlists, Calendar, Gig invites) when a band is selected. **Organiser** workspace mode shows Find bands, **My gigs**, My venues, **Communications**, and My profile.

Band leaders can edit the band's public profile inline on the overview page. Members see a read-only summary. Leaders manage pending invitations; invitee display name is shown ahead of email when the invitee has a Bandie account.

### Band overview (`/app/:bandId`)

The band overview uses two tabs:

#### Members tab

1. **Lineup & band parts** — Leaders define roles (Vocalist, Lead Guitar, Rhythm Guitar, Bass, Drums, or custom). Each part can specify an instrument filter for player search. **Band size** on the public profile is calculated from part count.

2. **Active members** — Cards for approved members with role labels. Leaders (and platform admins in admin mode) use a hamburger menu per card:
   - **Make leader** / **Remove leader** (last leader protected)
   - **Make primary** — sets `owner_user_id` among active leaders (primary public contact)
   - **Assign to part**, **Mark unavailable**, **Remove from band**
   - Admins also see **Edit profile**

3. **Invitations** — Email-based band membership invitations (leaders only).

#### Band details tab

1. **Band leaders** — Lists all leaders with contact details (email, phone). Primary contact badge on `owner_user_id`. Each leader edits their own `contact_email` and `contact_phone`. Every band always has at least one leader.

2. **Public profile editor** — Inline editing of publishable profile (hero, logo, name, palette, availability, bio, set/fee offers, media, booking contact, etc.).

Legacy single-page section order is superseded by this tab layout.

### Player recruitment (leaders)

From each lineup part, **Find players** opens the workspace player directory with query parameters scoped to that band and role:

`/app/players?forBand={bandId}&part={partId}&instrument={filter}&bandName={name}&partTitle={title}`

The directory defaults to **permanent member** search mode and filters by primary instrument when an instrument filter is set.

On a player profile reached from this flow, the leader sees an **Invite** panel:

| Type | Behaviour |
|---|---|
| **Join the band** | Creates a band membership invitation the player can accept from `/app/communications` |
| **Audition** | Records a player outreach invite with an optional message (for follow-up outside Bandie) |

Both flows use the `bandie_create_player_outreach` RPC; join invites also create a row in `bandie_band_invitations`.

### Workspace communications

Player workspace users have a communications hub at `/app/communications` for cross-band interaction.

**Filter views**
- **All** — chronological feed of every invitation and message
- **Invites** — band membership invitations and player outreach (join/audition)
- **Messages** — direct messages with compose, reply, and read status

**Band membership invitations**
- Lists pending email invitations matched to the signed-in user (excludes join invites already shown via player outreach)
- Accept or decline one invitation, or accept all

**Player outreach**
- Join and audition invites sent from the player directory by band leaders
- Shows band name, role/part, optional message, and inviter name
- Accept or decline; join accepts also complete the linked band membership invitation

**Direct messages**
- Send a message to another Bandie user by username
- Received and sent sections with timestamps
- Reply inline to any message in a thread (`reply_to_message_id`)
- Recipients can mark messages as read; unread count included in nav badge

**Sent invites (band leaders)**
- Pending, accepted, and declined join/audition invites sent from the player directory
- Pending and resolved email membership invitations sent from band overview
- Shown in **All** and **Invites** views; revoke available only while pending

**Routing**
- Post-auth and app entry redirect to `/app/communications` when pending invitations or player outreach exist
- `/app/invites` and `/app/notifications` redirect to `/app/communications` for backwards compatibility

Activity feed, band-scoped threads, and email/push notifications are deferred.

### User workspace roles (player / organiser)

At `/app/profile`, users declare how they use Bandie: **player**, **organiser**, or **both**. Users with both roles can switch **workspace mode** (player vs organiser) to show a tailored menu — organiser mode focuses on band directory discovery, **gig planning** (`/app/gigs`), and venue management; player mode shows bands, player directory, and band workspaces.

Organiser-only routes (`/app/venues`, `/app/gigs`, …) are excluded from player band routes (`/app/:bandId/...`). The app redirects organisers away from player band URLs to `/app/bands` when mode switching; `/app/gigs` is treated as an organiser route (not a band workspace).

### Organiser venues

At `/app/venues` (organiser mode), users manage venues they are associated with — pubs, clubs, festival sites and private event spaces. Each venue stores name, type, address, contact details, capacity, notes and an optional photo. Saved venues can be linked when creating or editing gigs at `/app/gigs`.

### Platform admin mode (implemented)

Bandie app admins (`is_app_admin`) can enable **admin mode** from `/app/profile`. When active:
- All bands visible in workspace (not only memberships)
- Admin can edit any player profile at `/app/profiles/:profileId/edit`
- Admin band selector on player directory for cross-band recruitment
- Admin actions on band overview (member profile edit, band management)

Admin mode is a client-side flag (`setBandieAdminModeActive`); RLS still enforces server-side permissions via `bandie_current_user_is_app_admin()`.

### Platform admin portal (implemented)

Bandie app admins (`is_app_admin`) also have a dedicated **`/admin`** portal (separate from in-app admin mode):

- Overview counts (users, bands, songs, setlists, gigs)
- User and band search
- Platform metrics (DAU/WAU/MAU, content totals, tier distribution) with CSV export
- Entitlement admin — **editable plan catalogue** (five plans: **Player Free**, **Player Plus**, **Player Pro**, **Organiser Free**, **Organiser Plus**; plan codes unchanged): select a plan from grouped pills (Player / Organiser), then edit metadata and capabilities in one panel; draft/publish workflow, manual overrides, gate decision logs, enforcement toggle
- Audit log

Plan display names are stored in `bandie_plans.name` and surfaced in upgrade prompts via `PLAN_DISPLAY_NAMES` for known plan codes. Authoritative limits remain in `bandie_plan_entitlements`.

Authoritative spec: `bandie_entitlements_admin_portal_functional_technical_spec.md` §20.2.

### Player subscription tiers (band leader plans)

Limits apply when entitlements are enforced. Band workspace features resolve from the **primary band leader’s** subscription (`plan_scope = leader`). Members on **Player Free** can view band content but cannot create bands, songs, setlists, or uploads on their own account.

| Plan | Code | Summary |
|---|---|---|
| Player Free | `player_free` | Profile + join bands by invite; view songs/setlists — no creates |
| Player Plus | `player_plus` | 1 band; 20 songs and 3 setlists per band; full calendar and song folders |
| Player Pro | `player_pro` | Unlimited bands; 999 songs and 999 setlists per band |

Billing UI at `/app/profile` (Stripe checkout and Customer Portal when configured). See tracker Phase 15.

### Workspace navigation (implemented)

Band workspace nav includes **Songs**, **Setlists**, **Calendar**, and **Gigs** at `/app/:bandId/...`. Create flows are gated via `canPerform()` / `assertCanPerform()` when entitlements are enforced.

---

## 7. Songs and repertoire management

**Mockup:** `bandie_songs_dashboard.html`  
**Song-part files:** `docs/project/bandie_dropbox_song_part_storage_spec.md`

### Storage model (decided)

- **Bandie** stores song metadata, part definitions, file metadata, status, readiness, and activity.
- **Dropbox** stores song-part file bytes only (PDFs, tabs, charts, lyric sheets, images of handwritten notes).
- Each band leader connects their own Dropbox account; one song-parts root folder per band.
- Approved members access files through Bandie — they do not need their own Dropbox account.
- Dropbox is **not** used for setlists, gigs, rehearsals, calendar, booking enquiries, or public profile media.

### Song directory

Table/list of band repertoire with metadata: title, artist, genre, times played, readiness, duration, key, part completeness, dates, notes.

### Search and filter

Title, artist, notes, genre, readiness, key, usage, parts, recently added, most played.

### Dashboard metrics

Total songs, gig-ready count, missing parts, average set duration, songs added this month, repertoire readiness percentage.

### Readiness snapshot

Summary of gig readiness, songs needing parts, blockers for setlists.

### Recent activity

File uploads (logged in `bandie_song_part_file_activity`), setlist changes, new songs, review tasks.

### Readiness (part completeness)

A required part is complete when at least one **current**, **available** file exists for that part. Song file completeness:

```text
required parts with current file / total required parts
```

Feeds into broader song readiness alongside manual status and rehearsal confidence (setlists/gigs link in later phases).

---

## 8b. Dropbox song-part storage integration

**Authoritative spec:** `docs/project/bandie_dropbox_song_part_storage_spec.md`

### Entry points

- Band Settings → Song Part Storage (connect, health, disconnect).
- Song folder → per-part upload and attach actions.

### Dropbox folder pattern

```text
/Bandie/bands/{bandSlug}/song-parts/{songSlug}/{partSlug}
```

Standard part slugs: `guitar`, `bass`, `drums`, `vocals`, `shared` (band-level templates; configurable per band and per song). Lazy-created on first upload (MVP).

### Permissions summary

| Role | Connect Dropbox | Upload | Preview/download | Manage file status / part folders |
|---|---|---|---|---|
| Band leader / admin | Yes | Yes | Yes | Yes |
| Approved member | No | No | Yes | No (view only) |
| Dep / guest | No | Scoped only | Scoped only | No |
| Public / organiser | No | No | No | No |

### Out of scope for Dropbox

Setlists, gigs, rehearsals, calendar, booking enquiries, public band media, general documents, whole-account Dropbox browse.

---

## 8. Song folder / song workspace

**Mockup:** `bandie_song_folder.html`

Per-song workspace containing everything needed to learn, rehearse, and perform.

### Song metadata

Title, artist, genre, arrangement notes, gig notes, readiness, times played, length, keys, status.

### Part folders

Guitar, Bass, Drums, Vocals, Shared — band-level templates for new songs; leaders can add/remove parts per song and mark required vs optional for readiness.

### Files

Upload and attach song-part files through Bandie into the leader’s Dropbox song-parts folder. Bandie stores metadata only.

**MVP allowed types:** PDF, JPEG/PNG/WebP, plain text/markdown, ChordPro (`.cho`, `.crd`, `.chordpro`), Guitar Pro (`.gp`, `.gp3`–`.gpx`). Max 25 MB per file. Video not allowed in MVP.

Metadata in Bandie: name, type, part folder, uploader, date, version label, status (`current` / `draft` / `reference` / `superseded` / `archived` / `unavailable`).

**Leader actions:** connect/reconnect Dropbox, initialise band song-parts root, add songs, soft-delete/restore songs, manage part templates and per-song folders, upload, attach existing Dropbox file (scoped to band root), mark status, remove attachment from Bandie (MVP: does not delete Dropbox file).

**Member actions:** view repertoire, preview PDFs in-app, download through Bandie.

**Soft delete:** Leaders delete songs from the edit modal (`is_deleted`); deleted songs hidden from the dashboard unless “Show deleted songs” is enabled; leaders can restore.

**Health states:** disconnected, needs reconnect, folder missing — songs and setlists remain usable; only file access is affected.

### Versioning

Older versions retained for audit; new uploads do not silently replace history.

### Comments and review tasks

Part approval, missing part flags, arrangement decisions. Major file actions recorded in `bandie_song_part_file_activity`.

---

## 9. Setlist management

**Mockup:** `bandie_setlist_management.html`

### Setlist library

Named setlists with description, status, song count, duration, usage count, last used, vibe, readiness, notes.

### Setlist builder

Search songs, filter gig-ready, add/remove/reorder (drag), live duration and readiness totals, per-song notes, save and duplicate.

### Statuses

Draft, needs rehearsal, needs specific part, gig ready, archived, recently used.

### Vibe tags

Rock, jazz, punk, post-punk, funk, acoustic, high energy, etc.

---

## 10. Calendar and availability

**Status:** Implemented (web MVP) — `/app/:bandId/calendar`  
**Mockup:** `bandie_calendar_mockup.html` (richer monthly grid may follow in polish)

Two modes: **Rehearsal** (internal only) and **Gig availability** (may publish publicly).

### Rehearsal mode

Band leader proposes series (name, dates, repeat pattern, sessions, location, notes). Members vote: available, maybe, no, pending. Never public.

### Gig mode

Band leader proposes availability windows. Members vote. Rules:

- 100% yes → confirmed
- \>50% yes → provisional
- ≤50% yes → proposed

Confirmed and provisional dates may publish to public profile calendar. Proposed dates remain internal.

### Views

Monthly view, event cards, member availability grid, summary counts.

---

## 11. Gig management

**Status:** Implemented (web MVP) — organisers: `/app/gigs`, `/app/gigs/:gigId`; bands: `/app/:bandId/gigs`, `/app/:bandId/gigs/:gigId`

Gigs are **organiser-owned** events. Organisers plan gigs through an eight-step workflow on the gig detail screen. Band leaders **accept or reject** invites and **assign a setlist** from their band library (setlists are created in the setlists screen). All band members can view gig invitations and details.

### Organiser workflow (eight steps)

1. **Create placeholder** — Title and start date/time (`enquiry` status). Optional venue on create or on detail.
2. **Identify venue** — Saved organiser venue or ad hoc name/address; may be combined with step 1.
3. **Design structure** — End time (optional), number of slots, default slot duration (minutes). Moves planning toward `proposed`.
4. **Invite bands** — Open the band directory from the gig detail screen, search profiles, and send invites from the band profile with a preview of gig, venue, and organiser contact details. Optional slot assignment in the invite modal. Band leaders receive a communications notification.
5. **Band responses** — Invited bands accept or reject; organiser sees per-band invite status on the gig.
6. **Running order** — Adjust slot position and slot duration for invited bands; slot schedule preview shows computed start/end per slot.
7. **Confirm gig** — When structure and at least one accepted band are in place, organiser confirms (`confirmed`). **Re-open** returns the gig to `proposed` for further edits.
8. **Band branding** — When `confirmed`, display each accepted band’s profile branding (logo, hero image, tagline) on the organiser gig detail.

### Organiser responsibilities

Create gig placeholder, venue, structure (slots/duration), notes, fee notes. Invite bands and manage running order. Confirm or re-open the gig. Archive or cancel as needed.

### Band leader responsibilities

Respond to pending invites (accept/reject). Assign or change linked setlist after acceptance. View assigned slot number and duration on the invitation detail.

### Gig data

Title, venue (linked record or ad hoc), start/end times, slot count, default slot duration, fee notes, organiser notes, status. Invited bands with running order, optional per-band slot duration, invite status, and linked setlist.

### Statuses

| Status | Meaning |
|---|---|
| `enquiry` | Placeholder created; venue/structure may be incomplete |
| `proposed` | Structure and/or invites in progress; editable |
| `confirmed` | Locked for show day; band branding visible; re-openable |
| `cancelled` | Gig cancelled |
| `completed` | Gig finished |
| `archived` | Removed from active organiser list |

### Invite statuses (per band)

Pending, accepted, rejected, cancelled.

### Context

Show setlist readiness and missing-parts context via linked setlist metrics in band gig detail. Organiser slot preview derives times from gig start, slot order, and durations.

---

## 12. Booking enquiries

### Public (implemented)

Organiser submits structured enquiry from band profile **Book** section: date, time, set duration, venue, budget, notes. Requires sign-in. Creates `bandie_booking_enquiries` record and direct message to band primary contact. Rate limits apply when entitlements are enforced (`booking_enquiry.send`).

### Private (implemented)

Primary contact and sender see enquiries in `/app/communications` → **Booking enquiries** filter. Status: new, read, replied, archived. Reply via message thread.

---

## 13. Notifications and activity

Cross-product updates: new enquiries, availability votes needed, file uploads, review tasks, setlist changes. Activity feed in workspace.

MVP may use in-app activity only; push/email deferred.

---

## 14. Permissions summary

| Content | Access |
|---|---|
| Homepage, directory, public profiles | Public |
| Private workspace, songs, files, setlists, internal calendar | Approved band members only |
| Band settings, member management | Band leader / admin |
| Gigs (create, venue, invites, running order) | Organiser |
| Gig invites (accept/reject, assign setlist) | Band leader |
| Gig invitation details | Band members (view) |
| File upload, availability voting, comments | Members |
| Specific songs/setlists | Guests/deps (scoped) |

---

## 15. Non-functional requirements

- **Usability:** Intuitive for non-technical musicians
- **Responsiveness:** All web pages responsive; mobile app for key member tasks
- **Performance:** Fast search, setlist open, file view, directory filter
- **Security:** Private materials protected by membership and RLS
- **Auditability:** File versions, activity history, who changed what
- **Accessibility:** WCAG AA target; keyboard navigable; 44px touch targets

---

## 16. MVP feature acceptance (summary)

Refer to `bandie_product_description.md` §10 for full MVP list. Homepage acceptance criteria in `bandie_homepage_functional_technical_spec.md` §20.
