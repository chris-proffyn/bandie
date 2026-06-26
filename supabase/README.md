# Supabase — Bandie

Backend artefacts for Bandie on the shared Proffyn Supabase platform.

## Structure

- `migrations/` — authoritative schema migrations
- `seed/` — development seed data

## Configuration

Environment variables (see repo root `.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=   # publishable key (sb_publishable_...)
SUPABASE_SECRET_KEY=      # server/migrations only (supabase/.env)
```

## Multi-tenant approach

Bandie uses the **shared Supabase instance** with app-prefixed tables (`bandie_*`), as defined in `docs/RSD_SUPABASE_MULTI_TENANT_DB.md`.

Service-role keys must never be used in client code.
