# Bandie Product Description

**Document status:** Draft product description  
**Product:** Bandie  
**Intended next use:** Source material for richer functional requirements and technical requirements documents for web and mobile development  
**Primary audience:** Product, design, engineering, Cursor-based implementation workflows  
**Last updated:** 26 June 2026

---

## 1. Executive Summary

Bandie is a web and mobile platform for amateur bands who want to look professional, stay organised, and reduce the admin that normally happens across WhatsApp, spreadsheets, shared drives, social media links, calendar invites, tab sites, and scattered notes.

Bandie gives a band one structured home for its public presence and private operating workspace. Publicly, a band can present itself through a simple profile that works like a lightweight band website: name, logo, genre, location, bio, photos, videos, track links, socials, booking information, pricing guidance, public calendar availability, and enquiry routes. Privately, approved band members can manage the practical work of being in a band: songs, setlists, rehearsals, gigs, member availability, song sheets, lyrics, part files, rehearsal notes, and readiness tracking.

The product is aimed primarily at amateur bands, cover bands, weekend bands, originals bands, pub bands, community bands, wedding/event bands at the smaller end of the market, and musicians who do not have formal management. The core problem is that these bands still need to operate professionally, especially when dealing with venues and event organisers, but they typically lack dedicated tools, time, or process.

Bandie also supports event organisers, venues, pub landlords, party organisers, community event teams, and festival organisers by giving them a searchable band directory. Organisers can search by band name, genre, location, price range, rating, and availability, then view band profiles and make booking enquiries.

At its simplest, Bandie is:

> A public band profile and private band workspace that helps amateur bands promote themselves, organise gigs, manage setlists, store song resources, track availability, and look credible to event organisers.

---

## 2. Product Vision

Bandie’s product vision is to become the default operating system for bands without managers.

Most amateur bands are not short of tools. They already use many tools: WhatsApp for decisions, Google Drive for files, YouTube for reference tracks, Spotify and Bandcamp for promotion, tab sites for parts, spreadsheets for setlists, calendar apps for rehearsal planning, and social media for audience reach. The problem is that none of these tools understands the shape of band life.

Bandie does not need to replace every existing tool. Instead, it should make the band’s scattered resources useful by attaching them to the right band objects: songs, setlists, gigs, rehearsals, member roles, public profiles, and booking enquiries.

The long-term vision is for a band to run its complete lightweight operation from Bandie:

- Promote the band through a public profile.
- Be discoverable through a directory.
- Manage members and roles.
- Track rehearsals and gig availability.
- Maintain a structured songbook.
- Build and reuse setlists.
- Store files, tabs, lyrics, recordings, and notes by song and part.
- Track whether the band is ready for a specific gig.
- Present a professional front to organisers without taking the fun out of playing music.

The product should feel lightweight, practical, and music-oriented. It should avoid becoming a heavyweight project management system. The target user does not want enterprise workflow software; they want less friction, fewer repeated messages, and a clear answer to basic questions such as:

- What songs do we know?
- Which songs are gig ready?
- What key do we play this in?
- Where is the latest bass part?
- Who can rehearse next Tuesday?
- Can we accept a booking on this date?
- What setlist are we playing?
- What should I send to a venue that asks what we sound like?

---

## 3. Product Positioning

### 3.1 Positioning Statement

For amateur bands and event organisers, Bandie is a band management and discovery platform that combines a public band profile, searchable band directory, private band workspace, song management, setlist planning, file storage, and availability coordination in one simple product.

Unlike generic tools such as shared drives, messaging apps, calendars, or spreadsheets, Bandie is structured around how bands actually operate: members, roles, songs, parts, rehearsals, gigs, setlists, readiness, and bookings.

### 3.2 Tagline Options

- The simple hub for your band life.
- Built for bands without managers.
- Promote, organise, rehearse, play.
- The band hub for gigs, songs, and bookings.
- For amateur bands who want to look pro.

### 3.3 Core Promise

Bandie helps bands look credible, stay organised, and be ready for the next rehearsal, gig, or booking enquiry.

---

## 4. Target Users

Bandie has two primary user groups and several secondary user types.

### 4.1 Primary User Group 1: Bands

The main target users are amateur and semi-professional bands who need organisation but do not have formal management.

This includes:

- Cover bands.
- Originals bands.
- Pub bands.
- Wedding and party bands.
- Community event bands.
- Weekend musicians.
- Tribute or genre-specific bands.
- Newly formed bands building their first repertoire.
- Established amateur bands trying to become more organised.

These bands often have members with day jobs, family commitments, and limited rehearsal time. Bandie should help them make decisions quickly, keep everyone aligned, and reduce the amount of repeated admin that usually falls to one or two band members.

### 4.2 Primary User Group 2: Event Organisers

Bandie also serves people who need to find and book bands.

This includes:

- Pub landlords.
- Venue managers.
- Festival organisers.
- Community event organisers.
- Party organisers.
- Wedding planners at the smaller end of the market.
- Corporate/social event organisers.
- School, charity, and club event organisers.

These users need to answer practical questions quickly:

- What does the band sound like?
- Are they suitable for this event?
- Where are they based?
- What genres do they play?
- What do they typically cost?
- Are they available?
- Do they have videos or tracks?
- How do I contact or book them?

### 4.3 Secondary User Types

Bandie may also support:

- Individual musicians who belong to multiple bands.
- Band leaders who coordinate rehearsals and gigs.
- Dep or substitute musicians who need access to selected songs and setlists.
- Promoters who manage multiple small events.
- Rehearsal studios who want to connect bands with rehearsal availability.
- Local music communities that want a directory of active bands.

---

## 5. Core Product Concept

Bandie is made up of two connected product surfaces:

1. **Public surface:** visible to event organisers, audiences, and prospective bookers.
2. **Private band workspace:** visible only to approved members of a band.

### 5.1 Public Surface

The public surface helps bands promote themselves and helps organisers discover suitable bands.

It includes:

- Band homepage/profile.
- Band directory.
- Search and filtering.
- Public calendar availability for confirmed or provisional gig availability.
- Public booking/contact route.
- Media and social links.
- Pricing/fee guidance.
- Ratings/reviews or credibility indicators.

### 5.2 Private Band Workspace

The private workspace helps the band manage its internal operations.

It includes:

- Member-only access.
- Band switcher for users in multiple bands.
- Songs management dashboard.
- Song directory with metadata and readiness.
- Setlist management.
- Song folders with part-specific file storage.
- Calendar and availability planning.
- Gig planning.
- Member roles and permissions.
- Recent activity and review tasks.

### 5.3 Relationship Between Public and Private Areas

The public and private areas should be connected but clearly separated.

Private data should not leak into public views. Songs, tabs, lyrics, uploaded files, internal notes, rehearsal availability, and member-only comments are private by default.

Selected outputs from private workflows can become public when appropriate. For example:

- A band’s public profile can show approved media links and booking details.
- Confirmed and provisional gig availability can appear on the public profile calendar.
- A band can display genres, location, rough price range, typical set length, and event suitability.
- Public pages can show polished promotional content without exposing private working materials.

---

## 6. Key Product Areas

## 6.1 Public Band Homepage / Profile

The public band profile acts as a lightweight mini-website for each band.

### Purpose

The band profile gives bands a single professional link to send to venues, event organisers, promoters, friends, and prospective bookers. It replaces the messy pattern of sending separate links to Instagram, YouTube, Spotify, Bandcamp, old gig clips, WhatsApp videos, and a long message explaining what the band does.

### Key Content

A band profile should include:

- Band name with a selectable display font.
- Logo or image shown at the top of the profile (above the band name, not inside a card).
- Location and areas served.
- Genre and style tags.
- Short bio.
- Longer description.
- Photos.
- Videos.
- Track links.
- External links such as YouTube, Spotify, Bandcamp, SoundCloud, Instagram, TikTok, Facebook, website, and mailing list.
- Booking contact details or enquiry form.
- Typical fee range or pricing guidance.
- Band size and lineup.
- Typical set lengths.
- Equipment or setup notes.
- Public availability status.
- Public calendar where appropriate.
- Ratings, reviews, testimonials, or organiser feedback when available.

### Example Product Behaviour

A band can create a profile that says:

- “Available for gigs.”
- “Post-punk / new wave covers · London.”
- “Videos, tracks, socials and booking info in one link.”
- “Sat 14 Sep · 2 x 45 min sets.”
- “4/5 confirmed · setlist in progress.”

The profile should present the band as credible and bookable without requiring the band to build and maintain a separate website.

---

## 6.2 Band Directory

The Band Directory is the organiser-facing marketplace/discovery area.

### Purpose

The directory helps event organisers find suitable bands quickly. It is especially useful for local or regional organisers who need to search by location, genre, price, rating, and availability.

### Directory Search and Filters

The directory should support filtering by:

- Band name.
- Genre.
- Location or area served.
- Price range.
- Minimum rating.
- Availability.
- Possibly event type in future.
- Possibly band size in future.
- Possibly set length in future.
- Possibly travel distance in future.

The current mockup includes a rich filtering model with band name, genre, location, min and max price, rating, availability, quick genre chips, sorting options, active filter pills, result counts, and empty state handling.

### Directory Result Cards

Each band result should show enough information for an organiser to decide whether to click through.

A result card should include:

- Band name.
- Genre.
- Location.
- Area served.
- Availability state.
- Rating.
- Short description.
- Tags.
- Typical price range.
- Visual identity/logo/hero colour.
- Link to view profile.

### Availability States

The public directory should support availability states such as:

- Available.
- Limited availability.
- Unavailable.

In later versions, these states should be derived from the band’s internal gig availability calendar and booking rules rather than manually maintained.

### Sorting

Organisers should be able to sort results by:

- Recommended.
- Rating high to low.
- Price low to high.
- Price high to low.
- Name A-Z.

The recommended sort should consider availability, rating, relevance, location match, and possibly profile completeness.

---

## 6.3 Private Band Workspace

The private workspace is where approved band members manage internal band activity.

### Purpose

The private workspace is the operational centre of the band. It should make it clear that the user is inside a specific band domain, such as “Skin Condition”, and that the content is only accessible to approved band members.

### Workspace Navigation

The current mockups use a sidebar with a band switcher and clear navigation groups.

Primary private workspace navigation includes:

- Songs Dashboard.
- Setlists.
- Song Folder.
- Calendar.
- Gigs.
- Members.

The sidebar also communicates access state, for example “Approved band member”, and includes a note that private content is visible only to approved members.

### Multi-Band Concept

A user may belong to more than one band. Bandie should support a band switcher so a musician can move between different band workspaces. All private data should be scoped to the selected band.

---

## 6.4 Songs Management Dashboard

The Songs Dashboard is the central private songbook for the band.

### Purpose

The Songs Dashboard helps a band upload, organise, and prepare its working repertoire. It tracks readiness, keys, parts, files, usage history, and gig suitability in one secure member-only area.

### Song Directory

The song directory should show a structured table/list of the band’s repertoire.

Each song should include metadata such as:

- Song title.
- Artist.
- Genre.
- Number of times played.
- Readiness percentage or status.
- Length/duration.
- Current band key.
- Original key where relevant.
- Part completeness.
- Missing parts.
- Date added.
- Last updated.
- Last played.
- Notes.
- Suitability for different setlists or gig types.

The mockup includes fields such as genre, played count, readiness, length, key, and parts completeness.

### Search and Filtering

The song directory should allow searching and filtering by:

- Song title.
- Artist.
- Notes.
- Genre.
- Readiness.
- Key.
- Usage/played count.
- Required parts.
- Missing parts.
- Recently added.
- Most played.

### Dashboard Metrics

The dashboard should provide summary metrics such as:

- Total songs.
- Gig-ready songs.
- Missing parts.
- Average set duration.
- Songs added this month.
- Percentage of repertoire that is gig ready.
- Total playable duration.
- Number of files needing attention.

### Readiness Snapshot

A readiness panel should summarise whether the band has enough prepared material for upcoming rehearsals or gigs.

Example readiness items:

- Ready for next gig.
- Songs needing vocal sheets.
- Songs needing bass tabs.
- Blockers for a specific setlist.
- Newly added songs not yet rehearsed.

### Recent Activity

The dashboard should show recent changes so members can see what has happened without reading through chat messages.

Example activity:

- A rhythm guitar sheet was uploaded.
- A setlist was marked as tested at rehearsal.
- A new song was added.
- A file was marked current.
- A member added a note.

---

## 6.5 Song Folder / Song Workspace

Each song has its own workspace or folder.

### Purpose

A song folder gives the band one place to store everything needed to learn, rehearse, perform, and maintain that song.

This is especially important because different band members need different assets. A singer needs lyrics and cue notes. Guitarists need tabs, chords, arrangement notes, and tone notes. Bass players may need a bass-specific chart. Drummers may need count-ins, endings, and structure notes. The whole band may need reference recordings and rehearsal clips.

### Song-Level Metadata

A song workspace should show key metadata including:

- Song title.
- Artist.
- Genre.
- Arrangement notes.
- Gig notes.
- Readiness percentage.
- Number of times played.
- Song length.
- Current key.
- Original key.
- Status/approval state.

### Part Folders

A song should include part-specific folders. Initial folder types include:

- Lead Guitar.
- Rhythm Guitar.
- Bass.
- Drums.
- Vocals.
- Shared.

Additional folders should be configurable so bands can support different lineups such as keys, brass, percussion, strings, backing vocals, samples, or tracks.

### File Uploads

Members should be able to upload files to a song folder and assign them to a part folder.

Supported file types should include, at minimum:

- PDF.
- Image files.
- Audio files.
- Guitar Pro files.
- ChordPro files.
- DOCX.
- Text/lyrics files.
- Possibly video files or video links.

Files should have metadata such as:

- File name.
- File type.
- Folder/part.
- Uploaded by.
- Upload date.
- Status.
- Version.
- Visibility.
- Current/draft/reference/archive state.

### Versioning and Audit

Older versions should remain visible for audit and rollback. This is important because bands often iterate arrangements, keys, and parts over time. A new upload should not silently destroy the previous source of truth.

A file should support statuses such as:

- Current.
- Draft.
- Reference.
- Archived.
- Superseded.

### Review Tasks and Comments

A song workspace should allow comments and review tasks.

Examples:

- “Lead tab approved.”
- “Bass part needs final check.”
- “Vocal cue added.”
- “Confirm whether the bridge follows the record or live version.”
- “Upload updated lyric sheet before rehearsal.”

This area should reduce the need to search chat histories for decisions.

---

## 6.6 Setlist Management

Setlist Management lets bands create, compare, reuse, and prepare running orders for rehearsals and gigs.

### Purpose

Setlists are a core object in Bandie. A setlist is more than a list of songs; it represents a planned performance with duration, flow, vibe, readiness, usage history, and gig suitability.

### Setlist Library

Bands should be able to maintain multiple setlists, such as:

- Post-punk 45.
- Groove & Dance.
- Festival 70.
- Wedding first set.
- Pub opener.
- Acoustic early slot.
- Covers party set.
- Originals showcase.

Each setlist should include:

- Name.
- Description.
- Status.
- Number of songs.
- Total duration.
- Number of times used.
- Last used date.
- Overall vibe.
- Readiness score.
- Notes.
- Encore options where relevant.

### Setlist Metrics

The setlist page should show high-level metrics such as:

- Active setlists.
- Number of gig-ready setlists.
- Most-used setlist.
- Longest set.
- Average vibe or energy profile.
- Usage count.
- Last used date.
- Duration.

### Setlist Status

A setlist may have statuses such as:

- Draft.
- Needs rehearsal.
- Needs specific part.
- Gig ready.
- Archived.
- Recently used.

### Setlist Builder

The setlist builder should allow members, especially band leaders, to build running orders from the song directory.

Key behaviours:

- Search available songs.
- Filter to gig-ready songs.
- Add songs to running order.
- Remove songs from running order.
- Drag/reorder songs.
- Show live total duration.
- Show number of songs.
- Show overall readiness.
- Show notes per song.
- Highlight songs that need rehearsal.
- Save changes.
- Duplicate existing setlists.

### Vibe and Flow

Setlists should support qualitative planning. Bands often care about energy, genre balance, singer workload, key changes, danceability, opening impact, and closing strength.

Bandie should support a concept of “vibe” such as:

- Rock.
- Jazz.
- Punk.
- New wave.
- Post-punk.
- Funk.
- Soul.
- Acoustic.
- High energy.
- Dance.
- Background.
- Family friendly.

Future versions could support energy curves or setlist flow analysis.

---

## 6.7 Calendar and Availability Planning

The Calendar is used by bands to coordinate rehearsals and gig availability.

### Purpose

Band availability is one of the hardest operational problems for amateur bands because members have jobs, families, travel, holidays, and other commitments. Bandie’s calendar should help band leaders propose dates and quickly understand whether the band can rehearse or accept gigs.

The calendar has two distinct modes:

1. Rehearsal mode.
2. Gig mode.

### Rehearsal Mode

Rehearsal mode is internal to the band.

A band leader can propose a series of rehearsal events, including:

- Series name.
- First date.
- Time.
- Repeat pattern.
- Number of sessions.
- Location.
- Notes.

Examples:

- Every other Tuesday.
- Every week.
- Every four weeks.
- Six sessions.
- Weybridge Community Studios.

Members then indicate availability for each rehearsal.

Availability states may include:

- Available.
- Maybe.
- No.
- Pending.

Rehearsal sessions should not appear on the public Bandie calendar.

### Gig Mode

Gig mode is used to determine when the band can accept bookings.

A band leader can propose gig availability windows, including:

- Availability block name.
- Date.
- Time window.
- Area/travel radius.
- Notes for members.

Members vote on each proposed date.

The current decision rules are:

- 100% yes = confirmed.
- More than 50% yes = provisional.
- Less than or equal to 50% yes = proposed.

Confirmed and provisional gig dates should appear in the band’s public calendar in the full app. Proposed dates should remain internal.

### Calendar Views

The calendar should show:

- Monthly view.
- Event cards.
- Event status.
- Member availability grid.
- Availability progress.
- Summary counts.
- Confirmed gig dates.
- Provisional gig dates.
- Proposed rehearsals.
- Number of members.

### Public Calendar Publishing

Public calendar publishing is a key bridge between internal coordination and external booking.

When a gig availability date becomes confirmed or provisional, it can be published to the band’s public profile so organisers can see when the band is bookable. This reduces enquiry friction and makes the band appear better organised.

---

## 6.8 Gigs

The Gigs area is referenced in the private workspace navigation and should become a dedicated area for actual performance events.

### Purpose

The Gigs area should manage real bookings and performance commitments, not just availability proposals.

A gig should represent an event the band is considering, has provisionally accepted, or has confirmed.

### Gig Data

A gig should include:

- Gig name.
- Venue.
- Address.
- Date.
- Load-in time.
- Soundcheck time.
- Performance time.
- Set length.
- Number of sets.
- Fee.
- Deposit status.
- Organiser contact.
- Public/private visibility.
- Notes.
- Required equipment.
- PA/backline requirements.
- Linked setlist.
- Linked songs.
- Member availability.
- Status.

### Gig Status

Possible statuses:

- Enquiry.
- Proposed.
- Provisional.
- Confirmed.
- Cancelled.
- Completed.
- Archived.

### Link to Setlists and Songs

A confirmed gig should be able to link to one or more setlists. Song readiness and missing parts should be visible in the context of the gig.

The product should answer:

- Do we have a setlist for this gig?
- Is the setlist long enough?
- Are all songs in the setlist gig ready?
- Which songs still need files or rehearsal?
- Which members are confirmed?

---

## 6.9 Members and Permissions

Bandie is organised around band membership.

### Member Model

A user can be a member of one or more bands. Within each band, they can have one or more roles.

Example musical roles:

- Singer.
- Lead Guitar.
- Rhythm Guitar.
- Bass.
- Drums.
- Keys.
- Backing vocals.
- Percussion.
- Brass.

Example workspace roles:

- Band Leader.
- Band Leader.
- Admin.
- Member.
- Guest/Dep.
- Viewer.

### Access Control

Access to private band content should be limited to approved band members.

Private content includes:

- Songs dashboard.
- Song folders.
- Uploaded files.
- Internal notes.
- Setlists.
- Rehearsal availability.
- Internal gig planning.
- Member details.

Public content includes only intentionally published profile information, public availability, public booking details, and directory listing data.

### Permission Examples

Possible permission behaviours:

- Band Leader can manage band settings, members, and public profile.
- Band Leader can create gigs, setlists, rehearsals, and song folders.
- Members can upload files, vote on availability, comment, and update their own parts.
- Guests/Deps can see specific songs or setlists shared with them.
- Public users can only view published band profiles and submit enquiries.

---

## 7. Core Data Objects

This section defines the main product objects that later functional and technical documents should expand.

### 7.1 User

A person with a Bandie account.

Key attributes:

- Name.
- Email.
- Profile image.
- Account status.
- Bands joined.
- Notification preferences.

### 7.2 Band

A band workspace and public profile.

Key attributes:

- Band name.
- Logo.
- Location.
- Area served.
- Genres.
- Bio.
- Public profile slug.
- Social links.
- Media links.
- Booking contact.
- Typical price range.
- Public availability status.
- Members.
- Privacy/publication settings.

### 7.3 Band Membership

The relationship between a user and a band.

Key attributes:

- User.
- Band.
- Musical role.
- Permission role.
- Approval status.
- Joined date.
- Invitation status.

### 7.4 Song

A song in a band’s repertoire.

Key attributes:

- Band.
- Title.
- Artist.
- Genre.
- Key.
- Original key.
- Duration.
- Times played.
- Readiness.
- Notes.
- Arrangement.
- Status.
- Created by.
- Created date.
- Last updated.

### 7.5 Song Part Folder

A part-specific grouping within a song.

Key attributes:

- Song.
- Folder name.
- Role/instrument.
- Description.
- Required/optional flag.
- Completeness state.

### 7.6 Song File

A file or link attached to a song or part folder.

Key attributes:

- Song.
- Folder.
- File name.
- File type.
- File URL/storage path.
- Uploaded by.
- Upload date.
- Version.
- Status.
- Visibility.
- Notes.

### 7.7 Setlist

A reusable or gig-specific running order.

Key attributes:

- Band.
- Name.
- Description.
- Status.
- Vibe.
- Total duration.
- Number of songs.
- Times used.
- Last used date.
- Created by.
- Updated date.

### 7.8 Setlist Song

A song within a setlist.

Key attributes:

- Setlist.
- Song.
- Order.
- Notes.
- Transition notes.
- Energy/vibe marker.
- Required key.
- Included/excluded flag.

### 7.9 Calendar Event

A proposed or confirmed band event.

Key attributes:

- Band.
- Event type: rehearsal or gig availability or confirmed gig.
- Title.
- Date.
- Time.
- Location/area.
- Notes.
- Status.
- Public visibility.
- Created by.

### 7.10 Availability Vote

A member’s availability response to an event.

Key attributes:

- Event.
- Member.
- Vote: yes, maybe, no, pending.
- Comment.
- Updated date.

### 7.11 Gig

A real or potential performance booking.

Key attributes:

- Band.
- Organiser.
- Venue.
- Date/time.
- Fee.
- Status.
- Linked setlist.
- Public/private flag.
- Booking notes.

### 7.12 Booking Enquiry

A public enquiry from an organiser to a band.

Key attributes:

- Band.
- Organiser name.
- Organiser email/phone.
- Event date.
- Event type.
- Location.
- Budget.
- Message.
- Status.
- Created date.

---

## 8. Product Principles

### 8.1 Keep It Lightweight

Bandie should make band life easier, not turn it into formal project management. Interactions should be quick, obvious, and forgiving.

### 8.2 Public and Private Must Be Clearly Separated

Bands need confidence that internal files, notes, and availability are private. Anything public should be intentionally published.

### 8.3 Support Existing Music Workflows

Bands already rely on external links, files, tab sites, videos, and audio recordings. Bandie should structure these resources rather than force everything into a proprietary format.

### 8.4 Mobile Matters

Band members will often use Bandie on phones: at rehearsal, at the pub, on the train, or during setup. The web product should be responsive and the mobile product should support the most common member tasks.

### 8.5 The Band Leader Should Not Have to Chase Everyone

The product should reduce repeated chasing. Availability, missing parts, readiness, and setlist gaps should be visible without someone having to ask repeatedly in chat.

### 8.6 Help Bands Look Professional

Many amateur bands are good but poorly presented. Bandie should help them look organised to organisers through clean profiles, visible availability, clear media, and structured booking information.

### 8.7 Build for Reuse

Songs, setlists, files, and gig plans should be reusable. A band should not have to recreate the same information for every event.

---

## 9. Web and Mobile Product Shape

Bandie should be delivered as a web and mobile solution. The web product is likely to be the richest management surface. The mobile product should focus on fast member actions and performance-adjacent use cases.

### 9.1 Web Product

The web product should support:

- Public marketing homepage.
- Public band profiles.
- Public band directory.
- Full private workspace.
- Song management.
- Setlist builder.
- File uploads.
- Calendar planning.
- Member management.
- Band settings.
- Booking enquiry management.

### 9.2 Mobile Product

The mobile product should support:

- Member login.
- Band switcher.
- View songs and song files.
- View setlists.
- Vote on availability.
- See rehearsal/gig details.
- Upload simple files/photos/audio where useful.
- Receive notifications.
- Access performance-ready song sheets or setlists.

The mobile product may initially have a narrower scope than web but should be designed around the real usage patterns of band members.

### 9.3 Mobile Priority Tasks

High-priority mobile tasks include:

- “Can you make this date?” voting.
- “What time is rehearsal?” checking.
- “What setlist are we playing?” viewing.
- “What key is this song in?” checking.
- “Where is the latest lyric sheet?” viewing.
- “Upload this rehearsal recording.”
- “Confirm I have reviewed my part.”

---

## 10. MVP Product Scope

The MVP should focus on the smallest useful product that proves the core Bandie concept.

### 10.1 Suggested MVP Scope

The MVP should include:

1. User accounts and band membership.
2. Band creation and private workspace.
3. Public band profile.
4. Songs dashboard.
5. Song folder with part folders and file uploads.
6. Setlist management.
7. Calendar availability with rehearsal and gig modes.
8. Band directory with search/filter.
9. Basic booking enquiry route.

### 10.2 MVP Exclusions

The MVP does not need to include:

- Payments.
- Contract generation.
- Full review marketplace.
- Advanced recommendation engine.
- Deep audio/video hosting.
- AI setlist generation.
- Automated copyright/licensing support.
- Complex public calendar integrations.
- In-app chat.
- Multi-band agency management.

### 10.3 MVP Success Criteria

The MVP is successful if bands can:

- Create a credible public band page.
- Add and manage their songs.
- Upload and find song resources by part.
- Build at least one reusable setlist.
- Coordinate rehearsal and gig availability.
- Appear in a searchable directory.
- Receive a booking enquiry.

And event organisers can:

- Search for bands.
- Filter by key criteria.
- View a band profile.
- Understand whether the band is suitable.
- Submit an enquiry.

---

## 11. Future Product Opportunities

Bandie has room to expand after the MVP.

### 11.1 Performance Mode

A dedicated mode for use during rehearsals and gigs.

Potential features:

- Large-format setlist display.
- Dark stage-friendly view.
- Song sheets optimised for distance viewing.
- Quick key and cue display.
- Next song prompt.
- Tap/swipe through set.
- Offline access.

### 11.2 Advanced Booking Workflow

Potential features:

- Booking pipeline.
- Quote creation.
- Deposit tracking.
- Contracts.
- Invoice support.
- Organiser messaging.
- Automated reminders.
- Post-gig feedback.

### 11.3 Smarter Readiness and Recommendations

Potential features:

- Readiness score derived from missing parts, rehearsal status, and member reviews.
- Warnings when a setlist is too short.
- Suggested songs to complete a set.
- Energy curve analysis.
- Genre balance.
- Singer workload view.
- Key transition suggestions.

### 11.4 Integrations

Potential integrations:

- Google Calendar / Apple Calendar.
- Spotify.
- YouTube.
- Bandcamp.
- SoundCloud.
- Google Drive / Dropbox.
- Social platforms.
- Email notifications.
- Push notifications.

### 11.5 Community and Discovery

Potential features:

- Local band networks.
- Shared gig opportunities.
- Dep musician marketplace.
- Band-to-band collaboration.
- Promoter accounts.
- Venue accounts.
- Public event listings.

---

## 12. Example End-to-End Journeys

### 12.1 Band Creates Its Presence

1. A band leader signs up.
2. They create a band called “Skin Condition”.
3. They add genre, location, logo, bio, and social links.
4. They add YouTube clips and track links.
5. They publish a public profile.
6. The band now has one clean link to send to venues.

### 12.2 Band Builds Its Songbook

1. A band member opens the Songs Dashboard.
2. They add a new song.
3. They set genre, key, duration, and notes.
4. They open the song folder.
5. Members upload files to Lead Guitar, Rhythm Guitar, Bass, Drums, Vocals, and Shared folders.
6. The song readiness score improves as required parts are added and reviewed.

### 12.3 Band Builds a Setlist

1. A band leader opens Setlist Management.
2. They duplicate an existing setlist.
3. They search for gig-ready songs.
4. They add songs to the running order.
5. They drag songs into the desired order.
6. Bandie calculates duration and readiness.
7. The setlist is saved as “Post-punk 45”.

### 12.4 Band Coordinates Gig Availability

1. A band leader opens Calendar in Gig Mode.
2. They propose a Saturday evening availability window.
3. Members vote yes, maybe, no, or leave pending.
4. Bandie calculates status.
5. If every member says yes, the date becomes confirmed.
6. If more than half say yes, it becomes provisional.
7. Confirmed and provisional dates can appear on the public calendar.

### 12.5 Organiser Finds a Band

1. An organiser opens the Bandie directory.
2. They filter by genre, location, price, rating, and availability.
3. They compare band cards.
4. They open a band profile.
5. They watch clips and check the fee range.
6. They submit a booking enquiry.
7. The band receives the enquiry in its private workspace.

---

## 13. Non-Functional Product Expectations

### 13.1 Usability

Bandie should be intuitive for non-technical users. Many users will be musicians who want to spend minimal time administering the band.

### 13.2 Responsiveness

All web pages should be responsive. The mockups already point toward layouts that collapse from sidebar/grid structures into mobile-friendly single-column views.

### 13.3 Performance

The product should feel fast for common tasks:

- Searching songs.
- Opening setlists.
- Viewing files.
- Voting availability.
- Filtering the directory.

### 13.4 Security and Privacy

Private band materials must be protected. Access should be scoped by band membership and permission level.

### 13.5 File Storage Reliability

Song files are important band assets. Uploads, downloads, versioning, and permissions should be reliable.

### 13.6 Auditability

The product should preserve key activity history for files, readiness, review tasks, and member changes. Bands should know who uploaded or changed what.

### 13.7 Extensibility

The data model should support future expansion into bookings, public events, reviews, performance mode, payments, and integrations.

---

## 14. Design Direction

The current mockups use a bold music-oriented visual style:

- Dark backgrounds.
- High contrast cards.
- Bright accent colours.
- Rounded panels.
- Music-related icons.
- Strong typography.
- Public pages with promotional energy.
- Private workspace with structured dashboard patterns.

The product should feel energetic and creative, but still clear enough for practical administration.

Public pages should feel promotional and polished. Private pages should feel like a productive workspace. The two areas can share brand identity but should optimise for different user goals.

---

## 15. Initial Information Architecture

### Public

- Marketing homepage.
- Band directory.
- Band profile.
- Booking enquiry form.

### Private Band Workspace

- Dashboard / home.
- Songs.
  - Song directory.
  - Song detail/folder.
  - Part folders.
  - Files.
- Setlists.
  - Setlist library.
  - Setlist builder.
  - Setlist detail.
- Calendar.
  - Rehearsal mode.
  - Gig mode.
  - Availability voting.
- Gigs.
  - Gig list.
  - Gig detail.
  - Linked setlists.
  - Booking state.
- Members.
  - Member list.
  - Roles.
  - Invitations.
  - Permissions.
- Band profile settings.
  - Public profile content.
  - Media links.
  - Booking details.
  - Directory visibility.

---

## 16. Open Product Questions

These questions should be resolved during functional specification and development planning.

### 16.1 Public Profile and Directory

- Should every band profile be public by default, or should publication require explicit action?
- Should bands approve exactly which fields appear in the directory?
- Should fee ranges be mandatory, optional, or hidden?
- Should reviews/ratings exist in MVP or later?
- Should booking enquiries require organiser accounts?

### 16.2 Songs and Files

- What file size limits should apply?
- Which file types are supported in MVP?
- Should Bandie host files directly or link to external storage in MVP?
- How should copyright-sensitive materials be handled?
- Should there be automatic previews for PDFs/images/audio?

### 16.3 Setlists

- Should all members be able to edit setlists?
- Should setlists support voting or approval?
- Should a setlist be linked to a specific gig?
- Should setlist duration be manually entered or calculated from songs?

### 16.4 Calendar

- Should confirmed/provisional public availability be published automatically or require band leader approval?
- Should “maybe” count toward provisional status?
- Can different roles be weighted differently for gig confirmation?
- How should deps/substitutes affect availability?

### 16.5 Mobile

- Which private workspace features must be in mobile MVP?
- Should mobile support offline access for files and setlists?
- Should performance mode be part of MVP or later?

---

## 17. Summary

Bandie is a purpose-built platform for bands who need to organise themselves and promote themselves without formal management.

The product combines:

- A public band profile.
- A searchable band directory.
- A private member-only band workspace.
- Song and file management.
- Setlist planning.
- Rehearsal and gig availability.
- Public availability publishing.
- Booking enquiry support.

The current mockups establish a strong foundation: a promotional homepage, a searchable band directory, a private songs dashboard, setlist management, song folders, and calendar-based availability planning. The next step is to turn this product description into detailed functional requirements and technical requirements that specify user flows, permissions, data models, API contracts, storage, frontend components, mobile behaviours, and release sequencing.

Bandie should remain focused on its core promise: helping amateur bands look credible, stay organised, and be ready to play.
