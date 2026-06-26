# Bandie — Product Functional Requirements

**Document status:** Authoritative functional requirements  
**Product:** Bandie  
**Last updated:** 26 June 2026

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
| Band owner | Can manage band settings, members, and public profile |
| Guest/Dep | Limited access to specific songs or setlists |
| Platform admin | Operational access via admin portal (future) |

A user may hold different roles in different bands.

---

## 3. Public marketing homepage

**Spec:** `bandie_homepage_functional_technical_spec.md`  
**Mockup:** `bandie_homepage_mockup.html`

### Requirements

- Public, unauthenticated access at `/`
- Explain Bandie proposition to bands and event organisers
- Route bands toward signup/band creation
- Route organisers toward band directory
- Responsive (mobile, tablet, desktop)
- SEO metadata and accessible markup
- Analytics events on CTA clicks (provider-neutral stub acceptable for MVP)
- Static content for MVP; no live band data

### Key sections

Navigation, hero, example band profile card, trust pills, feature cards, audience split (bands vs organisers), how-it-works workflow, final CTA, footer.

---

## 4. Public band profile

**Mockup:** `bandie_skin_condition_homepage.html`

Each band has a public mini-site at `/bands/[slug]`.

### Content

Band name, logo, location, genres, bio, photos, videos, track links, social links, booking contact/enquiry form, fee guidance, band size, set lengths, equipment notes, public availability, ratings/reviews (future).

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

---

## 6. Band account, workspace, and membership

### Band creation

A registered user can create a band, becoming band owner. Band receives a private workspace and configurable public profile.

### Membership

- Users join bands via invitation or approval flow
- Membership includes musical role(s) and permission role
- Multi-band: user switches between band workspaces via band switcher
- All private data scoped to selected band

### Workspace navigation

Songs Dashboard, Setlists, Song Folder, Calendar, Gigs, Members.

Sidebar shows band name, access state ("Approved band member"), band switcher.

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
| Band settings, member management | Band owner / admin |
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
