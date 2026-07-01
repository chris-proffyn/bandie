# Bandie Platform Access Mode — Implementation Plan

**Last updated:** 27 June 2026

---

## Phase 1 — Data & enforcement

- [x] 1.1 Migration — `platform_access_mode` setting seed, `bandie_get_platform_access_mode()` RPC
- [x] 1.2 `packages/data/src/platformAccessMode.ts` — parse, status, get/set, load
- [x] 1.3 `entitlementEnforcement.ts` — bypass when access mode active
- [x] 1.4 Export from `@bandie/data` index

## Phase 2 — Web client

- [x] 2.1 Load access mode on app boot (`App.tsx`)
- [x] 2.2 `AppHeader` — Beta/Promo pill
- [x] 2.3 `MarketingNav` — Beta/Promo pill
- [x] 2.4 CSS — `app-platform-mode-pill` variants

## Phase 3 — Admin

- [x] 3.1 `AdminEntitlementsPage` — mode selector, end date, save, status display

## Phase 4 — Documentation

- [x] 4.1 `bandie_platform_access_mode_spec.md`
- [x] 4.2 `product-functional-requirements.md` §12c
- [x] 4.3 `PROJECT_STATUS_TRACKER.md` progress note

## Deferred

- [ ] Server-side RPC entitlement checks (if added later) must read the same setting
- [ ] In-app banner with promo end date (pill only for MVP)
- [ ] Scheduled job to log mode expiry (client-side expiry sufficient for MVP)
