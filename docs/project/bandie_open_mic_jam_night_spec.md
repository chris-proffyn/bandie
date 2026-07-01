# Bandie Open Mic / Jam Night Feature Specification

**Document status:** Draft functional and technical specification  
**Product:** Bandie  
**Feature area:** Organiser tools / Open Mic & Jam Night Management  
**Intended use:** Source material for Cursor implementation of web and mobile views  
**Last updated:** 27 June 2026 (Jam night vs open mic differentiation)

---

## 1. Executive Summary

The Open Mic / Jam Night feature extends Bandie beyond band discovery and private band management into organiser-led live music operations. It gives event organisers, venues, pub landlords and community music hosts a structured way to create, promote, manage and run open mic or jam nights.

The core idea is simple: an organiser creates an event, builds a song list, defines the instruments needed for each song, allows players to sign up for songs and parts, then manages the running order live during the evening. The feature should also connect to Bandie’s existing song and song-folder capabilities so that song parts, charts, lyrics, chord sheets and reference files can be uploaded, shared and reused.

This should feel like a live event control room, not a generic spreadsheet. The organiser needs to know:

- What songs are on tonight’s list?
- Which parts are still empty?
- Who has signed up?
- What is currently playing?
- What is next?
- Which songs are ready enough to run?
- What needs to move in the running order?
- Which song files or parts should players see?

---

## 2. Product Context

Bandie already contains the foundations this feature should reuse:

- Public band/profile promotion and poster-style pages.
- Organiser-facing discovery and booking concepts.
- Private song and repertoire management.
- Song folders with part-specific resources.
- Setlist and running-order management.
- Calendar and availability concepts.
- Mobile/performance-friendly views.
- Permissions, file storage, notifications and audit foundations.

The Open Mic / Jam Night feature should become a new organiser-facing product area while reusing the platform primitives already being designed for bands: songs, parts, files, users, events, running orders and public pages.

---

## 3. Goals

### 3.1 Product Goals

1. Help organisers create and promote recurring open mic or jam nights.
2. Replace paper sign-up sheets, WhatsApp lists and ad hoc spreadsheets with a structured live event workspace.
3. Allow musicians to sign up for songs and specific instrument slots before or during the event.
4. Give organisers a live running order that can be changed quickly during the night.
5. Track readiness and progress so the event can run smoothly.
6. Connect open mic events to Bandie’s song folder and part-sharing capability.
7. Create an additional reason for organisers and individual players to join Bandie.

### 3.2 MVP Goals

The MVP should support:

- Create open mic / jam event.
- Generate a public event page and printable/shareable poster.
- Create song list manually.
- Add required instruments per song.
- Allow organiser assignment of players to song parts.
- Allow player sign-up to song parts via public or semi-public event page.
- Show readiness state per song.
- Show live running order.
- Reorder songs during the event.
- Track event progress: queued, called, playing, completed, skipped.
- Attach or link files per song/part.

### 3.3 Non-Goals for MVP

The MVP should not initially attempt to solve:

- Ticketing or paid entry.
- Full musician marketplace matching.
- Rights/licensing management beyond basic file/content warnings.
- Audio backing track playback.
- Complex rotation/fairness algorithms.
- Real-time multi-camera stage display.
- Automated royalty reporting.
- AI-generated song charts.

---

## 4. User Types and Roles

### 4.1 Organiser

The person or organisation running the open mic/jam night. This may be a venue, promoter, house-band leader or community host.

Capabilities:

- Create and edit open mic events.
- Create promotional poster/page.
- Create and manage song list.
- Define instrument slots.
- Approve or reject player sign-ups where moderation is enabled.
- Assign players manually.
- Lock slots.
- Reorder the live running order.
- Mark songs as called, playing, complete, skipped or cancelled.
- Upload or attach song resources.

### 4.2 Event Host / Stage Manager

A delegated organiser role used during the night.

Capabilities:

- View and operate live running order.
- Move songs up/down.
- Mark current progress.
- Call next players.
- Add walk-up players.
- Make quick edits to assignments.

May not necessarily edit event branding, billing, venue settings or organiser account details.

### 4.3 Player

A musician who wants to take part.

Capabilities:

- View public event page.
- View song list, depending on visibility settings.
- Sign up for available song/instrument slots.
- Add profile details: name, instrument, experience level, notes.
- View assigned songs.
- Access shared song resources if permitted.
- Cancel their sign-up before a configurable cut-off.

### 4.4 House Band Member

A player associated with the organiser or resident band. They can be pre-assigned to support songs.

Capabilities:

- Be defaulted into certain instrument slots.
- Fill empty slots.
- Access internal notes/resources.
- Be marked as fallback for instruments.

### 4.5 Public Viewer

Someone viewing the public event page/poster.

Capabilities:

- See event details.
- See how to attend.
- See sign-up link/QR code.
- Optionally see song list if organiser makes it public.

---

## 5. Core Concepts

### 5.1 Open Mic / Jam Event

A scheduled live event created by an organiser.

Key attributes:

- Event name.
- Event type: `open_mic`, `jam_night`, `songbook_jam`, `house_band_guest_night`.
- Date and time.
- Venue and address.
- Description.
- Host/organiser.
- Sign-up policy.
- Public visibility.
- Poster/public page settings.
- Song list.
- Running order.
- Live status.

### 5.2 Song

A song can be:

1. Created directly inside the open mic event.
2. Imported from an organiser library.
3. Imported from a connected band song list.
4. Copied from a previous open mic event.

Song attributes:

- Title.
- Artist.
- Key.
- Duration.
- Genre/style.
- Tempo/BPM.
- Notes.
- Difficulty.
- Status.
- Required instruments.
- Linked files/resources.

### 5.3 Instrument Slot

A role needed for a song.

Examples:

- Lead vocal.
- Backing vocal.
- Lead guitar.
- Rhythm guitar.
- Bass.
- Drums.
- Keys.
- Sax.
- Harmonica.
- Percussion.
- Any instrument.

Slot attributes:

- Instrument/role name.
- Required/optional.
- Minimum players.
- Maximum players.
- Assigned player(s).
- Slot status: open, requested, approved, filled, locked, withdrawn.
- Visibility.
- Notes, such as “capo 2”, “simple rhythm part”, “solo section”.

### 5.4 Running Order

The live sequence of songs for the evening.

Running-order features:

- Drag/drop ordering.
- Move up/down.
- Send to top.
- Move after current song.
- Skip.
- Mark as encore.
- Add ad hoc song.
- Insert break.
- Mark current song.
- Estimate end time from durations.

### 5.5 Readiness

A song’s readiness for the event based on filled slots and organiser judgement.

Suggested readiness states:

- Draft: song added, not yet prepared.
- Needs players: one or more required slots empty.
- Pending approval: players signed up but organiser has not approved.
- Ready: required slots filled.
- Locked: ready and no further sign-ups allowed.
- Problem: organiser has flagged an issue.

Readiness should not be over-engineered in MVP. A simple calculated state plus organiser override is sufficient.

---

## 6. Functional Specification

## 6.1 Event Creation

### 6.1.1 Create Event Flow

The organiser selects **Create Open Mic / Jam Night** from the organiser workspace.

Required fields:

- Event name.
- Event type.
- Date.
- Start time.
- End time or approximate duration.
- Venue name.
- Location/address.
- Public/private visibility.

Optional fields:

- Event description.
- Host name.
- House band name.
- Event image/logo.
- Entry price.
- Age restrictions.
- Equipment provided.
- Backline notes.
- Sign-up opening date/time.
- Sign-up closing date/time.
- Max songs per player.
- Max slots per player.

### 6.1.2 Event States

Events should support:

- Draft.
- Published.
- Sign-up open.
- Sign-up closed.
- In progress.
- Completed.
- Cancelled.
- Archived.

### 6.1.3 Recurring Events

MVP can support event duplication rather than full recurrence.

Post-MVP:

- Weekly/monthly recurrence.
- Reuse default songbook.
- Reuse venue and poster template.
- Create next event from previous event.

---

## 6.2 Promotional Poster and Public Event Page

### 6.2.1 Poster Generator

The organiser can generate a poster from event details.

Inputs:

- Event title.
- Venue.
- Date.
- Time.
- Short description.
- Host/house band.
- Entry price.
- Sign-up URL.
- QR code.
- Logo/image.
- Theme/style.

Outputs:

- Public event page.
- Printable A4 poster.
- Social square image.
- Story/reel portrait image.
- Downloadable PNG/PDF, where supported.

### 6.2.2 Poster Templates

MVP should provide a small set of templates:

- Pub open mic.
- Blues jam.
- Rock jam.
- Acoustic night.
- Community music night.

Each template should use Bandie’s existing bold music-oriented visual direction: dark backgrounds, strong typography, bright accents and QR-driven calls to action.

### 6.2.3 Public Event Page

The public event page should include:

- Event name.
- Venue/location.
- Date/time.
- Description.
- Host/organiser.
- Sign-up CTA.
- QR/share link.
- Song list visibility controlled by organiser.
- Player sign-up form.
- Basic attendance information.

Visibility settings:

- Public page visible to anyone with link.
- Listed in public Bandie event directory, post-MVP.
- Private/unlisted page for invite-only events.

---

## 6.3 Song List Management

### 6.3.1 Create Song List

The organiser can add songs to an event.

Add methods:

- Manual add.
- Import from CSV.
- Duplicate from previous event.
- Import from organiser song library.
- Import from a Bandie band song list, where permission exists.

Required song fields:

- Title.
- Artist.

Optional song fields:

- Key.
- Duration.
- BPM.
- Genre.
- Difficulty.
- Notes.
- Reference link.

### 6.3.2 Song List Table

The organiser view should show:

- Running order number.
- Song title/artist.
- Key.
- Duration.
- Required slots.
- Filled slots.
- Readiness status.
- Assigned players.
- Files available.
- Actions.

Actions:

- Edit song.
- Duplicate song.
- Remove from event.
- Add slot.
- Attach file/resource.
- Lock sign-up.
- Move in order.

### 6.3.3 Bulk Actions

MVP:

- Import songs.
- Duplicate selected songs.
- Delete selected songs.
- Lock selected songs.

Post-MVP:

- Bulk add default instrument template.
- Bulk set key/duration.
- Bulk publish/unpublish to public sign-up page.

---

## 6.4 Instrument and Part Management

### 6.4.1 Instrument Templates

Organisers should be able to apply predefined slot templates.

Examples:

**Standard rock band**

- Lead vocal.
- Lead guitar.
- Rhythm guitar.
- Bass.
- Drums.

**Acoustic night**

- Vocal.
- Guitar.
- Optional backing vocal.
- Optional percussion.

**Blues jam**

- Vocal.
- Guitar 1.
- Guitar 2.
- Bass.
- Drums.
- Harmonica/keys optional.

### 6.4.2 Custom Slots

The organiser can add, rename and remove slots for each song.

Rules:

- Required slots count toward readiness.
- Optional slots do not block readiness.
- Slots can allow one or multiple players.
- Slots can be hidden from public sign-up if filled by house band.

### 6.4.3 Slot Status

Statuses:

- Open.
- Requested.
- Approved.
- Filled.
- Locked.
- Withdrawn.
- No longer required.

---

## 6.5 Player Sign-Up

### 6.5.1 Sign-Up Modes

Organiser-configurable modes:

1. **Open sign-up:** anyone with the link can choose an available slot.
2. **Moderated sign-up:** players request slots; organiser approves.
3. **Invite-only:** only invited players can sign up.
4. **Organiser assignment only:** no public sign-up; organiser fills slots manually.

### 6.5.2 Player Sign-Up Form

Fields:

- Name.
- Email or phone, depending on organiser requirements.
- Instrument(s).
- Song slot requested.
- Notes to organiser.
- Optional Bandie profile link.

For logged-in Bandie users:

- Pre-fill name and instruments.
- Save sign-up history.
- Show personal schedule for the event.

For guest users:

- Allow low-friction sign-up.
- Verify by email magic link or one-time code where needed.

### 6.5.3 Player View

A player should see:

- Event details.
- Songs open for sign-up.
- Available slots.
- Their requested/confirmed songs.
- Notes/files for confirmed songs.
- Cancellation option if enabled.

### 6.5.4 Sign-Up Constraints

Configurable constraints:

- Max songs per player.
- Max slots per song per player.
- Cut-off time.
- Require organiser approval.
- Prevent duplicate sign-ups for same song.
- Allow waitlist if slot is filled.

---

## 6.6 Assignment and Approval Workflow

### 6.6.1 Organiser Assignment

The organiser can:

- Assign existing Bandie users.
- Add guest players manually.
- Approve requested slots.
- Reject requests.
- Move a player between slots.
- Add backup players.
- Lock a player assignment.

### 6.6.2 Player Request Review

Moderated sign-up queue should show:

- Player name.
- Instrument.
- Requested song/slot.
- Time requested.
- Notes.
- Conflict warnings.
- Approve/reject buttons.

### 6.6.3 Conflict Warnings

Warn organiser when:

- Player is assigned to too many songs.
- Required slot is empty.
- Same player is assigned to overlapping back-to-back songs where instrument change may be difficult.
- A song is marked ready but has no vocalist.
- A player has withdrawn from a locked song.

---

## 6.7 Live Night Control Room

### 6.7.1 Live Dashboard

The live event view should be optimised for fast use on tablet/laptop/mobile.

Core panels:

1. **Now Playing**
   - Current song.
   - Assigned players.
   - Key/duration.
   - Notes.
   - Start timer.
   - Complete/skip buttons.

2. **Up Next**
   - Next 3–5 songs.
   - Player names.
   - Readiness warnings.
   - Call players button.

3. **Running Order**
   - Full song list.
   - Drag/drop reorder.
   - Status indicators.
   - Filled/empty slot counts.

4. **Issues**
   - Empty required slots.
   - Player withdrawals.
   - Songs not ready.
   - Songs running late.

5. **Walk-Up Add**
   - Quickly add player.
   - Quickly add song.
   - Assign to current/next/later slot.

### 6.7.2 Progress States

Each event song can move through:

- Queued.
- Called.
- On deck.
- Playing.
- Completed.
- Skipped.
- Cancelled.

### 6.7.3 Running Order Editing During Event

Allowed live actions:

- Drag/drop song order.
- Move to next.
- Move later.
- Skip song.
- Reinstate skipped song.
- Add break.
- Add ad hoc song.
- Swap songs.
- Lock current order.

### 6.7.4 Stage Display / Public Screen

Post-MVP but design data model now:

- Display now/next song.
- Player names.
- Simple QR code for sign-up.
- Hide private notes.
- Stage-friendly high contrast.

---

## 6.8 Song Resources and Band Song List Integration

### 6.8.1 Attach Files to Event Songs

Files can be attached at:

- Song level.
- Instrument slot level.
- Player assignment level.

Supported MVP file types:

- PDF.
- Image.
- Text/Markdown.
- Audio reference link.
- External URL.

Possible later file types:

- ChordPro.
- Guitar Pro.
- MIDI.
- MusicXML.
- Video references.

### 6.8.2 Integration with Band Song Folders

Where an organiser also manages a Bandie band or has permission from a band, they can:

- Import songs from the band song list.
- Import instrument slots from the band’s standard part folders.
- Link to existing files rather than duplicate them.
- Copy song files into an organiser event library.
- Restrict access to selected files for event players.

### 6.8.3 File Visibility Rules

Visibility options:

- Organiser only.
- Assigned players only.
- All signed-up players.
- Anyone with event link.
- Band members only.

Default should be restrictive:

- Uploaded files default to organiser and assigned players only.
- Public access must be explicitly enabled.

### 6.8.4 Copyright and Content Warning

When uploading lyrics, charts or third-party song materials, show a simple content responsibility warning:

- The uploader confirms they have permission to upload/share.
- Bandie may remove content if reported.
- Public sharing of copyrighted files should be discouraged in MVP.

---

## 6.9 Notifications

MVP notification triggers:

- Player signs up.
- Player cancels sign-up.
- Organiser approves/rejects request.
- Assignment changes.
- Song moved in running order.
- Sign-up closes soon.
- Event starts soon.

Channels:

- In-app notifications.
- Email.
- Push notification, post-MVP/mobile.

---

## 6.10 Search and Filtering

Organiser song list filters:

- Song title.
- Artist.
- Readiness.
- Empty slots.
- Player.
- Instrument.
- Genre.
- Status.

Player sign-up filters:

- Instrument.
- Open slots only.
- Difficulty.
- Genre.
- Key.

---

## 6.11 Analytics and Reporting

MVP event summary:

- Number of songs planned.
- Number of songs played.
- Number skipped.
- Number of players.
- Average songs per player.
- Most popular songs.
- Empty slots at start time.
- Late changes count.

Post-MVP:

- Repeat player retention.
- Song popularity across events.
- Venue attendance notes.
- Event performance trend.

---

## 7. User Journeys

## 7.1 Organiser Creates and Publishes an Open Mic Night

1. Organiser logs in.
2. Opens Organiser Workspace.
3. Clicks **Create Open Mic / Jam Night**.
4. Adds event name, date, time, venue and description.
5. Chooses sign-up mode.
6. Generates poster/public page.
7. Publishes event.
8. Shares link/QR code on social, venue page and printed posters.

## 7.2 Organiser Builds the Song List

1. Opens event workspace.
2. Adds songs manually or imports from previous event/band song list.
3. Applies instrument template to each song.
4. Adjusts custom slots.
5. Adds keys, durations and notes.
6. Attaches resources.
7. Publishes song sign-up list.

## 7.3 Player Signs Up

1. Player scans QR code or opens link.
2. Views event page.
3. Opens song list.
4. Filters by instrument.
5. Selects an open slot.
6. Adds name/contact details.
7. Submits sign-up.
8. Receives confirmation or pending approval notice.

## 7.4 Organiser Runs the Night

1. Opens live dashboard.
2. Reviews readiness and unresolved gaps.
3. Starts the event.
4. Marks first song as playing.
5. Moves songs as needed.
6. Adds walk-up players.
7. Marks songs complete/skipped.
8. Ends event.
9. Reviews summary and duplicates template for next event.

---

## 8. Information Architecture

### 8.1 New Organiser Workspace Navigation

- Organiser Dashboard.
- Events.
  - Open Mic / Jam Nights.
  - Booked Bands.
  - Venue Calendar.
- Open Mic Library.
  - Songs.
  - Instrument Templates.
  - Player Directory.
- Posters / Promotion.
- Settings.

### 8.2 Open Mic Event Pages

Private organiser pages:

- Event Overview.
- Poster/Public Page.
- Song List.
- Player Sign-Ups.
- Running Order.
- Live Control Room.
- Files/Resources.
- Event Summary.

Public/player pages:

- Public Event Page.
- Sign-Up Page.
- Song List.
- My Songs.
- Shared Resources.

---

## 9. Permissions

### 9.1 Roles

- Platform Admin.
- Organiser Owner.
- Organiser Admin.
- Event Host.
- House Band Member.
- Player.
- Guest Player.
- Public Viewer.

### 9.2 Permission Matrix

| Capability | Organiser Owner | Organiser Admin | Event Host | House Band | Player | Guest | Public |
|---|---:|---:|---:|---:|---:|---:|---:|
| Create event | Yes | Yes | No | No | No | No | No |
| Edit event details | Yes | Yes | Limited | No | No | No | No |
| Publish event | Yes | Yes | No | No | No | No | No |
| Generate poster | Yes | Yes | No | No | No | No | No |
| Add/edit songs | Yes | Yes | Yes | Optional | No | No | No |
| Add/edit slots | Yes | Yes | Yes | Optional | No | No | No |
| Sign up for slot | Optional | Optional | Optional | Yes | Yes | Yes | No |
| Approve sign-ups | Yes | Yes | Yes | No | No | No | No |
| Reorder live list | Yes | Yes | Yes | No | No | No | No |
| Mark progress | Yes | Yes | Yes | No | No | No | No |
| Upload files | Yes | Yes | Yes | Optional | Optional | Optional | No |
| View assigned resources | Yes | Yes | Yes | Yes | Yes | Yes if permitted | No |

---

## 10. Data Model

Use the existing Bandie prefix convention for project-specific tables, e.g. `bandie_open_mic_events`.

### 10.1 Core Tables

#### `bandie_organisers`

Stores organiser entities.

Fields:

- `id` uuid primary key.
- `name` text.
- `slug` text unique.
- `description` text.
- `owner_user_id` uuid.
- `default_location` text.
- `created_at` timestamp.
- `updated_at` timestamp.

#### `bandie_organiser_members`

Maps users to organiser accounts.

Fields:

- `id` uuid.
- `organiser_id` uuid.
- `user_id` uuid.
- `role` enum: owner, admin, host, house_band_member.
- `status` enum: invited, active, removed.
- `created_at` timestamp.

#### `bandie_open_mic_events`

Main event table.

Fields:

- `id` uuid.
- `organiser_id` uuid.
- `title` text.
- `slug` text.
- `event_type` enum.
- `status` enum.
- `visibility` enum: public, unlisted, private.
- `venue_name` text.
- `address` text.
- `starts_at` timestamptz.
- `ends_at` timestamptz.
- `timezone` text.
- `description` text.
- `poster_template_id` uuid nullable.
- `signup_mode` enum.
- `signup_opens_at` timestamptz nullable.
- `signup_closes_at` timestamptz nullable.
- `max_songs_per_player` int nullable.
- `max_slots_per_player` int nullable.
- `public_song_list_enabled` boolean.
- `created_by` uuid.
- `created_at` timestamp.
- `updated_at` timestamp.

#### `bandie_open_mic_songs`

Event-specific songs.

Fields:

- `id` uuid.
- `event_id` uuid.
- `source_song_id` uuid nullable.
- `source_type` enum: manual, organiser_library, band_song, previous_event.
- `title` text.
- `artist` text.
- `key` text nullable.
- `duration_seconds` int nullable.
- `bpm` int nullable.
- `genre` text nullable.
- `difficulty` enum nullable.
- `notes` text nullable.
- `readiness_status` enum.
- `readiness_override` enum nullable.
- `sort_order` int.
- `live_status` enum.
- `created_at` timestamp.
- `updated_at` timestamp.

#### `bandie_open_mic_song_slots`

Instrument/role slots for each song.

Fields:

- `id` uuid.
- `event_song_id` uuid.
- `instrument_id` uuid nullable.
- `slot_name` text.
- `required` boolean.
- `min_players` int default 1.
- `max_players` int default 1.
- `status` enum.
- `public_signup_enabled` boolean.
- `notes` text nullable.
- `sort_order` int.

#### `bandie_open_mic_players`

Players for an event, including guest players.

Fields:

- `id` uuid.
- `event_id` uuid.
- `user_id` uuid nullable.
- `display_name` text.
- `email` text nullable.
- `phone` text nullable.
- `primary_instrument` text nullable.
- `profile_notes` text nullable.
- `is_guest` boolean.
- `created_at` timestamp.

#### `bandie_open_mic_assignments`

Player assignments/requested sign-ups to slots.

Fields:

- `id` uuid.
- `event_id` uuid.
- `event_song_id` uuid.
- `song_slot_id` uuid.
- `player_id` uuid.
- `status` enum: requested, approved, rejected, cancelled, withdrawn, backup.
- `assigned_by` uuid nullable.
- `request_note` text nullable.
- `organiser_note` text nullable.
- `created_at` timestamp.
- `updated_at` timestamp.

#### `bandie_open_mic_event_files`

Resources attached to events, songs or slots.

Fields:

- `id` uuid.
- `event_id` uuid.
- `event_song_id` uuid nullable.
- `song_slot_id` uuid nullable.
- `assignment_id` uuid nullable.
- `source_file_id` uuid nullable.
- `storage_path` text nullable.
- `external_url` text nullable.
- `title` text.
- `file_type` text.
- `visibility` enum.
- `uploaded_by` uuid.
- `created_at` timestamp.

#### `bandie_open_mic_activity_log`

Audit trail.

Fields:

- `id` uuid.
- `event_id` uuid.
- `actor_user_id` uuid nullable.
- `actor_label` text nullable.
- `action_type` text.
- `entity_type` text.
- `entity_id` uuid.
- `before` jsonb nullable.
- `after` jsonb nullable.
- `created_at` timestamp.

---

## 11. Technical Architecture

### 11.1 Frontend

Recommended stack consistent with Bandie prototypes:

- React / Vite web app.
- Supabase client for auth/data/storage.
- Responsive web-first views.
- Mobile-friendly live control room.
- Later React Native mobile views may reuse API/data model.

### 11.2 Backend

- Supabase Postgres.
- Row Level Security for organiser/event/player permissions.
- Supabase Storage for uploaded files.
- Edge Functions for poster generation, QR generation, notifications and secure guest actions.
- Realtime subscriptions for live event updates.

### 11.3 Realtime

Live control room should use realtime updates for:

- Song status changes.
- Running order changes.
- New sign-ups.
- Withdrawals.
- Assignment changes.

Realtime should be scoped to event participants and organisers only.

### 11.4 Poster Generation

MVP options:

1. Client-side HTML/CSS poster preview with browser print/download.
2. Server-side image/PDF generation using an Edge Function and headless rendering, post-MVP if needed.

MVP recommendation:

- Build poster as responsive HTML/CSS component.
- Include print stylesheet for A4.
- Add QR code generated from public event URL.
- Add export later.

### 11.5 File Storage

Storage bucket proposal:

- `bandie-open-mic-files`.

Path pattern:

`organisers/{organiser_id}/events/{event_id}/songs/{event_song_id}/slots/{slot_id}/{file_id}-{filename}`

Access:

- Signed URLs for private files.
- Public URLs only for explicitly public promotional assets.
- RLS checks before creating signed URLs.

---

## 12. API / Service Layer

### 12.1 Event Services

- `createOpenMicEvent(payload)`
- `updateOpenMicEvent(eventId, payload)`
- `publishOpenMicEvent(eventId)`
- `cancelOpenMicEvent(eventId)`
- `duplicateOpenMicEvent(eventId)`
- `getOpenMicEvent(eventIdOrSlug)`

### 12.2 Song Services

- `addEventSong(eventId, payload)`
- `updateEventSong(songId, payload)`
- `deleteEventSong(songId)`
- `reorderEventSongs(eventId, orderedSongIds)`
- `importSongsFromBand(eventId, bandId, songIds)`
- `importSongsFromPreviousEvent(eventId, sourceEventId)`

### 12.3 Slot Services

- `addSongSlot(eventSongId, payload)`
- `updateSongSlot(slotId, payload)`
- `deleteSongSlot(slotId)`
- `applyInstrumentTemplate(eventSongId, templateId)`

### 12.4 Sign-Up Services

- `createPlayerSignup(eventId, payload)`
- `requestSlot(eventId, slotId, playerPayload)`
- `approveAssignment(assignmentId)`
- `rejectAssignment(assignmentId, reason)`
- `cancelAssignment(assignmentId)`
- `assignPlayerToSlot(slotId, playerId)`

### 12.5 Live Services

- `startEvent(eventId)`
- `setCurrentSong(eventSongId)`
- `updateSongLiveStatus(eventSongId, status)`
- `skipSong(eventSongId)`
- `completeSong(eventSongId)`
- `insertBreak(eventId, position)`
- `addWalkUpPlayer(eventId, payload)`

### 12.6 File Services

- `uploadEventFile(eventId, scope, file)`
- `linkExistingSongFile(eventId, sourceFileId, visibility)`
- `getAvailableResources(eventId, viewerContext)`
- `updateFileVisibility(fileId, visibility)`

---

## 13. Row Level Security Rules

### 13.1 Organiser Access

Users can read organiser-private data if they are active members of the organiser account.

Users can mutate organiser data if their role allows it.

### 13.2 Public Event Access

Public users can read published event fields where:

- `visibility = public` or `visibility = unlisted` and they have the slug.
- Only fields approved for public page are exposed.

### 13.3 Player Access

Players can read:

- Public event details.
- Their own assignments.
- Resources visible to their assignment or all signed-up players.

Players can update:

- Their own guest/player details.
- Their own sign-up requests, subject to event policy.

### 13.4 File Access

Files are never assumed public.

Access is granted based on:

- Organiser membership.
- Event host role.
- Assigned player relationship.
- Explicit file visibility setting.

---

## 14. UI Requirements

## 14.1 Organiser Event Dashboard

Top summary cards:

- Event status.
- Songs planned.
- Ready songs.
- Empty required slots.
- Player sign-ups.
- Time until event.

Primary actions:

- Publish event.
- Create poster.
- Open sign-up page.
- Manage songs.
- Launch live mode.

## 14.2 Song List Builder

Layout:

- Left/main: song table.
- Right side panel: selected song details.
- Top actions: add song, import, apply template, publish sign-up.

Important UI behaviours:

- Inline editing for key/duration/status.
- Slot chips under each song.
- Empty required slots highlighted.
- Drag handle for order.
- Search/filter controls.

## 14.3 Player Sign-Up Page

Mobile-first.

Views:

- Event header.
- Filter by instrument.
- Song cards.
- Slot buttons.
- My sign-ups.

Song card should show:

- Title/artist.
- Key/duration if public.
- Available slots.
- Filled slots.
- Sign-up CTA.

## 14.4 Live Control Room

Must be usable in a noisy pub on a tablet.

Design:

- High contrast.
- Large tap targets.
- Minimal modal use.
- Fast reorder.
- Clear now/next sections.
- Warning badges.

---

## 15. Validation Rules

- Event cannot be published without title, date/time and venue.
- Public sign-up cannot open unless event is published.
- A player cannot occupy the same single-capacity slot twice.
- Required slot with no approved assignment marks song as not ready.
- Running order values must be unique per event.
- Only authorised organiser roles can change live status.
- Files must have a visibility setting.
- Guest sign-up must include at least display name and one contact method if organiser requires contact capture.

---

## 16. Edge Cases

- Player signs up, then withdraws during event.
- Organiser changes song key after players sign up.
- Multiple players request the same slot.
- Song is removed after players signed up.
- Event is cancelled after sign-ups.
- Public event page viewed after event completed.
- Poor connectivity during event.
- Duplicate guest names.
- Imported band file should not become public accidentally.
- Realtime order conflicts if two hosts reorder simultaneously.

Recommended handling:

- Preserve activity log.
- Soft-delete where possible.
- Show conflict warning and last-updated timestamp.
- Allow manual override by organiser.

---

## 17. MVP Release Scope

### Release 1: Event Setup and Promotion

- Create organiser account.
- Create open mic event.
- Publish public event page.
- Generate HTML/CSS poster with QR.
- Duplicate event.

### Release 2: Song List and Player Sign-Up

- Add/manage songs.
- Add instrument slots.
- Apply templates.
- Public sign-up.
- Moderated approval.
- Player view of assignments.

### Release 3: Live Running Order

- Live control room.
- Reorder songs.
- Mark progress.
- Add walk-up players.
- Event summary.

### Release 4: Song Resources Integration

- Upload event resources.
- Link to Bandie song folders.
- File visibility controls.
- Assigned-player access.

---

## 18. Future Enhancements

- Event directory for local open mic nights.
- Player profiles and reputation.
- Fair rotation suggestions.
- Waitlist automation.
- House band defaults.
- Stage display mode.
- Offline live mode.
- Push notifications.
- Calendar integration.
- Recurring event automation.
- Suggested songs based on player availability.
- Audio/video capture links after event.
- Venue analytics.
- Tip jar/payment integration.

---

## 19. Resolved product decisions

**Confirmed 30 June 2026** — authoritative for Phase 17 implementation.

| # | Question | **Decision** |
|---|---|---|
| 1 | Paid account required? | **Yes — Organiser Plus (paid organiser plan) required.** Organiser Free cannot create open mic events. Gate on **create** (same monetisation rule as #2). |
| 2 | When does entitlement gate apply? | **On create** — aligns with #1; no draft events on Organiser Free. |
| 3 | Guest sign-up without login? | **Yes** — guest provides name + **email or phone** (organiser chooses required contact field). **Bandie members** (logged-in users) are **flagged** on sign-ups/assignments. |
| 4 | Guest email verification? | **No** in MVP — capture contact only; no magic-link verification before slot confirmation. |
| 5 | Players suggest songs? | **Yes** — players may **propose songs** for **organiser approval**; sign-up to organiser-created slots remains core flow. |
| 6 | Public Bandie event directory? | **No** in MVP — share via globally unique slug URL + QR only. |
| 7 | Public song list visibility? | **Organiser toggle** (`public_song_list_enabled`) — visible to anyone with event link when enabled. |
| 8 | Song file/resource visibility? | **Not visible to non–Bandie members.** **Bandie members** may view when organiser enables per file/event policy. Never public to anonymous guests. |
| 9 | Player contact visibility? | **Organiser only** for email/phone. **Display names visible to all** participants on the event. |
| 10 | Link to venue entity? | **Optional** — pick saved `bandie_organiser_venues` row or enter ad hoc venue name/address. |
| 11 | Organiser roles in MVP? | **Full spec roles** — Owner, Admin, Event Host, House Band per permission matrix §9.2 (implement `bandie_organiser_members` delegation). |
| 12 | House band? | **House band flag** on event players — pre-assign slots; hide from public sign-up where configured. |
| 13 | Event slug scope? | **Globally unique** slugs. |
| 14 | Public URL path? | **`/events/:slug`** |
| 15 | Event file storage? | **Dropbox** — reuse leader Dropbox integration where organiser is a band leader; link band song-part files rather than separate Supabase bucket for MVP. |
| 16 | Export running order? | **PDF in MVP** (running order export); CSV defer. |
| 17 | Recurring events? | **Duplicate event only** in MVP — no weekly/monthly recurrence. |
| 18 | Add-on schema timing? | **Release 1** — ship `bandie_addons` / pack tables with first migration wave (supports future packs; primary gate remains Organiser Plus). |

**Deferred (unchanged):** Event history → song/player popularity (#10 legacy item) — post-MVP.

**Entitlements note:** This supersedes entitlements spec §20.1 #6 trial-on-free for open mic. Implementation must set `open_mic.create = false` (or equivalent) on `organiser_free` and require `organiser_plus` for create. Update entitlement seed in a dedicated migration when Phase 17 ships.

---

## 20. Confirmed implementation defaults

Technical defaults following §19:

- **Organiser model:** User-scoped event owner (`organiser_user_id`) **plus** `bandie_organiser_members` for delegated roles (Owner, Admin, Host, House Band).
- **Public route:** `/events/:slug` with globally unique slug; anon RPC field allowlist.
- **Player suggestions:** `bandie_open_mic_song_suggestions` (or equivalent) with `pending` / `approved` / `rejected` — organiser approves before song enters list.
- **Member flag:** `bandie_open_mic_players.user_id` set when logged in; UI badge “Bandie member”.
- **File access:** RLS checks authenticated Bandie user + organiser visibility flag; guests never read file bytes.
- **Running order PDF:** Client-side print/PDF from live list (browser print-to-PDF) acceptable for MVP; server render defer.
- **Recurrence:** `duplicateOpenMicEvent` only.

---

## 21. Cursor Implementation Notes

When implementing this feature, keep the first version deliberately practical.

Prioritise:

- Clean event creation.
- Fast song/slot editing.
- Low-friction player sign-up.
- Reliable live running order.
- Safe permissions and file visibility.

Avoid over-building:

- Complex scheduling logic.
- Full marketplace features.
- Advanced poster export.
- Heavy social features.
- Excessive automation.

The most important product test is whether a pub open mic host can run a busy evening from a tablet without falling back to a clipboard.

---

## 22. Event type differentiation — Open Mic vs Jam Night

**Added 27 June 2026** — distinguishes two primary event types within the organiser events workspace.

### 22.1 Jam Night (`jam_night`)

Operates like organiser **gigs**: the organiser defines date/time, duration, **number of performance slots**, and default minutes per slot. Slots may be filled in advance or managed live on the night.

| Aspect | Behaviour |
|---|---|
| Sign-up unit | **Band / act** (not song parts) |
| Bandie membership | **Not required** by default — guest bands sign up with name + contact |
| Registration toggle | Organiser may enable `requires_bandie_registration` to require signed-in Bandie users |
| Public page | Tabular slot list; request a specific slot or any available slot |
| Organiser view | Tabular slots table — slot #, time, duration, status, band, on-night assign/clear |
| Live mode | Reuses live control patterns where applicable; slot status: open → requested → filled → playing → completed |

### 22.2 Open Mic (`open_mic`)

Song-centric evenings with a **standard parts template** and optional **house band roster**.

| Aspect | Behaviour |
|---|---|
| House band | Organiser maintains roster (name + instrument); parts may default to house band members |
| Standard parts | Event-level part templates (e.g. Vocals, Lead guitar, Rhythm guitar, Bass, Keys, Drums) seeded on create |
| Song add | Adding a song auto-creates parts from template; house band auto-assigned where configured |
| Per-song override | Organiser can disable a part for a song (e.g. no keys); free a part for a guest player |
| Public sign-up | Name + contact; choose open part on existing song **or** suggest new song + preferred part **or** request part on existing song |
| Organiser views | **Tabular** song matrix (songs × parts) for fast scanning; tabular pending sign-ups and suggestions |
| Duplicate event | Copies house band roster, part templates, songs and slot structure (not player assignments) |

### 22.3 Shared

- Event creation chooses type up front (open mic or jam night).
- Public mini-site at `/events/:slug` with QR.
- Sign-up modes: open, moderated, invite-only, organiser-only.
- Organiser Plus required to create events.
- Tabular lists preferred for multi-record management (songs/parts matrix; jam slots table).

### 22.4 Deferred

- Enforcing Bandie registration for jam nights beyond the boolean flag (e.g. band profile linking).
- Walk-up player RPCs and Dropbox file linking UI (unchanged from Phase 17 MVP deferrals).

