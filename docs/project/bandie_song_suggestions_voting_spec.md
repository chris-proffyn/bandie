# Bandie Song Suggestions and Voting — Functional and Technical Specification

**Product:** Bandie  
**Feature area:** Songs and Repertoire Management / Setlist Management / Band Workspace  
**Document status:** Draft specification for implementation  
**Intended audience:** Product, design, engineering, Cursor implementation workflow  
**Last updated:** 30 June 2026  

**Implementation plan:** [`bandie_song_suggestions_voting_implementation_plan.md`](./bandie_song_suggestions_voting_implementation_plan.md) — task checklist for engineering delivery.

---

## 1. Executive Summary

Bandie needs a structured way for band leaders to involve the whole band in deciding which new songs should be added to the band catalogue. This feature introduces **Song Suggestion Groups**: time-boxed, leader-created proposal spaces where band members can suggest songs and vote on them using a simple three-state sentiment model.

The feature supports the following workflow:

1. A band leader creates a named song suggestion group, for example **Summer Swing Songs**.
2. The leader defines the brief: preferred genre, decade, vocal gender, number of songs required, and closing date for suggestions.
3. Approved band members, including free-tier members, can submit song suggestions with artist and reference media links such as YouTube or Spotify.
4. Everyone in the band can vote on submitted songs using one of three states:
   - Happy to play 🙂
   - Meh 😐
   - Rather not 🙁
5. The band leader can close suggestions manually, or suggestions close automatically after the configured closing date.
6. Voting can continue after suggestions are closed until the leader confirms the result or until a voting deadline has passed, depending on configuration.
7. The leader confirms the final selection. The top **N** songs are frozen, where **N** is the target number of songs specified by the leader.
8. From the confirmed selection, the leader can create a skeleton setlist containing the selected songs.

The feature is deliberately collaborative. It should allow non-paying/free-tier band members to participate in suggesting and voting because the value comes from whole-band engagement. However, leader-only controls such as creating suggestion groups, closing suggestions, confirming a selection, and creating a skeleton setlist may remain gated by the band leader role and any relevant paid entitlement rules.

---

## 2. Product Context

Bandie already includes a private band workspace where approved band members manage operational activity. The existing product model includes Songs and Repertoire Management, Song Folder / Song Workspace, and Setlist Management as distinct but related feature areas. This feature extends those areas by adding a collaborative intake process before songs are added to the confirmed band catalogue.

### 2.1 Existing Area Fit

This feature sits inside the private band domain and should be scoped to a single band.

It relates to:

- **Songs and Repertoire Management** — confirmed songs eventually become catalogue entries.
- **Song Folder / Song Workspace** — selected songs may later need part folders and uploaded music sheets.
- **Setlist Management** — confirmed songs can be used to generate a skeleton setlist.
- **Band Account, Workspace and Membership** — only approved band members can access the feature.
- **Notifications and Activity** — members should be notified when suggestion groups are created, songs are added, suggestions close, voting is needed, and results are confirmed.

---

## 3. Goals and Non-Goals

## 3.1 Goals

The feature should:

- Give band leaders a structured way to ask for new song ideas.
- Allow all approved band members, including free-tier members, to suggest songs.
- Allow all approved band members to vote on suggestions.
- Make voting lightweight and non-confrontational using three simple sentiment states.
- Support a target number of songs to select from a larger suggestion pool.
- Allow the leader to close suggestions while keeping voting open.
- Allow the leader to freeze a final top-N selection.
- Allow the leader to create a skeleton setlist from the selected songs.
- Preserve a clear audit trail of who suggested what and when.
- Prevent duplicate, accidental, or unauthorised submissions where possible.

## 3.2 Non-Goals for Initial Release

The initial release does not need to:

- Automatically import metadata from Spotify, YouTube, MusicBrainz, or other external music services.
- Validate whether a song is legally playable or whether sheet music can be distributed.
- Store copyrighted lyrics, tabs, or sheet music as part of the suggestion workflow.
- Provide anonymous voting.
- Provide weighted voting by role or seniority.
- Automatically create full song folders with uploaded parts.
- Optimise the final list for tempo, key, genre balance, vocalist suitability, or set flow.
- Allow non-band-members or public users to submit suggestions.

---

## 4. User Roles and Permissions

## 4.1 Roles

| Role | Description |
|---|---|
| Band Leader | Primary coordinator of a band workspace. Can create, configure, close and confirm song suggestion groups. |
| Band Admin | Optional elevated member role. May be allowed to manage suggestion groups if permissions are configured that way. |
| Approved Band Member | A user who has been approved into the band. Can suggest songs and vote. |
| Free-Tier Band Member | An approved band member without a paid subscription. Can suggest songs and vote. |
| Pending Member | A user who has requested access but has not been approved. Cannot access suggestion groups. |
| Removed Member | A user removed from the band. Cannot access suggestion groups. Historical suggestions and votes remain in audit history unless anonymisation is required later. |

## 4.2 Permission Matrix

| Action | Band Leader | Band Admin | Approved Member | Free-Tier Member | Pending / Removed |
|---|---:|---:|---:|---:|---:|
| View suggestion groups | Yes | Yes | Yes | Yes | No |
| Create suggestion group | Yes | Optional | No | No | No |
| Edit suggestion group brief | Yes | Optional | No | No | No |
| Submit song suggestion | Yes | Yes | Yes | Yes | No |
| Edit own suggestion before closure | Yes | Yes | Yes | Yes | No |
| Delete own suggestion before voting begins | Yes | Yes | Yes | Yes | No |
| Vote on suggestions | Yes | Yes | Yes | Yes | No |
| Change own vote while voting open | Yes | Yes | Yes | Yes | No |
| Close suggestions | Yes | Optional | No | No | No |
| Reopen suggestions | Yes | Optional | No | No | No |
| Close voting | Yes | No | No | No | No |
| Veto a suggestion | Yes | No | No | No | No |
| Reset votes (request re-vote) | Yes | No | No | No | No |
| Confirm final songs | Yes | No | No | No | No |
| Create skeleton setlist | Yes | No, subject to entitlement | No | No | No |
| Add selected songs to catalogue | Yes | No, subject to entitlement | No | No | No |

### 4.3 Entitlement Principle

This feature must be compatible with Bandie’s monetisation approach:

- Whole-band participation in suggestions and voting must be allowed for free-tier approved band members.
- Paid feature limits should apply to the user performing a paid action, not to passive participants.
- If creating multiple setlists is a paid capability, only a user with the necessary entitlement can create the skeleton setlist, but other members can view and use it according to normal band permissions.

---

## 5. Functional Requirements

## 5.1 Navigation and Placement

The feature should be available from the private band workspace.

Recommended navigation labels:

- Songs > Suggestions
- Songs > Song Votes
- Songs Dashboard > “New song suggestion group”
- Setlists > “Create from confirmed song vote”

The Songs Dashboard should include a panel for active song suggestion groups showing:

- Group name
- Status
- Number of suggestions
- Number of votes cast
- Target number of songs
- Suggestion closing date
- Voting status
- Quick action button

Example:

> **Summer Swing Songs**  
> 18 suggestions · target 8 songs · suggestions close 15 July · 4 members still to vote

---

## 5.2 Create Song Suggestion Group

### 5.2.1 Actor

Band Leader or authorised Band Admin.

### 5.2.2 Form Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Group name | Text | Yes | Example: Summer Swing Songs. Must be unique within active groups for the band, or allow duplicate names with date suffix. |
| Description / brief | Textarea | Optional | Free-text context for the band. |
| Preferred genre | Single select or multi-select | Optional | Examples: rock, blues, swing, jazz, punk, soul, indie, pop. |
| Preferred decade | Single select or multi-select | Optional | Examples: 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, current. |
| Vocal gender | Select | Optional | Options: any, male vocal, female vocal, mixed vocal, instrumental. Label should be treated as performance suitability rather than identity data. |
| Target number of songs | Integer | Yes | The number of songs to freeze when confirmed. Must be greater than zero. |
| Maximum suggestions per member | Integer | Optional | Default could be unlimited or a configurable value. |
| Suggestion closing date | Date/time | Yes | After this, members can no longer submit unless leader reopens. |
| Voting closing date | Date/time | Optional | If blank, leader closes manually. Must be same as or after suggestion closing date. |
| Workspace access | Fixed | Yes | Private to approved band members only. |
| Vote visibility | Select | Yes | Set by leader at creation: **Show who voted how** (`member_visible`) or **Aggregate counts only** (`aggregate_only`). |
| Allow member comments | Boolean | Optional | Schema ships in v1; UI deferred. If enabled later, members can add comments alongside votes. |
| Allow vote changes | Boolean | Optional | Default true until voting closes. |
| Tie-break mode | Select | Optional | v1: leader resolves ties at confirm and may **reset votes** to request a re-vote. Automated modes (`happy_count`, etc.) deferred. |

### 5.2.3 Validation

- Group name cannot be blank.
- Target number of songs must be a positive integer.
- Suggestion closing date must be in the future when the group is created.
- Voting closing date, if set, must be after suggestion closing date.
- If maximum suggestions per member is set, it must be a positive integer.

### 5.2.4 Save Behaviour

When saved:

- Create a suggestion group record.
- Set status to `open_for_suggestions`.
- Notify approved band members that a new song suggestion group is open.
- Add an activity feed event.
- Display the group detail page.

---

## 5.3 Song Suggestion Group Detail Page

The group detail page is the core collaboration view.

### 5.3.1 Header

Header should include:

- Group name
- Status pill
- Brief summary
- Target number of songs
- Preferred genre / decade / vocal suitability
- Suggestion close date
- Voting close date if configured
- Number of submitted songs
- Number of members who have voted
- Leader action buttons

Suggested statuses:

| Status | Description |
|---|---|
| Draft | Created but not yet open to members. Optional for later release. |
| Open for Suggestions | Members can submit and vote. |
| Suggestions Closed | No more submissions, but voting remains open. |
| Voting Closed | Votes are locked, but final confirmation not yet completed. |
| Confirmed | Top N songs are frozen. |
| Archived | Historical group, no active actions. |
| Cancelled | Group abandoned without confirmation. |

### 5.3.2 Member View

Members should see:

- Brief and rules.
- A button to add a song suggestion while suggestions are open.
- Existing suggestions in a table or card list.
- Their current vote for each suggestion.
- Aggregate vote summary for each song.
- Whether they still need to vote on songs.
- A clear indication that final selection is made by the leader based on the vote results.

### 5.3.3 Leader View

Leaders should additionally see:

- Close suggestions button.
- Reopen suggestions button, if appropriate.
- Close voting button.
- **Veto suggestion** — remove a song from consideration with a required reason (e.g. not appropriate, explicit lyrics for a kids party).
- **Reset votes** — clear votes on the group (or on tied songs) and prompt members to re-vote when results are too close to call.
- Confirm final top N button.
- Override / manually include / manually exclude controls at confirm (with required reason when overriding rank).
- Create skeleton setlist button after confirmation.

---

## 5.4 Add Song Suggestion

### 5.4.1 Actor

Any approved band member, including free-tier members, while suggestions are open.

### 5.4.2 Form Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Song title | Text | Yes | Example: Moondance. |
| Artist | Text | Yes | Example: Van Morrison. |
| Suggested genre | Select / text | Optional | Can default from group preferred genre. |
| Decade | Select | Optional | Used for sorting and validation against brief. |
| Vocal suitability | Select | Optional | Any, male vocal, female vocal, mixed vocal, instrumental. |
| Key | Text | Optional | If known. |
| Estimated length | mm:ss | Optional | If known. |
| YouTube link | URL | Optional | Reference media. |
| Spotify link | URL | Optional | Reference media. |
| Other media link | URL | Optional | Example: Apple Music, SoundCloud, Bandcamp. |
| Why this song? | Textarea | Optional | Short pitch from the member. |
| Difficulty estimate | Select | Optional | Easy, medium, hard, unknown. |
| Suggested by | System | Yes | Current user. |

### 5.4.3 Validation

- Song title and artist are required.
- At least one media link is recommended but not required.
- URLs must be valid URL format.
- Only allowed URL schemes: `https://` initially.
- Duplicate detection should warn if a similar title and artist already exists in the group or in the band catalogue.
- Duplicate detection should not block submission by default, but should prompt the member to confirm or vote on the existing suggestion instead.

### 5.4.4 Save Behaviour

When saved:

- Create a suggestion record linked to the group.
- Record the submitting user.
- Default vote for the submitter may be set to `happy` or left blank depending on product choice. Recommended initial behaviour: auto-set submitter vote to `happy_to_play` and clearly show this to the user.
- Notify band members that a new suggestion has been added.
- Add activity feed event.

---

## 5.5 Voting

### 5.5.1 Vote States

Each approved band member can select exactly one of the following states for each suggested song:

| Vote State | UI Label | Icon | Meaning | Score |
|---|---|---|---|---:|
| `happy_to_play` | Happy to play | 🙂 | Positive vote. Member is willing and interested. | 2 |
| `meh` | Meh | 😐 | Neutral or low enthusiasm. Member could accept it. | 1 |
| `rather_not` | Rather not | 🙁 | Negative vote. Member would prefer not to play it. | 0 |

### 5.5.2 Voting Rules

- Every approved band member can vote once per suggested song.
- Votes can be changed until voting closes if `allow_vote_changes` is enabled.
- Votes are visible in aggregate to the band always.
- When `vote_visibility = member_visible`, individual member votes are shown (who voted 🙂 / 😐 / 🙁).
- When `vote_visibility = aggregate_only`, members see counts only — not who voted which way. The leader always sees per-member votes.
- Members should be able to filter to “Needs my vote”.
- Voting remains open while suggestions are open.
- Voting can remain open after suggestions are closed.
- Voting closes when:
  - the leader manually closes voting, or
  - the voting closing date passes, if configured, or
  - the leader confirms final selection, which implicitly closes voting.

### 5.5.3 Vote Display

Each suggestion should show:

- Happy count 🙂
- Meh count 😐
- Rather not count 🙁
- Total votes cast
- Vote completion percentage
- Net score
- Current user’s selected vote

Example display:

> 🙂 4 · 😐 1 · 🙁 0 · 5/5 voted · Score 9

### 5.5.4 Vote Score Calculation

Recommended initial scoring:

```text
score = (happy_to_play_count * 2) + (meh_count * 1) + (rather_not_count * 0)
```

Recommended ranking order:

1. Highest score.
2. Highest happy count.
3. Lowest rather-not count.
4. Highest vote completion percentage.
5. Earliest submitted.

The leader should still be able to make the final decision, especially where song suitability, vocalist range, instrumentation, gig context, or duplicate style matters.

### 5.5.5 Ties and re-votes

When songs are tied around the cutoff:

- Highlight tied songs in the leader confirm view.
- The leader may **pick the winner** at confirmation (default tie-break).
- The leader may **reset votes** on the group (or on tied suggestions only) with an optional message, prompting members to vote again while voting remains open.
- Record a `votes_reset` event in the activity log when votes are cleared.

---

## 5.6 Closing Suggestions

### 5.6.1 Manual Close

The band leader can close suggestions manually when enough songs have been suggested.

When suggestions are closed:

- No new song suggestions can be submitted.
- Existing suggestions remain visible.
- Voting remains open unless the leader also closes voting.
- Members can still vote or change votes while voting is open.
- Notify members that suggestions are closed and voting is still open.

### 5.6.2 Automatic Close

A scheduled job should automatically close suggestions after the suggestion closing date.

When the date passes:

- Set group status to `suggestions_closed` if not already closed or confirmed.
- Notify members that suggestions have closed.
- Prompt remaining members to vote.

### 5.6.3 Reopen Suggestions

The band leader can reopen suggestions if needed.

Reopening should:

- Set status back to `open_for_suggestions`.
- Require a new suggestion closing date if the previous one is in the past.
- Preserve all existing suggestions and votes.
- Add an audit event.

---

## 5.7 Closing Voting

Voting can close manually or automatically.

### 5.7.1 Manual Close

The leader can close voting when they feel sufficient votes have been cast.

### 5.7.2 Automatic Close

If a voting closing date is set, voting closes automatically after that date.

### 5.7.3 Vote Completion Prompt

Before closing voting manually, if not all members have voted, show a warning:

> 3 members have not voted on all songs. You can still close voting, or notify them first.

Leader options:

- Close voting anyway.
- Send reminder.
- Cancel.

---

## 5.8 Confirm Final Selection

### 5.8.1 Actor

Band Leader or authorised Band Admin.

### 5.8.2 Behaviour

When confirming the set:

- Calculate ranked suggestions using the scoring model.
- Select the top **N** songs where **N** equals the target number of songs.
- Freeze selected songs as the confirmed output.
- Lock votes and selected song status.
- Set group status to `confirmed`.
- Record confirmed by, confirmed at, and ranking snapshot.
- Notify band members of the confirmed result.

### 5.8.3 Manual Adjustment

Initial release can support either:

- **Strict ranking confirmation:** system selects top N only.
- **Leader-adjusted confirmation:** system proposes top N, but leader can include/exclude songs before freezing.

Recommended initial approach: support leader-adjusted confirmation, but require a reason when manually overriding the ranked order.

### 5.8.3 Leader veto

Before or during voting (while the group is not `confirmed`), the band leader may **veto** a suggestion:

- Sets suggestion status to `leader_vetoed`.
- Requires a **veto reason** (e.g. not appropriate for the gig, explicit lyrics, wrong fit for audience).
- Vetoed songs are excluded from ranking and cannot be selected at confirmation.
- Remain visible in the group with veto badge and reason (audit transparency).
- Notify the band that a suggestion was vetoed (in-app activity).

Veto is distinct from confirmation override: veto removes a song from the pool; override adjusts the final top N among eligible songs.

### 5.8.4 Manual adjustment at confirm

Leader-adjusted confirmation: system proposes top N, but leader can include/exclude eligible songs before freezing. Require a reason when manually overriding the ranked order.

Override reason examples:

- Duplicate style with another selected song.
- Wrong vocalist fit.
- Too difficult for current gig timeline.
- Already in catalogue.
- Better suited for later.

### 5.8.5 Frozen result

A frozen confirmed result should include:

- Song title
- Artist
- Suggestion metadata
- Final rank
- Vote counts
- Score
- Suggested by
- Confirmed inclusion status
- Override reason, if applicable

Frozen results should not change if members later leave the band.

---

## 5.9 Create Skeleton Setlist

### 5.9.1 Actor

Band Leader or authorised Band Admin, subject to setlist creation entitlements.

### 5.9.2 Entry Point

After confirmation, show:

> Create skeleton setlist from selected songs

### 5.9.3 Skeleton Setlist Fields

| Field | Default |
|---|---|
| Setlist name | Same as suggestion group name, or “Summer Swing Songs Setlist” |
| Source | Song suggestion group ID |
| Songs | Confirmed top N songs |
| Order | Initial rank order from voting results |
| Duration | Sum of estimated song lengths where available |
| Vibe | Derived from group preferred genre or manually set |
| Status | Draft |

### 5.9.4 Catalogue Interaction

When creating a skeleton setlist, the leader should be asked how to handle selected songs that are not already in the song catalogue:

Options:

1. **Create draft catalogue songs** — create song records with status `candidate` or `not_started`.
2. **Create setlist placeholders only** — setlist references proposal songs until converted later.
3. **Skip songs not in catalogue** — not recommended as default.

Recommended behaviour: create draft catalogue songs with minimal metadata and link them back to the suggestion group.

### 5.9.5 Result

After creation:

- User lands on the Setlist Management page.
- Skeleton setlist is visible as Draft.
- Each song can be opened to create or complete a song folder.
- Activity feed records the creation.

---

## 6. User Experience Requirements

## 6.1 Suggested Pages

### 6.1.1 Song Suggestions Dashboard

A dashboard listing active and historical groups.

Cards should show:

- Group name
- Status
- Brief tags: genre, decade, vocal suitability
- Target song count
- Suggestions submitted
- Voting completion
- Closing dates
- Primary CTA

### 6.1.2 Group Detail Page

Main collaboration area.

Sections:

1. Group brief and deadline summary.
2. Suggestion submission form / button.
3. Suggestions table or cards.
4. Voting controls.
5. Leader actions.
6. Activity and reminders.

### 6.1.3 Confirmation Review Page

Leader-only review before freezing.

Sections:

- Ranked list.
- Top N preview.
- Vote breakdown.
- Manual adjustment controls.
- Confirm result button.

### 6.1.4 Confirmed Result Page

Read-only view after confirmation.

Sections:

- Selected songs.
- Non-selected songs.
- Vote summary.
- Create skeleton setlist action.
- Link to generated setlist if already created.

---

## 6.2 Filters and Sorting

Suggestion group detail should support:

- Search song / artist.
- Filter by vote status: all, needs my vote, I voted happy, I voted meh, I voted rather not.
- Filter by suggested by.
- Filter by genre.
- Filter by decade.
- Sort by score, happy votes, rather-not votes, newest, artist, title.
- Toggle: show top N only.

---

## 6.3 Empty States

### No Suggestion Groups

> No song suggestion groups yet. Create a group to ask the band for ideas and vote on what to learn next.

### No Suggestions Yet

> No songs suggested yet. Add the first suggestion with a song, artist and media link.

### Suggestions Closed But No Votes

> Suggestions are closed. Voting is still open, but nobody has voted yet.

### Confirmed

> This song vote has been confirmed. The selected songs are frozen and ready to turn into a skeleton setlist.

---

## 6.4 Notifications

The system should send in-app notifications for:

- New suggestion group created.
- Suggestion closing soon.
- New song suggestion added.
- Suggestions closed; voting still open.
- Voting closing soon.
- Reminder to vote.
- Final selection confirmed.
- Skeleton setlist created.

Email and push notifications can be added later using the existing notification architecture.

---

## 7. Data Model

The following model assumes Supabase/PostgreSQL.

## 7.1 Tables

### 7.1.1 `bandie_song_suggestion_groups`

Stores the leader-created group / brief.

```sql
create table bandie_song_suggestion_groups (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references bandie_bands(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),

  name text not null,
  description text,
  preferred_genres text[] default '{}',
  preferred_decades text[] default '{}',
  vocal_suitability text check (vocal_suitability in ('any', 'male_vocal', 'female_vocal', 'mixed_vocal', 'instrumental')) default 'any',

  target_song_count integer not null check (target_song_count > 0),
  max_suggestions_per_member integer check (max_suggestions_per_member is null or max_suggestions_per_member > 0),

  suggestion_closes_at timestamptz not null,
  voting_closes_at timestamptz,

  vote_visibility text not null default 'member_visible'
    check (vote_visibility in ('member_visible', 'aggregate_only')),

  allow_member_comments boolean not null default false,
  allow_vote_changes boolean not null default true,
  tie_break_mode text not null default 'leader_decides'
    check (tie_break_mode in ('leader_decides', 'happy_count', 'lowest_rather_not', 'earliest_submitted')),

  status text not null default 'open_for_suggestions'
    check (status in ('draft', 'open_for_suggestions', 'suggestions_closed', 'voting_closed', 'confirmed', 'archived', 'cancelled')),

  suggestions_closed_at timestamptz,
  voting_closed_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  skeleton_setlist_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 7.1.2 `bandie_song_suggestions`

Stores individual song suggestions.

```sql
create table bandie_song_suggestions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references bandie_song_suggestion_groups(id) on delete cascade,
  band_id uuid not null references bandie_bands(id) on delete cascade,
  suggested_by uuid not null references auth.users(id),

  song_title text not null,
  artist text not null,
  suggested_genre text,
  decade text,
  vocal_suitability text check (vocal_suitability in ('any', 'male_vocal', 'female_vocal', 'mixed_vocal', 'instrumental')),
  song_key text,
  estimated_length_seconds integer check (estimated_length_seconds is null or estimated_length_seconds > 0),
  difficulty_estimate text check (difficulty_estimate in ('easy', 'medium', 'hard', 'unknown')) default 'unknown',

  youtube_url text,
  spotify_url text,
  other_media_url text,
  rationale text,

  duplicate_of_suggestion_id uuid references bandie_song_suggestions(id),
  existing_catalogue_song_id uuid references bandie_songs(id),

  status text not null default 'active'
    check (status in ('active', 'withdrawn', 'leader_vetoed', 'selected', 'not_selected', 'converted_to_catalogue')),

  leader_vetoed_at timestamptz,
  leader_vetoed_by uuid references auth.users(id),
  leader_veto_reason text,

  final_rank integer,
  final_score integer,
  selected_at timestamptz,
  selection_override boolean not null default false,
  selection_override_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 7.1.3 `bandie_song_suggestion_votes`

Stores each member’s vote for each suggestion.

```sql
create table bandie_song_suggestion_votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references bandie_song_suggestion_groups(id) on delete cascade,
  suggestion_id uuid not null references bandie_song_suggestions(id) on delete cascade,
  band_id uuid not null references bandie_bands(id) on delete cascade,
  member_user_id uuid not null references auth.users(id),

  vote_state text not null check (vote_state in ('happy_to_play', 'meh', 'rather_not')),
  comment text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (suggestion_id, member_user_id)
);
```

### 7.1.4 `bandie_song_suggestion_group_events`

Audit and activity log.

```sql
create table bandie_song_suggestion_group_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references bandie_song_suggestion_groups(id) on delete cascade,
  band_id uuid not null references bandie_bands(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  event_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

### 7.1.5 `bandie_song_suggestion_confirmed_songs`

Optional snapshot table for frozen results.

```sql
create table bandie_song_suggestion_confirmed_songs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references bandie_song_suggestion_groups(id) on delete cascade,
  suggestion_id uuid not null references bandie_song_suggestions(id),
  band_id uuid not null references bandie_bands(id) on delete cascade,

  final_rank integer not null,
  final_score integer not null,
  happy_count integer not null default 0,
  meh_count integer not null default 0,
  rather_not_count integer not null default 0,
  total_votes integer not null default 0,

  song_title text not null,
  artist text not null,
  suggested_by uuid references auth.users(id),
  selected_by uuid references auth.users(id),
  selection_override boolean not null default false,
  selection_override_reason text,

  created_catalogue_song_id uuid references bandie_songs(id),
  created_setlist_item_id uuid,

  created_at timestamptz not null default now(),

  unique (group_id, suggestion_id)
);
```

---

## 8. Database Indexes

Recommended indexes:

```sql
create index idx_song_suggestion_groups_band_status
  on bandie_song_suggestion_groups (band_id, status);

create index idx_song_suggestion_groups_closing_dates
  on bandie_song_suggestion_groups (suggestion_closes_at, voting_closes_at);

create index idx_song_suggestions_group
  on bandie_song_suggestions (group_id, created_at desc);

create index idx_song_suggestions_band_title_artist
  on bandie_song_suggestions (band_id, lower(song_title), lower(artist));

create index idx_song_suggestion_votes_group_member
  on bandie_song_suggestion_votes (group_id, member_user_id);

create index idx_song_suggestion_votes_suggestion
  on bandie_song_suggestion_votes (suggestion_id);
```

---

## 9. Row Level Security Requirements

RLS must ensure that only approved members of the relevant band can read or write group data.

### 9.1 Read Access

A user can read suggestion groups, suggestions, votes and confirmed results only if:

- the user is authenticated, and
- the user is an approved member of the group’s band.

### 9.2 Create Group

A user can create a group only if:

- they are an approved member of the band, and
- they have role `leader` or authorised admin role, and
- they satisfy any entitlement requirement for group creation if introduced later.

### 9.3 Submit Suggestion

A user can create a suggestion only if:

- they are an approved member of the band, and
- group status is `open_for_suggestions`, and
- current time is before `suggestion_closes_at`, unless leader override, and
- maximum suggestions per member has not been exceeded.

### 9.4 Vote

A user can create or update their vote only if:

- they are an approved member of the band, and
- group status is `open_for_suggestions` or `suggestions_closed`, and
- voting is not closed, and
- current time is before `voting_closes_at` if set, and
- if updating, `allow_vote_changes` is true or the vote has not previously been cast.

### 9.5 Confirm

A user can confirm a final selection only if:

- they are leader or authorised admin, and
- group is not already confirmed, cancelled or archived, and
- at least target number of active suggestions exists, or the leader explicitly confirms fewer with a warning.

---

## 10. API / Service Layer

The implementation can use Supabase client calls directly for simple reads, but state-changing actions should preferably use RPC functions or Edge Functions to centralise permission, validation and audit logic.

## 10.1 Suggested Service Functions

### `createSongSuggestionGroup(input)`

Creates a group and activity event.

### `updateSongSuggestionGroup(groupId, input)`

Updates editable brief fields. Should be restricted once confirmed.

### `submitSongSuggestion(groupId, input)`

Adds a suggestion, performs duplicate warning checks, and auto-adds submitter vote if configured.

### `voteOnSongSuggestion(suggestionId, voteState, comment)`

Creates or updates current user’s vote.

### `closeSongSuggestions(groupId)`

Sets status to `suggestions_closed` and writes audit event.

### `reopenSongSuggestions(groupId, newClosingDate)`

Sets status to `open_for_suggestions` and writes audit event.

### `closeSongSuggestionVoting(groupId)`

Sets status to `voting_closed` and locks votes.

### `confirmSongSuggestionGroup(groupId, selectedSuggestionIds, overrideReasons)`

Freezes selected songs and creates confirmed snapshot.

### `vetoSongSuggestion(suggestionId, reason)`

Leader only — sets `leader_vetoed`, records reason, writes audit event.

### `resetSongSuggestionVotes(groupId, options)`

Leader only — deletes votes (whole group or tied subset), reopens voting if needed, writes `votes_reset` event, notifies members to re-vote.

### `createSkeletonSetlistFromSuggestionGroup(groupId, options)`

Creates a draft setlist and optionally draft catalogue songs.

---

## 11. Ranking Query

A view or materialised view can simplify display.

```sql
create view bandie_song_suggestion_vote_summary as
select
  s.id as suggestion_id,
  s.group_id,
  s.band_id,
  count(v.id) as total_votes,
  count(*) filter (where v.vote_state = 'happy_to_play') as happy_count,
  count(*) filter (where v.vote_state = 'meh') as meh_count,
  count(*) filter (where v.vote_state = 'rather_not') as rather_not_count,
  (
    count(*) filter (where v.vote_state = 'happy_to_play') * 2 +
    count(*) filter (where v.vote_state = 'meh') * 1
  ) as score
from bandie_song_suggestions s
left join bandie_song_suggestion_votes v on v.suggestion_id = s.id
where s.status = 'active'
group by s.id, s.group_id, s.band_id;
```

Ranking excludes `leader_vetoed` and `withdrawn` suggestions.

Ranking query:

```sql
select
  s.*,
  vs.total_votes,
  vs.happy_count,
  vs.meh_count,
  vs.rather_not_count,
  vs.score,
  row_number() over (
    partition by s.group_id
    order by
      vs.score desc,
      vs.happy_count desc,
      vs.rather_not_count asc,
      vs.total_votes desc,
      s.created_at asc
  ) as proposed_rank
from bandie_song_suggestions s
join bandie_song_suggestion_vote_summary vs on vs.suggestion_id = s.id
where s.group_id = :group_id
  and s.status = 'active';
```

---

## 12. Frontend Components

Recommended React components:

```text
SongSuggestionGroupsPage
SongSuggestionGroupCard
CreateSuggestionGroupModal
SuggestionGroupDetailPage
SuggestionGroupHeader
SuggestionBriefPanel
SongSuggestionFormModal
SongSuggestionTable
SongSuggestionCard
VoteButtons
VoteSummaryPills
VoteCompletionIndicator
LeaderActionPanel
ConfirmSelectionPage
RankedSuggestionList
SelectedSongsPreview
CreateSkeletonSetlistModal
```

## 12.1 VoteButtons Component

Props:

```ts
type VoteState = 'happy_to_play' | 'meh' | 'rather_not';

interface VoteButtonsProps {
  suggestionId: string;
  currentVote?: VoteState;
  disabled: boolean;
  onVote: (state: VoteState) => Promise<void>;
}
```

UI:

- 🙂 Happy to play
- 😐 Meh
- 🙁 Rather not

The selected state should be visually obvious.

---

## 13. State Machine

```text
Draft
  -> Open for Suggestions

Open for Suggestions
  -> Suggestions Closed
  -> Voting Closed
  -> Confirmed
  -> Cancelled

Suggestions Closed
  -> Open for Suggestions
  -> Voting Closed
  -> Confirmed
  -> Cancelled

Voting Closed
  -> Confirmed
  -> Suggestions Closed, if leader reopens voting
  -> Cancelled

Confirmed
  -> Archived

Cancelled
  -> Archived
```

### 13.1 State Rules

- Suggestions can be added only in `open_for_suggestions`.
- Votes can be added or changed in `open_for_suggestions` and `suggestions_closed`.
- Votes cannot change in `voting_closed`, `confirmed`, `archived`, or `cancelled`.
- Confirmation can happen from `open_for_suggestions`, `suggestions_closed`, or `voting_closed`, but the UI should warn if suggestions or voting are still open.
- Skeleton setlist can be created only from `confirmed`.

---

## 14. Edge Cases

## 14.1 Fewer Suggestions Than Target

If the leader attempts to confirm with fewer suggestions than target count:

- Show warning.
- Allow confirm fewer if leader chooses.
- Record that final count was below target.

## 14.2 Ties

If songs are tied around the cutoff point:

- Highlight tied songs.
- Let leader choose.
- Record tie-break decision.

## 14.3 Duplicate Suggestions

If duplicate detected:

- Warn member before save.
- Offer to vote on existing suggestion.
- Allow submit anyway with confirmation.

## 14.4 Member Leaves Band

If a member leaves:

- Their historical suggestions and votes remain for historical accuracy.
- They can no longer view or edit the group.
- Vote completion should use currently active members for “who still needs to vote”, but historical total votes should remain visible.

## 14.5 Suggestion Closes While User Is Editing

If the user submits after closure:

- Reject save.
- Show message: suggestions have closed.

## 14.6 Voting Closes While User Is Voting

If the user submits after voting closes:

- Reject update.
- Refresh current status.

---

## 15. Security and Content Considerations

- Only approved band members can access groups.
- User-supplied media links must be sanitised before rendering.
- External links should open in a new tab with `rel="noopener noreferrer"`.
- The system should not scrape, copy or store copyrighted lyrics, tabs or sheet music as part of this feature.
- Uploaded files remain part of the existing Song Folder / external storage model, not this suggestion feature.
- Audit events should track leader actions and final confirmation.

---

## 16. Analytics

Track product events:

```text
song_suggestion_group_created
song_suggestion_added
song_suggestion_vote_cast
song_suggestion_vote_changed
song_suggestions_closed
song_suggestion_voting_closed
song_suggestion_group_confirmed
song_suggestion_setlist_created
song_suggestion_group_archived
```

Useful metrics:

- Number of active groups per band.
- Suggestions per group.
- Votes per group.
- Vote completion rate.
- Time from group creation to confirmation.
- Percentage of selected songs converted to catalogue songs.
- Percentage of confirmed groups converted to setlists.
- Participation rate by band member.

---

## 17. Acceptance Criteria

## 17.1 Create Group

- Given I am a band leader, when I create a group with valid details, then the group is saved and visible to approved members.
- Given I am not a leader or authorised admin, when I access the create group action, then I cannot create a group.
- Given I enter a target song count below 1, then I see a validation error.

## 17.2 Suggest Songs

- Given I am an approved band member, when suggestions are open, then I can submit a song suggestion.
- Given I am a free-tier approved band member, when suggestions are open, then I can submit a song suggestion.
- Given suggestions are closed, when I try to submit, then the submission is rejected.
- Given a similar song already exists, when I submit it, then I see a duplicate warning.

## 17.3 Vote

- Given I am an approved band member, when voting is open, then I can vote Happy, Meh, or Rather Not on each suggestion.
- Given I have already voted and vote changes are allowed, when I select a different vote, then my vote is updated.
- Given voting is closed, when I try to vote, then the vote is rejected.
- Given I view the list, then I can see aggregate vote counts.

## 17.4 Close Suggestions

- Given I am a leader, when I close suggestions, then no new suggestions can be added and voting remains open.
- Given the suggestion closing date passes, then suggestions automatically close.

## 17.5 Confirm Selection

- Given I am a leader, when I confirm a group, then the top N selected songs are frozen.
- Given there is a tie around the cutoff, then the UI highlights the tie and allows a leader decision.
- Given the group is confirmed, then votes and selected songs cannot be changed.

## 17.6 Create Skeleton Setlist

- Given a group is confirmed, when I create a skeleton setlist, then a draft setlist is created using the selected songs.
- Given selected songs are not already in the catalogue, then the system can create draft catalogue song records.
- Given setlist creation is paid-gated, when a non-entitled leader tries to create the setlist, then the entitlement prompt is shown.

---

## 18. Implementation Phasing

## Phase 1 — Core Collaboration

- Create suggestion groups.
- Submit songs.
- Vote using three states.
- Close suggestions.
- Confirm top N.
- Basic notification/activity feed.

## Phase 2 — Setlist and Catalogue Integration

- Create skeleton setlist from confirmed songs.
- Create draft catalogue songs.
- Link confirmed songs to song folders.
- Show suggestion source in setlist/song records.

## Phase 3 — Enhanced Decision Support

- Better duplicate detection.
- Richer ranking and tie handling.
- Member comments.
- Reminder workflows.
- Export/share voting summary.
- Suggested set flow based on tempo, key, genre and energy.

## Phase 4 — External Metadata Enrichment

- Optional metadata lookup from approved providers.
- Preview embeds for Spotify/YouTube links.
- Auto-detect duration where provider terms allow.

---

## 19. Resolved product decisions

**Confirmed 1 July 2026** (product owner).

| # | Decision | Resolution |
|---|---|---|
| 1 | Submitter auto-vote | **Yes** — auto `happy_to_play` on submit |
| 2 | Vote visibility | **Leader chooses at group creation** — `member_visible` (who voted how) or `aggregate_only` (counts only). Leader always sees per-member votes. |
| 3 | All members must vote before confirm | **No** — leader discretion; warn if votes incomplete |
| 4 | Leader control over songs | **Veto rights** — leader can veto suggestions with required reason (not appropriate, explicit lyrics, etc.); plus include/exclude at confirm with override reason |
| 5 | Suggestion vs voting close | **Separate windows** — voting can stay open after suggestions close |
| 6 | Catalogue entry timing | **On skeleton setlist creation** — draft `bandie_songs`; confirm only freezes snapshot |
| 7 | Max open groups per tier | **Unlimited** for v1 — no entitlement cap |

**Additional v1 scope (1 July 2026):**

| Topic | Resolution |
|---|---|
| Band Admin manages groups | **No** — leader-only for v1 |
| `draft` group status | **No** — create as `open_for_suggestions` |
| Vote comments | **Defer UI** — `allow_member_comments` + `comment` on votes in data model |
| Email / push | **Defer** — in-app activity first |
| Tie-break | Leader may **reset votes** and request re-vote; leader may also **decide** at confirm |

---

## 20. Confirmed implementation defaults

For the first implementation:

- All approved members, including free-tier members, can suggest and vote.
- Submitter vote auto-defaults to Happy to play.
- Vote visibility is set by the leader when creating the group (`member_visible` or `aggregate_only`); leader always sees per-member votes.
- Suggestions close at the configured date or manually by leader.
- Voting remains open after suggestions close until manually closed, voting deadline passes, or leader confirms.
- Leader can confirm before all votes are cast, with a warning.
- Leader can **veto** suggestions with a required reason; vetoed songs are excluded from ranking.
- On ties, leader can **reset votes** to request a re-vote or **decide** at confirmation.
- System proposes top N by score among eligible songs; leader can override at confirm with a required reason.
- Confirmed selected songs are frozen in a snapshot table.
- Skeleton setlist creation creates draft catalogue songs where needed.
- Unlimited open suggestion groups per band for v1.

---

## 21. Summary

Song Suggestion Groups add a collaborative intake layer before songs enter the band catalogue. The feature helps band leaders guide the direction of the repertoire while still giving all band members a voice. It keeps the workflow simple: define the brief, gather suggestions, vote with three clear states, freeze the top N, and optionally create a skeleton setlist.

The feature should feel lightweight and democratic while preserving the band leader’s ability to make a final practical decision.
