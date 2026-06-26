# Migrations

SQL migrations for the shared Supabase instance (`proff-rsd-mt-1`).

| Migration | Purpose |
|---|---|
| `20260608193847_early_access_requests.sql` | Pre-existing shared table (fetched from remote) |
| `20260626180000_platform_core.sql` | Platform registry, memberships, profiles, audit log, helpers |
| `20260626180001_bandie_bootstrap.sql` | Bandie app registration + initial Bandie schema |

Apply with:

```bash
supabase link --project-ref cjmgrsvbrcgozgjxbriz
supabase db push
```

Verify:

```bash
npm run verify:supabase
```
