# Bandie — Product Requirements

**Document status:** Authoritative product requirements summary  
**Product:** Bandie  
**Last updated:** 27 June 2026

---

## 1. Purpose

This document is the **authoritative product requirements summary** for Bandie. It consolidates scope, users, capabilities, and MVP boundaries.

Detailed functional and technical requirements live in:
- `docs/project/product-functional-requirements.md`
- `docs/project/product-technical-requirements.md`

The full product vision and domain detail is in:
- `docs/project/bandie_product_description.md`

When documents conflict on product intent, this file and the functional requirements take precedence over generic RSD guidance.

---

## 2. Product summary

Bandie is a web and mobile platform for **amateur bands** and **event organisers**.

> A public band profile and private band workspace that helps amateur bands promote themselves, organise gigs, manage setlists, store song resources, track availability, and look credible to event organisers.

**Tagline:** The simple hub for your band life.

---

## 3. Target users

### Primary: Bands

Amateur and semi-professional bands without formal management — cover bands, pub bands, wedding/party bands, community bands, weekend musicians.

### Primary: Event organisers

Pub landlords, venue managers, festival/community event organisers, party planners who need to find and book suitable bands.

### Secondary

Individual musicians in multiple bands, band leaders, dep/substitute musicians, promoters, rehearsal studios.

---

## 4. Product surfaces

### 4.1 Public surface

- Marketing homepage
- Band directory (searchable)
- Player directory (deputy and member search modes)
- Public band profiles (mini-sites)
- Public player profiles
- Booking enquiry route (planned)
- Public calendar availability (confirmed/provisional gigs — planned)

### 4.2 Private band workspace

Member-only area scoped to a selected band:

- My bands hub and band switcher
- Unified band overview (public profile editor, members, invitations)
- Musician / player profile (`/app/profile`)
- Songs dashboard and song folders (planned)
- Setlist management (planned)
- Calendar (rehearsal + gig availability) (planned)
- Gig management (planned)
- Booking enquiry inbox (planned)
- Activity and notifications (planned)

---

## 5. Core capabilities (build elements)

See `docs/project/bandie_build_elements.md` for the full list. Summary:

| # | Capability |
|---|---|
| 1 | Bandie Homepage |
| 2 | Public Band Promotion |
| 3 | Band Directory |
| 4 | Band Account, Workspace and Membership |
| 5 | Songs and Repertoire Management |
| 6 | Song Folder / Song Workspace |
| 7 | Setlist Management |
| 8 | Calendar and Availability Planning |
| 9 | Gig Management |
| 10 | Booking Enquiries |
| 11 | Notifications and Activity |
| 12 | Media, Links and External Content |
| 13 | Mobile / Performance Mode |
| 14 | Administration and Platform Foundations |

---

## 6. MVP scope

### In scope

1. User accounts and band membership — **done**
2. Band creation and private workspace shell — **done** (songs/setlists deferred)
3. Public band profile — **done**
4. Musician / player profiles and directory — **done**
5. Band directory with search/filter — **done**
6. Songs dashboard — **not started**
7. Song folder with part folders and file uploads — **not started**
8. Setlist management — **not started**
9. Calendar availability (rehearsal + gig modes) — **not started**
10. Basic booking enquiry route — **not started**

### Out of scope (MVP)

- Payments and invoicing
- Contract generation
- Full review/ratings marketplace
- AI setlist generation
- In-app chat
- Deep audio/video hosting
- Automated copyright/licensing
- Complex calendar integrations

### MVP success criteria

**Bands can:** create a credible public page, manage songs and files, build a setlist, coordinate availability, appear in the directory, receive booking enquiries.

**Organisers can:** search/filter bands, view profiles, understand suitability, submit an enquiry.

---

## 7. Product principles

1. **Keep it lightweight** — not enterprise project management
2. **Public/private separation** — private data never leaks to public views
3. **Support existing workflows** — structure external links and files, don't replace every tool
4. **Mobile matters** — responsive web; mobile app for member tasks
5. **Reduce chasing** — readiness, availability, and gaps visible without repeated messages
6. **Help bands look professional** — clean profiles, clear booking info
7. **Build for reuse** — songs, setlists, and gig plans are reusable objects

---

## 8. Design direction

- Dark backgrounds, high contrast, bright accents
- Music-oriented, energetic but practical
- Public pages: promotional and polished
- Private workspace: structured dashboard patterns
- Reference mockups in `docs/project/*.html`

Example band in mockups: **Skin Condition** (post-punk / new wave covers, London).

---

## 9. Delivery sequencing

See `docs/DELIVERY_TASK_MAP.md` for phased delivery order.

**Current focus:** Songs and repertoire management — see `docs/PROJECT_STATUS_TRACKER.md`.

---

## 10. Open product questions

Tracked in `bandie_product_description.md` §16. Key items for early resolution:

- Public profile publication: opt-in vs default public?
- File size limits and hosted vs linked files in MVP?
- Automatic vs manual public availability publishing?
- Mobile MVP feature subset?

Decisions should be recorded in functional requirements when resolved.
