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
| `20260628110000_bandie_platform_app_admin.sql` | Per-app admin flag (`is_app_admin`), helpers, Bandie admin RLS + storage |

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
