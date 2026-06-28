# Bandie Build elements

These are the various different elements we will build for Bandie. Status as of June 2026 — see `docs/PROJECT_STATUS_TRACKER.md` for live progress.

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
— The private band domain where approved members manage the band's operational activity. **Shell done** — tabbed overview at `/app/:bandId`: **Members** tab (lineup parts, active members with hamburger actions, invitations); **Band details** tab (all leaders with primary contact badge, public profile editor with set fee offers); songs/setlists/calendar deferred.

## Songs and Repertoire Management 
— A searchable working songbook for managing the band's repertoire, readiness and song metadata. **Not started**

## Song Folder / Song Workspace 
— A dedicated workspace for each song, containing files, notes, parts and rehearsal resources. **Not started**

## Setlist Management 
— Tools for creating, reusing and tracking setlists for rehearsals, gigs and specific event types. **Not started**

## Calendar and Availability Planning 
— A shared availability planner for rehearsals and potential gig dates. **Not started**

## Gig Management 
— A structured area for managing confirmed and provisional gigs, logistics, setlists and post-gig history. **Not started**

## Booking Enquiries 
— A workflow for event organisers to contact bands and for bands to manage inbound booking interest. **Partial** — structured enquiry form on public band profiles sends a direct message to the band primary contact; dedicated enquiry inbox deferred.

## Notifications and Activity 
— Cross-product updates, reminders, review tasks and activity feeds. **Partial** — workspace communications at `/app/communications` (band invitations, player outreach, direct messages with replies); activity feed and push deferred.

## Media, Links and External Content 
— A way to organise external music, video, social and reference links around bands, songs and gigs. **Partial** — band profile media and social links done; song-level media deferred.

## Mobile / Performance Mode 
— Mobile-friendly views for rehearsals and gigs, including readable setlists and song resources. **Not started**

## Administration and Platform Foundations 
— Core platform capabilities such as authentication, permissions, file storage, roles, search and audit history. **Partial** — auth, RLS, profile image storage, platform app admin and admin mode done; song storage and admin portal deferred.
