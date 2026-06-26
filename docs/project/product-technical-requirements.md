# Bandie — Product Technical Requirements

**Document status:** Authoritative technical requirements  
**Product:** Bandie  
**Last updated:** 26 June 2026

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
| `bandie_bands` | Band workspace + public profile |
| `bandie_band_memberships` | User ↔ band with roles |
| `bandie_songs` | Repertoire entries |
| `bandie_song_part_folders` | Part folders within a song |
| `bandie_song_files` | File metadata and storage paths |
| `bandie_setlists` | Setlist definitions |
| `bandie_setlist_songs` | Songs in setlist order |
| `bandie_calendar_events` | Rehearsals and availability windows |
| `bandie_availability_votes` | Member votes on events |
| `bandie_gigs` | Confirmed/proposed performances |
| `bandie_booking_enquiries` | Inbound organiser enquiries |

Plus platform tables from multi-tenant guide (`platform_apps`, `platform_app_memberships`, etc.).

RLS policies must enforce band membership for all private data.

---

## 7. Storage

- Bucket: `bandie-song-files` (and others as needed)
- Path pattern: `{band_id}/{song_id}/{part_folder_id}/{file_id}/{filename}`
- File size limits: TBD (document when decided)
- Supported MVP types: PDF, images, audio, Guitar Pro, ChordPro, DOCX, text

---

## 8. Authentication

- Supabase Auth with email verification (Resend SMTP)
- Flows: register, login, logout, password reset
- Post-auth routing based on band membership state
- App membership via `platform_app_memberships` (multi-tenant pattern)

---

## 9. Web application structure

```
apps/web/src/
├── components/
│   ├── marketing/     Public pages (homepage, etc.)
│   └── ui/            App-specific UI (or import from @bandie/ui)
├── content/           Static content configs (e.g. homepageContent.ts)
├── pages/             Route-level pages
├── hooks/
├── lib/
└── main.tsx
```

Homepage component breakdown per `bandie_homepage_functional_technical_spec.md` §13.3.

---

## 10. Design tokens (Bandie brand)

From homepage spec — use consistently across public pages:

```ts
colors: {
  background: '#101014',
  panel: '#191922',
  panelSoft: '#222230',
  text: '#f6f3ea',
  muted: '#bbb6aa',
  accent: '#ffcc33',
  accentPink: '#ff5e7e',
  accentGreen: '#61e3c2',
}
```

Breakpoints: mobile 0–639px, tablet 640–1023px, desktop 1024px+.

---

## 11. Routing (planned)

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/bands` | Directory |
| `/bands/:slug` | Public band profile |
| `/book/:slug` | Booking enquiry |
| `/signup` | Registration |
| `/login` | Login |
| `/app` | Private workspace entry (auth required) |
| `/app/:bandId/...` | Band-scoped workspace routes |

MVP may use placeholder routes until downstream pages exist.

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

## 14. CI/CD (to be implemented)

GitHub Actions pipeline:

1. Install (npm ci)
2. Lint
3. Test
4. Build `@bandie/web`
5. Deploy to Netlify (staging/production)

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
| Tailwind vs CSS modules | Either; match mockups | Homepage styling task |
| Vitest vs Jest | Vitest fits Vite; JLS per RSD | First test pack |
| Real-time (Supabase Realtime) | Availability voting live updates | Calendar feature |
| SSR/prerender for SEO | Vite plugin vs Next.js | Public profile launch |

Record decisions in this document when resolved.
