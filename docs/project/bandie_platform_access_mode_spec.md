# Bandie Platform Access Mode — Functional Specification

**Document status:** Authoritative functional spec  
**Product:** Bandie  
**Feature area:** Platform operations / entitlements  
**Last updated:** 27 June 2026

---

## 1. Purpose

Bandie needs a controlled way to grant **full platform access** to all users for limited periods — without manually editing plans, overrides, or turning off entitlement enforcement globally without context.

Two operational modes share the same technical behaviour (entitlement bypass) but differ in **messaging and intent**:

| Mode | Intent |
|---|---|
| **Beta** | Initial launch — all signed-in users can explore the full product while we stabilise and gather feedback. |
| **Promo** | Marketing / growth — encourage sign-ups or remind existing users of paid value before access reverts to plan limits. |

When either mode is **active**, entitlement gates and usage limits do not block users. **Roles are unchanged** — band leader, organiser, workspace mode, and admin capabilities continue to work through existing role logic.

---

## 2. Goals

1. Allow platform admins to enable **Beta** or **Promo** mode from the admin portal.
2. Set an optional **end date/time**; access mode auto-expires when the window ends.
3. Show a **nav pill** (“Beta” or “Promo”) so users know they have temporary full access.
4. Bypass all client-side entitlement checks while mode is active (env-forced enforcement still wins in production safety builds).
5. Keep audit trail via `bandie_platform_settings` (`updated_by`, `updated_at`).

## 3. Non-goals

- Replacing Stripe billing or per-user subscription records.
- Replacing **launch promo trials** (`launch_promo_ends_at`) which auto-assign Pro/Organiser Plus to **new sign-ups** — that remains a separate billing onboarding tool.
- Changing RLS or role membership — users still need band membership, organiser flag, etc.
- Public anonymous access to gated workspace routes.

---

## 4. Behaviour

### 4.1 Active access mode

Access mode is **active** when:

- `mode` is `beta` or `promo`, **and**
- `ends_at` is null (open-ended) **or** `now() < ends_at`.

When active:

- `canPerform` / `assertCanPerform` return **allowed** (same effect as `entitlements_enforced = false`).
- Calendar tier checks return **full**.
- Upgrade prompts should not appear for capability blocks (gates never deny).
- Users may still open billing/profile and change plans voluntarily.

When inactive (`mode = off` or expired):

- Normal entitlement enforcement applies (`entitlements_enforced` platform toggle + plan limits).

### 4.2 Priority

| Layer | Effect |
|---|---|
| `VITE_BANDIE_ENFORCE_ENTITLEMENTS=true` | Always enforce — cannot be bypassed by beta/promo (production safety). |
| Platform access mode active | Bypass enforcement |
| `entitlements_enforced` platform setting | Enforce when access mode inactive |
| Per-user plan / overrides | Apply when enforcing |

### 4.3 Roles

Beta/promo does **not**:

- Grant organiser or player workspace flags.
- Add users to bands.
- Elevate band leader status.

Users continue to switch player/organiser workspace and manage roles through existing profile and membership flows.

### 4.4 UI pill

When access mode is active, display a pill in:

- **App header** (`AppHeader`) — workspace navigation.
- **Marketing nav** (`MarketingNav`) — homepage and public pages.

| Mode | Pill label | Tooltip / title |
|---|---|---|
| Beta | Beta | Full access during the Bandie beta |
| Promo | Promo | Limited-time full access — explore all features |

Pill is informational only (not a link) unless we later add a help article.

---

## 5. Admin control

**Location:** Admin portal → Entitlements → **Platform access mode**

Controls:

| Field | Description |
|---|---|
| Mode | Off / Beta / Promo |
| Ends at | Optional datetime-local; empty = no automatic end |
| Note | Optional internal note (stored in setting JSON, admin-visible only) |

Actions:

- **Save** — upserts `bandie_platform_settings.platform_access_mode`.
- Display current status: active/inactive, days remaining, last updated.

Only **platform app admins** may change the setting (existing RLS on `bandie_platform_settings`).

---

## 6. Data model

**Table:** `bandie_platform_settings` (existing)

**Key:** `platform_access_mode`

**Value (JSONB):**

```json
{
  "mode": "off",
  "ends_at": "2026-08-01T23:59:59.000Z",
  "note": "Summer promo — drive organiser sign-ups"
}
```

**RPC:** `bandie_get_platform_access_mode()` — returns normalised JSON for clients (`mode`, `active`, `ends_at`, `days_remaining`, `label`). Executable by `anon` and `authenticated` for nav pill.

---

## 7. Relationship to launch promo

| Feature | Scope | Mechanism |
|---|---|---|
| **Platform access mode** | All users, all entitlement checks | Bypass gates client-side |
| **Launch promo** (`launch_promo_ends_at`) | New sign-ups only | Assigns `launch_promo` subscription rows |

Both may run together during launch. Admins should typically use **Beta** + launch promo for first launch, then **Promo** for targeted campaigns after enforcement is on.

---

## 8. Acceptance criteria

- [ ] Admin can set Beta/Promo with optional end date.
- [ ] While active, organiser/player on free plans can use Plus/Pro-gated features (e.g. open mic create, directories).
- [ ] Nav pill shows correct label for beta vs promo.
- [ ] After `ends_at`, pill disappears and gates apply again (if enforcement on).
- [ ] Role switching and band membership unchanged.
- [ ] Setting readable without auth for marketing nav pill.

---

## 9. Implementation plan

See [`bandie_platform_access_mode_implementation_plan.md`](bandie_platform_access_mode_implementation_plan.md).
