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

## RLS requirement

**Every migration** that adds tables, storage buckets, or client-facing functions must include RLS policies in the same file. See `.cursor/rules/supabase-rls.mdc` for the checklist.

When storage policies check band ownership, use `security definer` helpers (e.g. `bandie_current_user_owns_band`, `bandie_can_manage_profile_image`) — inline subqueries on `bandie_bands` fail under nested RLS.

**After adding any migration file, run `supabase db push` before testing** — PostgREST errors like “Could not find column in schema cache” mean the remote DB is behind the repo.

Verify:

```bash
npm run verify:supabase
```
