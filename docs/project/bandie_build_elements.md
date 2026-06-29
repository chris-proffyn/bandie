# Bandie Build elements

These are the various different elements we will build for Bandie. Status as of **30 June 2026** — see `docs/PROJECT_STATUS_TRACKER.md` for live progress.

## Bandie Homepage 
— The public landing page that explains what Bandie is for **players**, **bands** and **organisers**, and routes each audience to the right next step. **Done** (`/`) — mockup: `bandie_homepage_three_modes_v3.html`

## Public Band Promotion 
— Public mini-sites that help bands showcase who they are, what they play, where they operate, and how they can be booked. **Done** (`/bands/:slug`) — includes members roster, set/fee offers, structured booking enquiry to primary contact.

## Organiser Venues
— Venues an organiser manages or is associated with (pubs, clubs, festival sites). **Done** (`/app/venues` in organiser workspace mode); used in booking enquiry venue picker.

## Band Directory 
— A searchable public directory where event organisers can find bands by genre, location, price, rating and availability. **Done** (`/bands`)

## Player Directory
— A searchable public directory where bands can find musicians open to deputy or permanent member invitations. **Done** (`/players`)

## Musician / Player Profile
— Each user's musician identity: display name, photo, instruments, gear, bio, and directory visibility. **Done** (`/app/profile`)

## Band Account, Workspace and Membership 
— The private band domain where approved members manage the band's operational activity. **Done** — tabbed overview at `/app/:bandId` (Members / Band details); songs, setlists, calendar, and gigs in band nav.

## Songs and Repertoire Management 
— A searchable working songbook for managing the band's repertoire, readiness and song metadata. **Done** (`/app/:bandId/songs`) — dashboard, filters, metrics, soft delete.

## Song Folder / Song Workspace 
— A dedicated workspace for each song, containing files, notes, parts and rehearsal resources. Song-part **files stored in Dropbox** (leader-owned); Bandie holds metadata, status, and readiness. **Done** — spec: `bandie_dropbox_song_part_storage_spec.md`; in-app PDF viewer, leader-only uploads.

## Setlist Management 
— Tools for creating, reusing and tracking setlists for rehearsals, gigs and specific event types. **Done** (`/app/:bandId/setlists`) — library, builder with drag reorder, metrics, duplicate/archive.

## Calendar and Availability Planning 
— A shared availability planner for rehearsals and potential gig dates. **Done** (`/app/:bandId/calendar`) — rehearsal + gig availability modes, member voting, public profile sync for confirmed/provisional gigs.

## Gig Management 
— A structured area for managing confirmed and provisional gigs, logistics, setlists and post-gig history. **Done** (`/app/:bandId/gigs`) — status workflow, setlist linking, readiness context.

## Booking Enquiries 
— A workflow for event organisers to contact bands and for bands to manage inbound booking interest. **Done** — structured form on public profiles; dedicated **Booking enquiries** inbox in `/app/communications`; entitlement rate limits when enforcing.

## Notifications and Activity 
— Cross-product updates, reminders, review tasks and activity feeds. **Partial** — workspace communications at `/app/communications` (invitations, player outreach, messages, booking enquiries); activity feed and push deferred (Phase 16).

## Media, Links and External Content 
— A way to organise external music, video, social and reference links around bands, songs and gigs. **Partial** — band profile media and social links done; song-level media deferred.

## Mobile / Performance Mode 
— Mobile-friendly views for rehearsals and gigs, including readable setlists and song resources. **Not started** (Phase 18).

## Administration and Platform Foundations 
— Core platform capabilities such as authentication, permissions, entitlements, file storage, roles, search and audit history. **Partial** — auth, RLS, Dropbox song-part storage, entitlement framework (`canPerform()`), five-plan catalogue (Player Free, Player Plus, Player Pro, Organiser Free, Organiser Plus), platform admin mode, dedicated **`/admin` portal** (metrics, editable plan catalogue, entitlements, audit); Stripe billing and moderation deferred (Phases 15, 19).
