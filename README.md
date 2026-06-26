# Bandie

**The simple hub for your band life.**

Bandie is a web and mobile platform for amateur bands and event organisers — combining public band profiles, a searchable directory, and a private member workspace for songs, setlists, gigs, and availability.

Built with the [Proffyn Rapid Solution Delivery (RSD)](docs/RSD_FOUNDATION_OVERVIEW.md) framework.

**Repository:** [github.com/chris-proffyn/bandie](https://github.com/chris-proffyn/bandie)

---

## Repository structure

```
/
├── apps/
│   ├── web/          Vite + React + TypeScript (@bandie/web)
│   └── mobile/       React Native / Expo (placeholder)
├── packages/
│   ├── ui/           Shared UI components (@bandie/ui)
│   ├── data/         Supabase data-access layer (@bandie/data)
│   └── utils/        Utilities and analytics (@bandie/utils)
├── supabase/
│   ├── migrations/   Database migrations
│   └── seed/         Dev seed data
└── docs/             Governance and project documentation
```

---

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
npm install
npm run dev
```

The web app runs at [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
```

---

## Environment variables

Copy `.env.example` to `.env` (repo root) and `apps/web/.env.local` (web client vars).

```bash
# Client — publishable key (sb_publishable_...)
VITE_SUPABASE_URL=https://cjmgrsvbrcgozgjxbriz.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_APP_CODE=bandie

# Server — secret key (sb_secret_...), root .env / supabase/.env only
SUPABASE_SECRET_KEY=
```

Never commit `.env` files. Never put `SUPABASE_SECRET_KEY` in `apps/web/`.

---

## Documentation

| Document | Purpose |
|---|---|
| [PROJECT_STATUS_TRACKER.md](docs/PROJECT_STATUS_TRACKER.md) | Live delivery status and current focus |
| [PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) | Product scope and MVP |
| [DELIVERY_TASK_MAP.md](docs/DELIVERY_TASK_MAP.md) | Phased delivery plan |
| [product-functional-requirements.md](docs/project/product-functional-requirements.md) | Functional requirements |
| [product-technical-requirements.md](docs/project/product-technical-requirements.md) | Technical stack and decisions |
| [bandie_product_description.md](docs/project/bandie_product_description.md) | Full product vision |

---

## Architectural decisions

| Decision | Choice |
|---|---|
| Web framework | Vite + React + TypeScript |
| Backend | Shared Supabase instance, `bandie_` table prefix |
| Hosting | Netlify |
| Data access | `@bandie/data` only — UI never calls Supabase directly |

See [product-technical-requirements.md](docs/project/product-technical-requirements.md) for full details.

---

## Current status

**Phase:** Bootstrap complete  
**Next:** Bandie Homepage — see [homepage spec](docs/project/bandie_homepage_functional_technical_spec.md)

---

## License

Private — Proffyn / Bandie project.
