# Bandie Song Suggestions & Voting — Implementation Plan

**Product:** Bandie  
**Source spec:** [`bandie_song_suggestions_voting_spec.md`](./bandie_song_suggestions_voting_spec.md)  
**Document type:** Implementation task plan (progress tracking)  
**Status:** Not started  
**Created:** 1 July 2026  
**Intended audience:** Engineering, Cursor implementation workflow  

---

## How to use this document

- Check boxes as work completes: `- [ ]` → `- [x]`
- **Do not** treat this file as a substitute for `docs/PROJECT_STATUS_TRACKER.md` — when phases land, add a tracker phase and update `product-functional-requirements.md` / `product-technical-requirements.md`
- Follow `.cursorrules` reading order and RLS checklist (`.cursor/rules/supabase-rls.mdc`) for all schema work
- All Supabase access must go through `@bandie/data`; UI must not call Supabase directly

---

## 1. Executive summary

Implement **Song Suggestion Groups**: leader-created, time-boxed spaces where approved band members (including free-tier) suggest songs and vote with three sentiment states (Happy / Meh / Rather not). Leaders close suggestions, confirm a top-N selection, and optionally create a skeleton setlist with draft catalogue songs.

Delivery is split into **four implementation phases** matching spec §18, decomposed into concrete schema, data, UI, and integration tasks below.

---

## 2. Locked product defaults (spec §20)

These decisions are **fixed for v1** unless explicitly revisited:

| Decision | v1 default |
|---|---|
| Who can suggest / vote | All **approved** band members, including free-tier |
| Submitter auto-vote | Auto-set to `happy_to_play` on submit |
| Vote visibility | **Leader sets at group creation:** `member_visible` or `aggregate_only`; leader always sees per-member votes |
| Suggestion vs voting windows | **Separate** — voting stays open after suggestions close until leader closes voting, voting deadline passes, or leader confirms |
| Confirm before all votes | Allowed with leader warning |
| Leader veto | **Yes** — veto with required reason; status `leader_vetoed`; excluded from ranking |
| Final selection | System proposes top N; leader may override at confirm with **required reason** |
| Ties | Leader may **reset votes** (re-vote) or **decide** at confirm |
| Confirmed output | Frozen snapshot in `bandie_song_suggestion_confirmed_songs` |
| Skeleton setlist | Creates **draft catalogue songs** (`readiness_status: not_started`) where missing |
| Open groups per band | **Unlimited** for v1 |
| Band Admin role | **No** — leader-only for v1 |
| `draft` group status | **No** — create groups directly as `open_for_suggestions` |
| Member comments on votes | **Defer UI** — `allow_member_comments` + `comment` column in schema |
| Email / push notifications | **Defer** — in-app activity feed first |

---

## 3. Existing codebase alignment

Reuse these patterns — do not reinvent:

| Area | Reference |
|---|---|
| Member voting UX | `packages/data/src/calendar.ts`, `apps/web/src/pages/app/CalendarPage.tsx` |
| Band-scoped RLS | `supabase/migrations/20260630120000_bandie_calendar.sql`, `bandie_current_user_is_band_member()`, `bandie_current_user_owns_band()` |
| Leader-only writes | `isBandLeaderRole()`, `SETLIST_LEADER_ONLY_MESSAGE`, calendar leader checks |
| Entitlement gates | `assertCanPerform()` — `setlist.create` / `setlists.max_count` for skeleton setlist; **no** gate on suggest/vote |
| Song catalogue | `packages/data/src/songs.ts` — `createBandSong()`, `SongReadinessStatus` |
| Setlists | `packages/data/src/setlists.ts` — `createBandSetlist()`, setlist items |
| Songs dashboard shell | `apps/web/src/pages/app/SongsDashboardPage.tsx`, `SongsBandContextBar` |
| Routes | `apps/web/src/App.tsx` — band routes under `/app/:bandId/…` |
| Analytics stub | `packages/utils/src/analytics.ts`, `apps/web/src/lib/analytics.ts` |

**Net-new surface:**

- 5 tables + 1 view (per spec §7)
- `packages/data/src/songSuggestions.ts` (or split: `songSuggestionGroups.ts`, `songSuggestionVotes.ts`)
- Web routes: `/app/:bandId/songs/suggestions`, `/app/:bandId/songs/suggestions/:groupId`, confirm sub-route or modal
- Styles: `apps/web/src/styles/songSuggestions.css`

---

## 4. Pre-implementation checklist

- [ ] Read source spec end-to-end
- [ ] Read `docs/project/product-functional-requirements.md` (Songs, Setlists sections)
- [ ] Read `docs/RSD_DATA_MODELLING_GUIDE.md` and `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`
- [ ] Confirm no conflicting `bandie_song_suggestion_*` migrations already exist
- [ ] Agree phase order with `docs/DELIVERY_TASK_MAP.md` (likely new tracker **Phase 20**)
- [ ] Add capability key decision: introduce `song_suggestion.create` or reuse leader role only for v1 → **leader role only for v1**

---

## 5. Phase 1 — Core collaboration (MVP)

**Goal:** Leaders create groups; members suggest and vote; leaders close suggestions and confirm top N.  
**Exit criteria:** Spec acceptance criteria §17.1–17.5 pass manually in dev; RLS smoke-tested as leader + member + non-member.

### 5.1 Database schema & RLS

**Migration:** `supabase/migrations/20260701140000_bandie_song_suggestions.sql` (timestamp may shift)

- [ ] **5.1.1** Create `bandie_song_suggestion_groups` per spec §7.1.1
  - [ ] Include `vote_visibility` (`member_visible` \| `aggregate_only`)
  - [ ] `skeleton_setlist_id` nullable FK → `bandie_setlists(id)` (add FK in Phase 2 migration if circular dependency)
  - [ ] `updated_at` trigger via `set_updated_at()`
- [ ] **5.1.2** Create `bandie_song_suggestions` per spec §7.1.2
  - [ ] Status includes `leader_vetoed`; veto reason columns
  - [ ] FK `existing_catalogue_song_id` → `bandie_songs(id)`
  - [ ] Status enum check includes `leader_vetoed`
- [ ] **5.1.3** Create `bandie_song_suggestion_votes` per spec §7.1.3
  - [ ] Unique `(suggestion_id, member_user_id)`
- [ ] **5.1.4** Create `bandie_song_suggestion_group_events` per spec §7.1.4
- [ ] **5.1.5** Create `bandie_song_suggestion_confirmed_songs` per spec §7.1.5
- [ ] **5.1.6** Indexes per spec §8
- [ ] **5.1.7** Enable RLS on all five tables
- [ ] **5.1.8** **Select policies** — approved band members can read rows where `band_id` matches membership (`bandie_current_user_is_band_member`)
- [ ] **5.1.9** **Insert group** — band leader only (`bandie_current_user_owns_band`)
- [ ] **5.1.10** **Update group** — leader only; restrict updates when `status` in (`confirmed`, `archived`, `cancelled`)
- [ ] **5.1.11** **Insert suggestion** — active member + group `open_for_suggestions` + before `suggestion_closes_at` (enforce in RPC as well)
- [ ] **5.1.12** **Update/delete own suggestion** — submitter only, before voting begins / while `open_for_suggestions` per spec §4.2
- [ ] **5.1.13** **Vote policies** — member upsert own vote; readable by band members
- [ ] **5.1.14** **Confirmed snapshot** — insert via security definer RPC only
- [ ] **5.1.15** **Events table** — insert via RPC; select for band members
- [ ] **5.1.16** Create view `bandie_song_suggestion_vote_summary` per spec §11
- [ ] **5.1.17** `supabase db push` + manual RLS smoke test (leader, member, outsider)
- [ ] **5.1.18** Update `supabase/migrations/README.md`

### 5.2 Security definer RPCs (state-changing)

Prefer RPCs for transitions that need validation + audit (spec §10).

- [ ] **5.2.1** `bandie_create_song_suggestion_group(...)` — validate dates, target count; set `open_for_suggestions`; write event
- [ ] **5.2.2** `bandie_submit_song_suggestion(...)` — duplicate check (warn payload, not block); max-per-member check; auto-vote submitter `happy_to_play`; write event
- [ ] **5.2.3** `bandie_vote_on_song_suggestion(...)` — validate voting window + `allow_vote_changes`; write event on change
- [ ] **5.2.4** `bandie_close_song_suggestions(p_group_id)` — leader only → `suggestions_closed`
- [ ] **5.2.5** `bandie_reopen_song_suggestions(p_group_id, p_new_closes_at)` — leader only; require future date if prior passed
- [ ] **5.2.6** `bandie_close_song_suggestion_voting(p_group_id)` — leader only → `voting_closed`
- [ ] **5.2.7** `bandie_confirm_song_suggestion_group(...)` — leader only; rank snapshot; confirmed table; exclude `leader_vetoed`
- [ ] **5.2.8** `bandie_veto_song_suggestion(...)`, `bandie_reset_song_suggestion_votes(...)` — leader only; audit events
- [ ] **5.2.9** `grant execute` to `authenticated` for each RPC
- [ ] **5.2.10** Document RPC contracts in migration comments

### 5.3 `@bandie/data` module

**File:** `packages/data/src/songSuggestions.ts`

- [ ] **5.3.1** TypeScript types mirroring DB rows + joined summaries
  - [ ] `SongSuggestionGroupStatus`, `SongSuggestionVoteState`, `SongSuggestionStatus`
  - [ ] `SongSuggestionGroup`, `SongSuggestion`, `SongSuggestionVote`, `SongSuggestionWithVotes`, `SongSuggestionRanked`
- [ ] **5.3.2** Label/format helpers (`formatVoteState`, `formatGroupStatus`, status pill class)
- [ ] **5.3.3** `listBandSongSuggestionGroups(bandId)` — active + historical, with counts
- [ ] **5.3.4** `getSongSuggestionGroup(groupId)` — header + brief
- [ ] **5.3.5** `getSongSuggestionGroupDetail(groupId)` — suggestions + vote summary + current user votes
- [ ] **5.3.6** `createSongSuggestionGroup(input)` — calls RPC; leader `assertCanPerform` optional (role check in RPC)
- [ ] **5.3.7** `submitSongSuggestion(groupId, input)` — returns duplicate warning metadata if applicable
- [ ] **5.3.8** `voteOnSongSuggestion(suggestionId, voteState)` 
- [ ] **5.3.9** `closeSongSuggestions`, `reopenSongSuggestions`, `closeSongSuggestionVoting`, `vetoSongSuggestion`, `resetSongSuggestionVotes`
- [ ] **5.3.10** `getRankedSongSuggestions(groupId)` — uses view + ranking order from spec §5.5.4
- [ ] **5.3.11** `confirmSongSuggestionGroup(groupId, selection)` — leader-adjusted top N + override reasons
- [ ] **5.3.12** `listSongSuggestionGroupEvents(groupId)` — activity feed
- [ ] **5.3.13** Pure functions: `calculateSuggestionScore`, `rankSuggestions`, `computeVoteCompletion(activeMembers, votes)`
- [ ] **5.3.14** Export from `packages/data/src/index.ts`
- [ ] **5.3.15** Constants: `SONG_SUGGESTION_LEADER_ONLY_MESSAGE`, genre/decade option lists (align with directory/profile enums where they exist)

### 5.4 Web routes & navigation

- [ ] **5.4.1** Register routes in `apps/web/src/App.tsx`
  - [ ] `/app/:bandId/songs/suggestions` — dashboard
  - [ ] `/app/:bandId/songs/suggestions/:groupId` — detail
  - [ ] `/app/:bandId/songs/suggestions/:groupId/confirm` — leader review (or modal on detail page)
- [ ] **5.4.2** Add `songSuggestions` to `apps/web/src/lib/bandRoutes.ts` reserved segments if needed
- [ ] **5.4.3** Band workspace nav link: **Songs → Suggestions** in `appNavigation.ts` (under Songs context)
- [ ] **5.4.4** `SongsBandContextBar` — optional tab/link to suggestions

### 5.5 UI components (Phase 1)

**Styles:** `apps/web/src/styles/songSuggestions.css` (dark shell + light modals per RSD UX §6.4–6.5)

- [ ] **5.5.1** `SongSuggestionGroupsPage` — list active/historical cards (spec §6.1.1)
- [ ] **5.5.2** `SongSuggestionGroupCard` — name, status pill, counts, dates, CTA
- [ ] **5.5.3** `CreateSuggestionGroupModal` — form fields spec §5.2.2 including **vote visibility** selector
- [ ] **5.5.4** `SuggestionGroupDetailPage` — header, brief panel, suggestions list, leader actions
- [ ] **5.5.5** `SuggestionGroupHeader` — status, deadlines, vote completion
- [ ] **5.5.6** `SuggestionBriefPanel` — genre/decade/vocal tags, target N
- [ ] **5.5.7** `SongSuggestionFormModal` — spec §5.4.2 fields; URL validation (`https://` only)
- [ ] **5.5.8** `SongSuggestionCard` or table row — title, artist, media links (sanitised), suggester
- [ ] **5.5.9** `VoteButtons` — spec §12.1 (`happy_to_play` | `meh` | `rather_not`)
- [ ] **5.5.10** `VoteSummaryPills` — respect `vote_visibility` (hide per-member breakdown for members when `aggregate_only`)
- [ ] **5.5.11** `VoteCompletionIndicator` — “4 members still to vote”
- [ ] **5.5.12** `LeaderActionPanel` — close suggestions, reopen, close voting, **veto**, **reset votes**
- [ ] **5.5.13** Duplicate warning dialog on submit (spec §14.3)
- [ ] **5.5.14** Empty states per spec §6.3
- [ ] **5.5.15** Mobile-first layout; 44px+ tap targets on vote buttons

### 5.6 Confirmation flow (Phase 1)

- [ ] **5.6.1** `ConfirmSelectionPage` or leader modal — ranked list, top N preview (spec §6.1.3)
- [ ] **5.6.2** `RankedSuggestionList` — score breakdown, proposed rank
- [ ] **5.6.3** Tie highlighting at cutoff (spec §14.2)
- [ ] **5.6.4** Manual include/exclude with required override reason textarea
- [ ] **5.6.5** Warning when fewer than target N suggestions (spec §14.1)
- [ ] **5.6.6** Warning when not all members voted (spec §5.7.3)
- [ ] **5.6.7** `ConfirmedResultView` — read-only selected vs not selected (spec §6.1.4)

### 5.7 Songs dashboard integration (Phase 1)

- [ ] **5.7.1** Panel on `SongsDashboardPage` — active groups summary (spec §5.1)
- [ ] **5.7.2** “New song suggestion group” button (leader only)

### 5.8 Phase 1 documentation

- [ ] **5.8.1** Add Phase 20 section to `docs/PROJECT_STATUS_TRACKER.md`
- [ ] **5.8.2** Add functional requirements subsection to `product-functional-requirements.md`
- [ ] **5.8.3** Add tables + module to `product-technical-requirements.md`
- [ ] **5.8.4** Note in `docs/DELIVERY_TASK_MAP.md` (optional phase pointer)

### 5.9 Phase 1 acceptance verification

- [ ] **5.9.1** AC §17.1 Create group
- [ ] **5.9.2** AC §17.2 Suggest songs (including free-tier member)
- [ ] **5.9.3** AC §17.3 Vote + change vote
- [ ] **5.9.4** AC §17.4 Manual close suggestions (voting stays open)
- [ ] **5.9.5** AC §17.5 Confirm selection + frozen snapshot

---

## 6. Phase 2 — Setlist & catalogue integration

**Goal:** From a confirmed group, leader creates skeleton setlist and draft catalogue songs.  
**Exit criteria:** Spec §17.6; setlist appears in setlist dashboard; songs linkable from suggestion source.

### 6.1 Schema additions

- [ ] **6.1.1** Migration: `skeleton_setlist_id` FK on groups → `bandie_setlists`
- [ ] **6.1.2** Optional: `source_suggestion_group_id` on `bandie_setlists` (provenance)
- [ ] **6.1.3** Optional: `source_suggestion_id` on `bandie_songs` (provenance)
- [ ] **6.1.4** Populate `created_catalogue_song_id` / `created_setlist_item_id` on confirmed snapshot rows

### 6.2 Data layer

- [ ] **6.2.1** RPC `bandie_create_skeleton_setlist_from_suggestion_group(p_group_id, p_options)`
  - [ ] Verify group `status = confirmed`
  - [ ] For each confirmed song: find or `createBandSong` with `not_started`, metadata from suggestion
  - [ ] `createBandSetlist` with `status: draft`, vibe from group genre
  - [ ] Add setlist items in rank order
  - [ ] `assertCanPerform({ capability: 'setlist.create', … })` inside wrapper
- [ ] **6.2.2** `createSkeletonSetlistFromSuggestionGroup(groupId, options)` in `@bandie/data`
- [ ] **6.2.3** Handle catalogue duplicate: link existing `bandie_songs` row instead of creating duplicate

### 6.3 UI

- [ ] **6.3.1** `CreateSkeletonSetlistModal` — name default, preview song list (spec §5.9.3)
- [ ] **6.3.2** CTA on confirmed result view: “Create skeleton setlist”
- [ ] **6.3.3** `UpgradePromptModal` when `setlist.create` blocked
- [ ] **6.3.4** Navigate to `/app/:bandId/setlists/:setlistId` on success
- [ ] **6.3.5** Setlists dashboard entry: “Create from confirmed song vote” when confirmed groups exist without setlist

### 6.4 Phase 2 acceptance

- [ ] **6.4.1** AC §17.6 skeleton setlist created with correct songs/order
- [ ] **6.4.2** Draft catalogue songs created when missing
- [ ] **6.4.3** Entitlement gate shows upgrade prompt for free leader over setlist limit

---

## 7. Phase 3 — Automation, activity & polish

**Goal:** Scheduled closes, reminders, filters, analytics, member comments (optional).  
**Exit criteria:** Groups auto-close on deadline; activity visible; filters work; analytics events fire.

### 7.1 Scheduled / background processing

- [ ] **7.1.1** Design job runner approach (Supabase `pg_cron`, Edge Function cron, or Netlify scheduled function)
- [ ] **7.1.2** Job: auto-close suggestions when `now() > suggestion_closes_at` and status `open_for_suggestions`
- [ ] **7.1.3** Job: auto-close voting when `voting_closes_at` set and passed
- [ ] **7.1.4** Idempotent status transitions + event log entries
- [ ] **7.1.5** “Closing soon” notifications (24h / 48h — product choice)

### 7.2 Notifications & activity

- [ ] **7.2.1** Map event types to in-app activity feed on group detail page
- [ ] **7.2.2** Surface unread/count in communications summary (if feasible without large refactor)
- [ ] **7.2.3** Leader “Send reminder to vote” action (spec §5.7.3) — creates messages or notification records
- [ ] **7.2.4** Defer email/push per spec §6.4

### 7.3 Filters & sorting (spec §6.2)

- [ ] **7.3.1** Search song / artist
- [ ] **7.3.2** Filter: needs my vote, my vote state
- [ ] **7.3.3** Filter: suggested by, genre, decade
- [ ] **7.3.4** Sort: score, happy, rather-not, newest, artist, title
- [ ] **7.3.5** Toggle: show top N only

### 7.4 Member comments (if `allow_member_comments`)

- [ ] **7.4.1** Comment field on vote RPC + UI
- [ ] **7.4.2** Display comments on suggestion card (band-visible)

### 7.5 Analytics (spec §16)

- [ ] **7.5.1** `song_suggestion_group_created`
- [ ] **7.5.2** `song_suggestion_added`
- [ ] **7.5.3** `song_suggestion_vote_cast` / `song_suggestion_vote_changed`
- [ ] **7.5.4** `song_suggestions_closed`, `song_suggestion_voting_closed`
- [ ] **7.5.5** `song_suggestion_group_confirmed`, `song_suggestion_setlist_created`

### 7.6 Export / share (optional polish)

- [ ] **7.6.1** Copy summary to clipboard (markdown/plain)
- [ ] **7.6.2** Defer PDF export

---

## 8. Phase 4 — Enhanced decision support (post-MVP)

**Defer until Phases 1–3 ship.** Track as backlog:

- [ ] **8.1** Richer duplicate detection (catalogue + fuzzy title/artist)
- [ ] **8.2** `draft` group status + publish workflow
- [ ] **8.3** Band Admin role parity in permission matrix
- [ ] **8.4** Entitlement: max open groups per band / leader tier (spec §19.7)
- [ ] **8.5** Set-flow suggestions (tempo, key, energy) — spec §18 Phase 3
- [ ] **8.6** External metadata enrichment (Spotify/YouTube embeds) — spec §18 Phase 4
- [ ] **8.7** Archive / cancel group flows + UI
- [ ] **8.8** Edit group brief while open (non-destructive fields only)

---

## 9. Testing strategy

> Jest is mandated by `.cursorrules`; `@bandie/data` currently has no test runner configured. Prioritise pure-function tests when harness is added.

### 9.1 Unit tests (`packages/data`)

- [ ] **9.1.1** `calculateSuggestionScore` / ranking tie-break order
- [ ] **9.1.2** `computeVoteCompletion` with inactive members excluded
- [ ] **9.1.3** Duplicate detection normalisation (title + artist)
- [ ] **9.1.4** Date/window validation helpers

### 9.2 Integration / manual QA

- [ ] **9.2.1** RLS: non-member cannot read group
- [ ] **9.2.2** RLS: member cannot create group
- [ ] **9.2.3** RLS: member can vote but not confirm
- [ ] **9.2.4** Submit after suggestion close rejected (spec §14.5)
- [ ] **9.2.5** Vote after voting close rejected (spec §14.6)
- [ ] **9.2.6** Member removed — cannot access; historical data retained
- [ ] **9.2.7** XSS: external URLs rendered safely (`rel="noopener noreferrer"`)

### 9.3 CI

- [ ] **9.3.1** `npm run build` green
- [ ] **9.3.2** Add test script to `packages/data` when jest/vitest configured

---

## 10. Security checklist

- [ ] RLS enabled on all new tables (same migration)
- [ ] State transitions via security definer RPCs where client cannot bypass status rules
- [ ] No service-role key in client
- [ ] User media URLs: validate scheme, no `javascript:` URLs
- [ ] Leader-only confirm/close enforced server-side, not UI-only
- [ ] Audit events for confirm, close, reopen, override

---

## 11. Resolved product decisions

**Confirmed 1 July 2026** — see spec §19.

| # | Question | Resolution |
|---|---|---|
| 1 | Auto-default submitter vote? | Yes — `happy_to_play` |
| 2 | Individual votes visible? | **Leader sets at creation** — `member_visible` or `aggregate_only`; leader always sees detail |
| 3 | Require all votes before confirm? | No — warn only |
| 4 | Leader control | **Veto** with reason + include/exclude at confirm with override reason |
| 5 | Auto-close voting on suggestion date? | No — separate windows |
| 6 | Auto catalogue on confirm vs on setlist? | On skeleton setlist create |
| 7 | Max open groups per tier? | Unlimited v1 |

**Also confirmed:** Band Admin no; no draft group; vote comments defer (schema only); email defer; ties → reset votes or leader decides.

---

## 12. Task summary by layer

| Layer | Phase 1 tasks | Phase 2 | Phase 3 |
|---|---|---|---|
| Migrations / RLS | 5.1, 5.2 | 6.1 | 7.1 |
| `@bandie/data` | 5.3 | 6.2 | 7.5 |
| Web UI | 5.4–5.7 | 6.3 | 7.3–7.4 |
| Docs / tracker | 5.8 | — | — |
| QA | 5.9 | 6.4 | 9.x |

---

## 13. Suggested implementation order (sprint-sized)

1. **Sprint A:** 5.1 + 5.2 (schema, RLS, RPCs) + `db push`
2. **Sprint B:** 5.3 data module + ranking view queries
3. **Sprint C:** 5.4–5.5 (dashboard, create group, detail, suggest, vote)
4. **Sprint D:** 5.6–5.7 (confirm flow, songs dashboard panel)
5. **Sprint E:** 6.x setlist + catalogue integration
6. **Sprint F:** 7.x automation, filters, analytics, docs finalisation

---

## 14. References

- Functional spec: [`bandie_song_suggestions_voting_spec.md`](./bandie_song_suggestions_voting_spec.md)
- Product FR: `docs/project/product-functional-requirements.md`
- Product TR: `docs/project/product-technical-requirements.md`
- Tracker: `docs/PROJECT_STATUS_TRACKER.md`
- RLS rules: `.cursor/rules/supabase-rls.mdc`
- UX light surfaces: `docs/RSD_UX_DESIGN_FRAMEWORK.md` §6.4–6.5
