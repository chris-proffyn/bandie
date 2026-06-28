# Bandie — Product Technical Requirements

**Document status:** Authoritative technical requirements  
**Product:** Bandie  
**Last updated:** 28 June 2026

---

## 1. Purpose

This document defines **how Bandie is built** — stack, architecture, repository structure, backend approach, and technical constraints. It supplements generic RSD architecture docs with Bandie-specific decisions.

Generic RSD rules in `docs/RSD_SYSTEM_ARCHITECTURE.md` apply unless explicitly overridden here.

---

## 2. Architectural decisions (recorded)

### 2.1 Web framework: Vite + React + TypeScript

**Decision:** Use Vite + React + TypeScript for `@bandie/web`.

**Rationale:**
- Homepage MVP is primarily static marketing content — Vite is sufficient
- Aligns with `RSD_SUPABASE_MULTI_TENANT_DB.md` environment variable conventions (`VITE_*`)
- Fast dev experience; Netlify deployment is straightforward
- Shared packages integrate cleanly via workspace aliases

**Future consideration:** If public profile SEO becomes a blocker, evaluate SSR/prerender (Vite SSR plugin or migration to Next.js). Document any change here before proceeding.

### 2.2 Mobile: React Native (Expo) — deferred

**Decision:** Mobile scaffold is a placeholder. Expo + React Native when mobile work begins.

**Rationale:** Web-first delivery; mobile focuses on member tasks (availability, setlists, song viewing) after core web workspace exists.

### 2.3 Backend: Shared Supabase multi-app instance

**Decision:** Bandie uses the **shared Proffyn Supabase project** with app-prefixed naming.

**Confirmed by product owner:** Multi-tenant database approach is in use.

| Item | Value |
|---|---|
| Supabase project name | `proff-rsd-mt-1` |
| Supabase project ID | `cjmgrsvbrcgozgjxbriz` |
| Supabase URL | `https://cjmgrsvbrcgozgjxbriz.supabase.co` |
| App code | `bandie` |
| Table prefix | `bandie_` |
| Storage buckets | `bandie-*` (e.g. `bandie-song-files`) |
| Edge functions | `bandie_*` prefix |

**GitHub repository:** [https://github.com/chris-proffyn/bandie](https://github.com/chris-proffyn/bandie)

**Rationale:** Cost-effective for MVP/prototype stage; documented split path if Bandie scales independently.

**Reference:** `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`

### 2.4 Hosting: Netlify

Web app deploys to Netlify with CI from GitHub. Separate Supabase projects per environment (dev/staging/production).

### 2.5 Monorepo structure

```
/
├── apps/
│   ├── web/          @bandie/web — Vite React app (Netlify)
│   └── mobile/       Placeholder — Expo (future)
├── packages/
│   ├── ui/           @bandie/ui — shared components
│   ├── data/         @bandie/data — Supabase data-access layer
│   └── utils/        @bandie/utils — pure utilities, analytics
├── supabase/
│   ├── migrations/   SQL migrations (authoritative)
│   └── seed/         Dev seed data
└── docs/             Governance and project docs
```

---

## 3. Technology stack

| Layer | Technology |
|---|---|
| Web UI | React 19, TypeScript, Vite |
| Routing | React Router |
| Styling | CSS modules / component-scoped CSS (Tailwind optional later) |
| Mobile (future) | Expo, React Native |
| Backend | Supabase (Auth, Postgres, RLS, Storage) |
| Email (Auth) | Resend SMTP via Supabase |
| Testing | Jest (Vitest acceptable for Vite packages) |
| CI/CD | GitHub Actions |
| Web hosting | Netlify |
| Source control | GitHub |

---

## 4. Data access rules (strict)

- **UI code must NOT import `@supabase/supabase-js` directly**
- All Supabase access goes through `@bandie/data`
- RLS enabled on every user-facing table
- No service-role keys in client code
- Schema changes only via `supabase/migrations/`
- UUID primary keys, `timestamptz` timestamps per `RSD_DATA_MODELLING_GUIDE.md`

---

## 5. Environment variables

```bash
# Client (web / mobile) — publishable key only
VITE_SUPABASE_URL=https://cjmgrsvbrcgozgjxbriz.supabase.co
VITE_SUPABASE_ANON_KEY=   # sb_publishable_... (modern publishable key)
VITE_APP_CODE=bandie
VITE_APP_URL=
# live = hide fictitious test bands/players; test = show all directory data
VITE_BANDIE_DATA_MODE=live

# Server / CLI / migrations — never in client code
SUPABASE_URL=https://cjmgrsvbrcgozgjxbriz.supabase.co
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=      # sb_secret_... (replaces legacy service_role)
```

Copy from `.env.example`. Never commit `.env` files.

---

## 6. Core data model (Bandie tables)

All tables prefixed `bandie_`. Full schema to be defined in migrations. Conceptual entities from product description:

| Entity | Purpose |
|---|---|
| `bandie_profiles` | Musician / player profile (display name, username, instruments, gear, directory visibility, player/organiser roles, leader contact fields) |
| `bandie_bands` | Band workspace + public profile |
| `bandie_band_members` | User ↔ band with roles |
| `bandie_band_invitations` | Email invitations with accept token |
| `bandie_band_parts` | Lineup roles (title, instrument filter, sort order, assigned member) |
| `bandie_player_outreach` | Leader-initiated audition/join invites to directory players |
| `bandie_user_messages` | Direct messages between Bandie users (inbox / send by username, reply threading) |
| `bandie_band_set_offers` | Fixed set length & fee packages per band |
| `bandie_band_dynamic_fee_offers` | Session-based dynamic fee packages (appearance + per-session fees) |
| `bandie_organiser_venues` | Organiser-managed venues (pub, club, festival site, etc.) |
| `bandie_band_media` | Band photos, videos, tracks (URLs) |
| `bandie_band_social_links` | Social platform links |
| `bandie_band_public_dates` | Manual public availability dates |
| `bandie_songs` | Repertoire entries (planned) |
| `bandie_song_part_folders` | Part folders within a song (planned) |
| `bandie_song_files` | File metadata and storage paths (planned) |
| `bandie_setlists` | Setlist definitions (planned) |
| `bandie_setlist_songs` | Songs in setlist order (planned) |
| `bandie_calendar_events` | Rehearsals and availability windows (planned) |
| `bandie_availability_votes` | Member votes on events (planned) |
| `bandie_gigs` | Confirmed/proposed performances (planned) |
| `bandie_booking_enquiries` | Inbound organiser enquiries (planned — currently direct messages) |

Plus platform tables from multi-tenant guide (`platform_apps`, `platform_app_memberships`, etc.).

RLS policies must enforce band membership for all private data.

**Communications data access (`@bandie/data`):**
- `listPendingInvitationsForCurrentUser`, `acceptBandInvitation`, `declineBandInvitation`, `acceptAllPendingInvitations` — band invitations
- `listMyPendingPlayerOutreach`, `respondToPlayerOutreach`, `countMyPendingPlayerOutreach` — player outreach inbox
- `listMyMessages`, `sendDirectMessage`, `replyToMessage`, `markMessageRead`, `countUnreadMessages` — direct messages
- `listCommunications`, `filterCommunications`, `getCommunicationSummary`, `getNotificationSummary` — unified feed and nav badge
- RPCs: `bandie_list_my_pending_invitations`, `bandie_decline_invitation`, `bandie_list_my_pending_player_outreach`, `bandie_respond_to_player_outreach`, `bandie_list_my_messages`, `bandie_count_my_unread_messages`

**Band overview data access (`@bandie/data`):**
- `getBandLeaderContact`, `listBandLeaders` — RPCs for primary and all leader contact details
- `addBandLeader`, `removeBandLeader` — RPCs `bandie_add_band_leader`, `bandie_remove_band_leader` (any leader can add/remove co-leaders; last leader cannot be removed)
- `setPrimaryBandContact` — RPC `bandie_set_primary_band_contact` (assign primary public contact among active leaders)
- `assignBandLeader` — alias for `addBandLeader` (legacy name)
- `ensureBandLeader` — RPC `bandie_ensure_band_leader` (reconcile primary contact; interim admin fallback)
- `listBandParts`, `createBandPart`, `updateBandPart`, `deleteBandPart`, `createDefaultBandParts`, `syncBandSizeFromParts`, `assignMemberToPart` — lineup parts; syncs `bandie_bands.band_size`
- `createPlayerOutreach`, `listPlayerOutreachForBand` — RPC `bandie_create_player_outreach` (audition/join from player directory)
- Public profile roster: RPCs `bandie_list_public_band_members`, `bandie_get_public_band_primary_contact` (via `getPublicBandProfile`)
- Set/fee offers: managed via `updateBandProfile` / `replaceBandSetOffers`, `replaceBandDynamicFeeOffers`
- Leader contact fields on `UserProfile`: `contact_email`, `contact_phone` (via `updateUserProfile`)

**Organiser venues (`@bandie/data`):**
- `listMyOrganiserVenues`, `createOrganiserVenue`, `updateOrganiserVenue`, `deleteOrganiserVenue`
- `uploadOrganiserVenueImage`, `removeOrganiserVenueImage` — storage helpers

**Admin mode (`@bandie/data`):**
- `isCurrentUserAppAdmin`, `setBandieAdminModeActive`, `isBandieAdminModeActive` — client-side admin mode flag; admins bypass membership checks when active

**Usernames (`@bandie/data`):**
- `normalizeUsername`, `validateUsernameInput`, `ensureProfileUsername`
- Login accepts email or username (`signInWithEmailOrUsername`)
- Direct messages addressed by username

---

## 7. Storage

| Bucket | Purpose | Path pattern |
|---|---|---|
| `bandie-profile-images` | Band logos/heroes, user avatars, organiser venue photos | `bands/{band_id}/…`, `users/{user_id}/avatar.{ext}`, `venues/{venue_id}/…` |
| `bandie-song-files` | Song part files (planned) | `{band_id}/{song_id}/{part_folder_id}/{file_id}/{filename}` |

- Profile images: JPEG, PNG, WebP, GIF up to 5 MB
- Storage RLS uses `security definer` helpers (`bandie_can_manage_profile_image`, `bandie_can_manage_user_profile_image`)
- Song file size limits: TBD (document when decided)
- Supported MVP song types (planned): PDF, images, audio, Guitar Pro, ChordPro, DOCX, text

---

## 8. Authentication

- Supabase Auth (email + password)
- **Temporary:** email verification disabled to avoid Supabase auth email rate limits during early development; signup signs users in immediately. Re-enable `auth.email.enable_confirmations` in Supabase when Resend SMTP verification is restored.
- Signup requires password confirmation; password fields include show/hide toggle
- Flows: register, login, logout, password reset
- Session persisted in `localStorage` with auto-refresh and URL detection
- Sign-out navigates to `/` before clearing session (avoids redirect to `/login`)
- Post-auth routing based on band membership and pending invitations/outreach (`routeAfterAuth`); pending items route to `/app/communications`
- App membership via `platform_user_app_memberships` (multi-tenant pattern)
- Display name resolution: profile `display_name` → auth `user_metadata.display_name` → email local-part → `"Band member"`

---

## 9. Web application structure

```
apps/web/src/
├── components/
│   ├── app/           App shell (layout, header, band switcher)
│   ├── auth/          Auth layout, protected/guest routes, workspace mode route
│   ├── band/          Band workspace (overview tabs, leader section, lineup parts, profile editor, members, invitations)
│   ├── bands/         Band cards (My bands, workspace)
│   ├── communications/ Invitations, player outreach, messages panels and unified feed
│   ├── directory/     Band and player directory filters and cards
│   ├── marketing/     Public homepage nav and sections (three-mode layout)
│   ├── organiser/     Organiser venue forms and cards
│   └── profile/       Profile editors, public profile views, booking contact card
├── content/           Static content configs (e.g. homepageContent.ts)
├── context/           AuthContext (session, profile, bands, displayName)
├── pages/
│   ├── app/           Protected workspace pages
│   └── auth/          Login, signup, password reset
├── lib/               Client init, helpers, hooks (`brand.ts` — shared logo mark)
├── styles/            auth.css, directory.css, communications.css, workspace.css, bandProfile.css, brand.css
└── main.tsx           BrowserRouter + AuthProvider
```

Homepage component breakdown per `bandie_homepage_functional_technical_spec.md` §13.3.

---

## 10. Design tokens (Bandie brand)

From homepage spec — use consistently across public pages:

```ts
colors: {
  background: '#0b0d12',
  backgroundAlt: '#111521',
  paper: '#f8f2e8',
  text: '#f8f4ec',
  muted: '#bdb7ab',
  accent: '#ffcf4a',
  accentPink: '#ff5e7e',
  accentTeal: '#55e0c0',
}
```

Breakpoints: mobile 0–639px, tablet 640–1023px, desktop 1024px+.

**Logo mark:** lowercase **b** in white on a gradient rounded tile (42×42px homepage; scaled variants elsewhere). Constants: `BANDIE_BRAND_MARK`, `BANDIE_BRAND_NAME` in `apps/web/src/lib/brand.ts`; letter sizing in `apps/web/src/styles/brand.css`. Do not use uppercase **B**.

## 11. Routing (implemented)

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Marketing homepage |
| `/bands` | Public | Band directory |
| `/bands/:slug` | Public | Public band profile |
| `/players` | Public | Player directory |
| `/players/:profileId` | Public | Public player profile |
| `/invite/:token` | Public | Accept band invitation |
| `/signup` | Guest | Registration |
| `/login` | Guest | Login |
| `/forgot-password` | Guest | Request password reset |
| `/reset-password` | Auth | Set new password |
| `/app` | Protected | My bands hub |
| `/app/communications` | Protected | Communications hub (invitations, player outreach, messages) |
| `/app/notifications` | Protected | Redirects to `/app/communications` |
| `/app/invites` | Protected | Redirects to `/app/communications` |
| `/app/profile` | Protected | Musician / player profile editor |
| `/app/players` | Protected | Player directory (find members or deps); supports `?forBand=&part=&instrument=` for lineup recruitment |
| `/app/players/:profileId` | Protected | Workspace player profile with invite panel when recruiting from a band part |
| `/app/bands` | Protected | Band directory (workspace view) |
| `/app/bands/new` | Protected | Create band |
| `/app/venues` | Protected (organiser mode) | Organiser venues |
| `/app/profiles/:profileId/edit` | Protected (admin mode) | Admin edit player profile |
| `/app/:bandId` | Protected | Band workspace overview (Members / Band details tabs) |

Legacy routes `/app/:bandId/profile` and `/app/:bandId/members` redirect to overview.

---

## 12. Analytics

Provider-neutral `trackEvent()` in `@bandie/utils`. Homepage events per `bandie_homepage_functional_technical_spec.md` §16.

---

## 13. Testing requirements

Per `RSD_TESTING_STRATEGY.md`:

- Unit tests: utilities, hooks, data-access functions
- Component tests: core UI, complex interactions
- CI must pass lint, test, and build before merge

---

## 14. CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. Install (`npm ci`)
2. Lint
3. Build (all workspaces)

Netlify deploys from `main` using `netlify.toml` with SPA redirects.

Supabase migrations applied via `supabase db push` to `proff-rsd-mt-1`.

---

## 15. Security requirements

- RLS on all band-scoped tables
- Private file URLs must not be guessable; use signed URLs where appropriate
- Input validation on all public forms (booking enquiry)
- Rate limiting on enquiry submission (future Edge Function)
- No secrets in client bundle or repository

---

## 16. Deferred technical decisions

| Topic | Options | Resolve before |
|---|---|---|
| Tailwind vs CSS modules | CSS modules / scoped CSS in use | Resolved |
| Vitest vs Jest | Vitest fits Vite; Jest per RSD | First test pack |
| Real-time (Supabase Realtime) | Availability voting live updates | Calendar feature |
| SSR/prerender for SEO | Vite plugin vs Next.js | Public profile launch |

Record decisions in this document when resolved.
