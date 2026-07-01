# Migrations

SQL migrations for the shared Supabase instance (`proff-rsd-mt-1`).

| Migration | Purpose |
|---|---|
| `20260608193847_early_access_requests.sql` | Pre-existing shared table (fetched from remote) |
| `20260626180000_platform_core.sql` | Platform registry, memberships, profiles, audit log, helpers |
| `20260626180001_bandie_bootstrap.sql` | Bandie app registration, `bandie_profiles`, `bandie_bands`, `bandie_band_members` |
| `20260626200000_bandie_invitations.sql` | Band invitations table, RLS, accept RPC |
| `20260626210000_bandie_bands_rls_fix.sql` | Band RLS policy fixes |
| `20260627000000_bandie_public_profiles.sql` | Public band profile fields, media, social links, public dates |
| `20260627120000_bandie_profile_image_storage.sql` | `bandie-profile-images` bucket and storage RLS |
| `20260627130000_bandie_storage_rls_fix.sql` | Storage RLS fixes (security definer helpers) |
| `20260627140000_bandie_name_font.sql` | Band name font column and curated font options |
| `20260627150000_bandie_pending_invites_for_user.sql` | `bandie_list_my_pending_invitations()` RPC |
| `20260627160000_bandie_user_player_profile.sql` | Musician profile fields (bio, location, genres, instruments, visibility) |
| `20260627170000_bandie_user_profile_gear.sql` | Gear items and gear notes on profiles |
| `20260627180000_bandie_color_palette.sql` | Band colour palette column and tokens |
| `20260627190000_bandie_edgy_palettes.sql` | Additional edgy colour palettes |
| `20260627200000_bandie_travel_distance.sql` | Travel distance on bands and profiles |
| `20260627210000_bandie_player_invite_preferences.sql` | Deputy/member invite preference flags |
| `20260627220000_bandie_player_directory.sql` | Public player directory RLS and listing support |
| `20260627230000_bandie_invitation_display_names.sql` | `bandie_list_band_invitations_for_owner()` with invitee display names |
| `20260628000000_bandie_test_user_columns.sql` | `test_user` flag on bands and profiles for test data mode |
| `20260628010000_bandie_test_seed_data.sql` | Seed 10 test bands and 50 test players (London area) |
| `20260628110000_bandie_platform_app_admin.sql` | Per-app admin flag (`is_app_admin`), helpers, Bandie admin RLS + storage |
| `20260628120000_bandie_test_seed_london_locations.sql` | Relocate test seed data to London and surrounding area (~25 miles) |
| `20260628130000_bandie_player_gender.sql` | Optional gender on player profiles for directory search |
| `20260628130100_bandie_test_seed_gender.sql` | Assign gender values to test players |
| `20260628140000_bandie_profile_username.sql` | Profile usernames, default allocation, login-by-username RPC |
| `20260628150000_bandie_band_parts_leader_contact.sql` | Band lineup parts, leader contact fields, player outreach invites, band size sync RPC |
| `20260628151000_bandie_user_workspace_roles.sql` | Player / organiser role flags on profiles |
| `20260628160000_bandie_user_messages.sql` | Direct messages between users + inbox RPCs |
| `20260628170000_bandie_band_parts_leader_contact_repair.sql` | Repair migration for band parts / leader contact if partially applied |
| `20260628180000_bandie_admin_recruitment.sql` | Admin list invites, leader contact access, assign band leader RPC |
| `20260628182000_bandie_communications.sql` | Invitation decline, message replies, player outreach inbox/respond RPCs |
| `20260628183000_bandie_band_leader_invariant.sql` | Every band must have a leader; interim admin fallback |
| `20260628184000_bandie_sent_communications.sql` | Sent player outreach listing for band leaders |
| `20260628185000_bandie_sent_communications_history.sql` | Sent invite/outreach history in communications feed |
| `20260628200000_bandie_lineup_member_controls.sql` | Lineup member assign/unavailable/remove controls |
| `20260628210000_bandie_received_communications_history.sql` | Received invite/outreach history in communications feed |
| `20260628230000_bandie_multiple_band_leaders.sql` | Multiple band leaders, leader RPCs, RLS updates |
| `20260628240000_bandie_profile_contact_phones.sql` | Assign pseudo-random UK mobile numbers to all user profiles (demo seed) |
| `20260628250000_bandie_primary_band_contact.sql` | RPC to assign primary public contact among band leaders |
| `20260628260000_bandie_band_set_offers.sql` | Fixed set length & fee packages per band |
| `20260628270000_bandie_band_dynamic_fee_offers.sql` | Dynamic session-based fee packages |
| `20260628280000_bandie_public_profile_members_contact.sql` | Public band members roster and primary contact RPCs |
| `20260628290000_bandie_organiser_venues.sql` | Organiser venues table and RLS |
| `20260628300000_bandie_organiser_venue_images.sql` | Venue photo column and storage RLS |
| `20260628310000_bandie_geography_areas.sql` | Countries, regions, directory area filters, band/profile area FKs |
| `20260628320000_bandie_assign_greater_london.sql` | Assign all bands and profiles to United Kingdom / Greater London |

Apply with:

```bash
supabase link --project-ref cjmgrsvbrcgozgjxbriz
supabase db push
```

## Phase 6 — songs & Dropbox (applied)

Song-part file bytes live in **Dropbox** (leader OAuth), not Supabase Storage. Applied migrations:

- `20260629100000_bandie_songs_dropbox_foundation.sql` — `bandie_songs`, integrations, storage
- `20260629110000_bandie_song_part_folders_files.sql` — part folders, file metadata, activity
- `20260629120000_bandie_band_song_part_templates.sql` — band-level default part templates (RLS)
- `20260629130000_bandie_ensure_song_part_templates_rpc.sql` — member seed RPC (superseded; dropped in `20260629140000`)
- `20260629140000_bandie_song_parts_leader_only.sql` — leader-only folder writes; drops member template RPC
- `20260629150000_bandie_songs_soft_delete.sql` — `is_deleted`, `deleted_at`, leader-only delete/restore trigger
- `20260629160000_bandie_setlists.sql` — `bandie_setlists`, `bandie_setlist_items`, member read / leader write RLS

## Phase 8 — entitlements (applied)

- `20260630100000_bandie_entitlements_foundation.sql` — plan catalogue, capabilities, subscriptions, usage meters, overrides (RLS + `bandie_set_usage_meter` RPC)
- `20260630110000_bandie_entitlements_seed.sql` — five-plan catalogue (`player_free`, `player_plus`, `player_pro`, `organiser_free`, `organiser_plus`), capability seeds, `plan_scope`, default subscriptions, profile trigger. **Player plan limits in this file are superseded by `20260630190000`.**
- `20260630120000_bandie_calendar.sql` — calendar events, availability votes, public date sync
- `20260701120000_bandie_calendar_series_index.sql` — index on `series_key` for repeating calendar series
- `20260630130000_bandie_gigs.sql` — gig records (legacy band-scoped; superseded by organiser model)
- `20260630220000_bandie_organiser_gigs.sql` — organiser-owned gigs, `bandie_gig_bands` invites, band leader RPCs, organiser entitlements

## Phase 17 — open mic / jam nights (applied)

- `20260702100000_bandie_open_mic_events.sql` — events, organiser members, add-on schema, activity log, entitlement fix, Release 1 RPCs
- `20260702110000_bandie_open_mic_songs_signup.sql` — songs, slots, players, assignments, suggestions, templates, live RPCs, event files schema
- `20260630230000_bandie_gigs_organiser_insert_rls.sql` — relax gig insert/select RLS to organiser ownership (not `is_organiser()` flag)
- `20260630140000_bandie_booking_enquiries.sql` — booking enquiry metadata + list RPC
- `20260630150000_bandie_admin_metrics_entitlements.sql` — audit, metrics, drafts, gate logs, admin search, aggregation RPC
- `20260630160000_bandie_plan_display_names.sql` — legacy display name rename (superseded by code alignment)
- `20260630170000_bandie_plan_code_align_names.sql` — plan codes aligned with display names (`player_plus`, `player_pro`)

- `20260630180000_bandie_billing_stripe.sql` — Stripe customer on profiles, webhook idempotency log, subscription grace period
- `20260630190000_bandie_player_plan_entitlements.sql` — Player Free read-only member model; Plus 1 band / 20 songs / 3 setlists; Pro 999 songs & setlists
- `20260630210000_bandie_launch_promo_trials.sql` — 30-day launch promo (`launch_promo_ends_at`); Player Pro / Organiser Plus trials; expiry RPC

## Phase 15 — billing (implemented)

Requires Netlify env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. After deploy, platform admin runs **Sync Stripe plans** at `/admin/billing` once (creates test/live products and writes `stripe_*` IDs to `bandie_plans`).

**Launch promo:** migration `20260630210000` sets `bandie_platform_settings.launch_promo_ends_at` to 30 days from apply time. New and existing (non-Stripe) users receive Player Pro / Organiser Plus trials until that date. Enable **Enforce entitlements** in `/admin/entitlements` at launch. Adjust end date via platform settings if needed.

Local webhook forwarding:

```bash
stripe listen --forward-to localhost:8888/api/billing/stripe-webhook
```

## Phase 20 — song suggestions (applied)

- `20260701170000_bandie_song_suggestions.sql` — suggestion groups, votes, confirmed snapshot, vote summary view, RLS + RPCs (submit, vote, close/reopen, veto, reset, confirm)
- `20260704110000_bandie_withdraw_song_suggestion.sql` — member withdraw own suggestion while window open
- `20260706100000_bandie_leader_withdraw_song_suggestion.sql` — band leaders may remove any member suggestion while suggestions are open
- `20260704120000_bandie_admin_organiser_subscription.sql` — admin can create organiser/leader subscriptions when assigning a plan from `/admin/accounts`
- `20260705120000_bandie_admin_account_deletion.sql` — admin soft-delete user accounts; leadership transfer; Dropbox disconnect; communications show Deleted user

## RLS requirement

**Every migration** that adds tables, storage buckets, or client-facing functions must include RLS policies in the same file. See `.cursor/rules/supabase-rls.mdc` for the checklist.

When storage policies check band ownership, use `security definer` helpers (e.g. `bandie_current_user_owns_band`, `bandie_can_manage_profile_image`) — inline subqueries on `bandie_bands` fail under nested RLS.

**After adding any migration file, run `supabase db push` before testing** — PostgREST errors like “Could not find column in schema cache” mean the remote DB is behind the repo.

Verify:

```bash
npm run verify:supabase
```
