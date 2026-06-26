# Supabase migrations

Schema changes for Bandie are applied via SQL migration files in this directory.

## Rules

- All schema changes must be migration files — no manual production edits
- Table names use the `bandie_` prefix (shared multi-app Supabase instance)
- RLS must be enabled on all user-facing tables
- See `docs/RSD_SUPABASE_MULTI_TENANT_DB.md` and `docs/RSD_DATA_MODELLING_GUIDE.md`

## App code

`bandie`
