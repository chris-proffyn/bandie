# Bandie — Product Functional Requirements

**Document status:** Authoritative functional requirements  
**Product:** Bandie  
**Last updated:** 27 June 2026

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
| Band leader | Member who can create gigs, setlists, rehearsals, song folders |
| Band leader | Can manage band settings, members, and public profile |
| Guest/Dep | Limited access to specific songs or setlists |
| Platform admin | Operational access via admin portal (future) |

A user may hold different roles in different bands.

---

## 3. Public marketing homepage

**Spec:** `bandie_homepage_functional_technical_spec.md`  
**Mockup:** `bandie_homepage_mockup.html`

### Requirements

- Public, unauthenticated access at `/`
- Explain Bandie proposition to bands, event organisers and players
- Route bands toward signup/band creation
- Route organisers toward band directory
- Route players toward signup/player profile and the player directory
- Responsive (mobile, tablet, desktop)
- SEO metadata and accessible markup
- Analytics events on CTA clicks (provider-neutral stub acceptable for MVP)
- Static content for MVP; no live band data

### Key sections

Navigation, hero, example band profile card, trust pills, feature cards, audience split (bands, organisers and players), how-it-works workflow, final CTA, footer.

---

## 4. Public band profile

**Mockup:** `bandie_skin_condition_homepage.html`

Each band has a public mini-site at `/bands/[slug]`.

### Content

Band name (with selectable display font), logo at the top of the profile (not in a card), location, genres, bio, photos, videos, track links, social links, booking contact/enquiry form, fee guidance, band size, set lengths, equipment notes, public availability, ratings/reviews (future).

### Layout

- Logo displayed prominently at the top of the profile, followed by the band name
- Logo is not contained in a card; the band name uses the font chosen in profile settings
- Optional hero image may appear above the identity block
- Booking stats (band size, set length, fee guidance) appear below the bio in a separate meta row

### Behaviour

- Only intentionally published content is visible
- Private songs, files, notes, and internal availability are never exposed
- Confirmed/provisional gig availability may appear on public calendar
- Booking enquiry form submits to band's private workspace

---

## 5. Band directory

**Mockup:** `bandie_band_directory_mockup.html`

Public searchable directory at `/bands`.

### Search and filters

Band name, genre, location/area, price range (min/max), minimum rating, availability state.

### Result cards

Band name, genre, location, availability, rating, description, tags, price range, visual identity, link to profile.

### Sorting

Recommended, rating (high→low), price (low→high, high→low), name A–Z.

### Availability states

Available, limited availability, unavailable (derived from internal calendar in later versions; manual/static acceptable early).

### Implemented (June 2026)

- Live at `/bands` with filter panel, sort control, result cards, and empty states
- Rating filter deferred until reviews data exists
- Signed-in users see their display name in the marketing nav when visiting the homepage

### Test data mode

Fictitious bands and players are flagged with `test_user = true` on `bandie_bands` and `bandie_profiles`.

| `VITE_BANDIE_DATA_MODE` | Behaviour |
|---|---|
| `live` (default) | Test rows hidden from band directory, player directory, and public profiles |
| `test` | All published bands and players shown, including 10 seeded test bands and 50 test players |

Real user-created records always have `test_user = false`.

---

## 4b. Player directory

Public searchable directory at `/players` for finding musicians open to deputy or permanent member invitations.

### Search modes

| Mode | Purpose |
|---|---|
| Any | Browse all listed musicians; optional deputy and member filters |
| Temporary (deputy) | Find stand-in musicians for a specific gig |
| Permanent (member) | Find musicians open to joining a band long-term |

### Filters

**Any:** instrument, genre, location, plus optional gig date, budget, travel distance, and minimum years playing.

**Temporary:** instrument, genre, location, gig date, budget, travel distance.

**Permanent:** instrument, genre, location, minimum years playing.

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
- Band leaders search from `/app/players` inside the authenticated workspace (defaults to permanent member mode)

---

## 4c. Musician / player profile

Each registered user has a musician identity at `/app/profile`, separate from band-specific membership.

### Content

Display name (required, shown ahead of email across the platform), profile photo, primary instrument, all instruments, location, bio, genres, years playing, gear list, gear/setup notes, deputy fee guidance, travel distance, invite preferences, directory visibility toggle.

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

### Membership

- Users join bands via invitation or approval flow
- On sign-up or login, pending invitations for the user's email are detected automatically
- New users with open invites are routed to `/app/invites` to accept before entering a workspace
- Membership includes musical role(s) and permission role
- Multi-band: user switches between band workspaces via band switcher
- After login, users land on `/app` (My bands) — a card grid of every band they belong to
- All private data scoped to selected band
- Sign-out routes to the marketing homepage (`/`)

### Workspace navigation (implemented)

| Route | Purpose |
|---|---|
| `/app` | My bands hub |
| `/app/profile` | Musician / player profile editor |
| `/app/players` | Player directory (find members or deps) |
| `/app/invites` | Pending band invitations |
| `/app/bands/new` | Create a new band |
| `/app/:bandId` | Band overview (public profile editor, members, invitations) |

Sidebar shows band switcher, navigation links, user display name (link to profile), email, and sign-out.

Band leaders can edit the band's public profile inline on the overview page. Members see a read-only summary. Leaders manage pending invitations; invitee display name is shown ahead of email when the invitee has a Bandie account.

### Workspace navigation (planned)

Songs Dashboard, Setlists, Song Folder, Calendar, Gigs — deferred to later phases.

---

## 7. Songs and repertoire management

**Mockup:** `bandie_songs_dashboard.html`

### Song directory

Table/list of band repertoire with metadata: title, artist, genre, times played, readiness, duration, key, part completeness, dates, notes.

### Search and filter

Title, artist, notes, genre, readiness, key, usage, parts, recently added, most played.

### Dashboard metrics

Total songs, gig-ready count, missing parts, average set duration, songs added this month, repertoire readiness percentage.

### Readiness snapshot

Summary of gig readiness, songs needing parts, blockers for setlists.

### Recent activity

File uploads, setlist changes, new songs, review tasks.

---

## 8. Song folder / song workspace

**Mockup:** `bandie_song_folder.html`

Per-song workspace containing everything needed to learn, rehearse, and perform.

### Song metadata

Title, artist, genre, arrangement notes, gig notes, readiness, times played, length, keys, status.

### Part folders

Lead Guitar, Rhythm Guitar, Bass, Drums, Vocals, Shared — plus configurable additional folders (keys, brass, etc.).

### Files

Upload PDF, images, audio, Guitar Pro, ChordPro, DOCX, text/lyrics. Metadata: name, type, folder, uploader, date, version, status (current/draft/reference/archived/superseded).

### Versioning

Older versions retained for audit; new uploads do not silently replace history.

### Comments and review tasks

Part approval, missing part flags, arrangement decisions.

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

**Mockup:** `bandie_calendar_mockup.html`

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

Dedicated area for actual performance events (not just availability proposals).

### Gig data

Name, venue, address, date/times (load-in, soundcheck, performance), set length, sets, fee, deposit, organiser contact, visibility, notes, equipment, linked setlist, member availability, status.

### Statuses

Enquiry, proposed, provisional, confirmed, cancelled, completed, archived.

### Context

Show setlist readiness, missing parts, member confirmation in gig context.

---

## 12. Booking enquiries

### Public

Organiser submits enquiry from band profile: name, contact, event date, type, location, budget, message.

### Private

Band receives enquiry in workspace; manage status and response (messaging deferred post-MVP).

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
| Gigs, setlists, rehearsals creation | Band leader and above |
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
