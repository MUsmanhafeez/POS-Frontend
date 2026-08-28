# Forkiva Admin & POS (Frontend)

Next.js 15 (App Router) admin panel and POS UI for Forkiva. Talks to the Express API over `/api/v1`.

**Stack:** Next.js 15 · React 19 · Tailwind CSS 4 · Zustand · Axios · Lucide

## Prerequisites

- Node.js 20+
- Backend API running (default `http://127.0.0.1:4000`)

## Setup

```bash
cd frontend
# create .env.local (see Environment below)
npm install
npm run dev          # http://localhost:3000
```

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api/v1
```

| Variable | Default | Notes |
|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:4000/api/v1` | Backend API base URL |

Env files matching `.env*` are gitignored.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |

## Default login

Requires a seeded backend:

- **Email:** `admin@forkiva.app`
- **Password:** `12345678`

Login page: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)

## What’s included

- Auth (login) + JWT session in the client
- Admin shell with permission-aware navigation
- Dashboard, orders, invoices, POS registers / order taker
- Menus, products, categories, seating (floors / zones / tables)
- Inventory-related screens, discounts/vouchers, taxes, branches
- Users & roles, reports, activity / authentication logs
- Tools (including database tools), translations, theme support

## Project layout

```
frontend/
  src/
    app/
      auth/login/          # Login
      admin/               # Admin pages (orders, POS, reports, …)
      order/               # Order-related routes
    components/
      admin/               # Shared admin UI (list shell, topbar, …)
      pos/                 # POS modules
    lib/
      api.ts               # Axios client
      nav.ts               # Admin navigation
      reports/             # Report catalog
      i18n/                # Messages
    stores/                # Zustand (auth, theme, …)
```

## Pair with backend

```bash
cd ../backend
npm run db:install && npm run seed && npm run dev
```

Then open the frontend at [http://localhost:3000](http://localhost:3000).

## Troubleshooting

- **API errors / CORS:** Confirm backend `CORS_ORIGIN` includes `http://localhost:3000` and `NEXT_PUBLIC_API_URL` points at the API.
- **Turbopack / `.next` glitches:** Stop the dev server, run `rm -rf .next`, then `npm run dev` again.
- **Empty data:** Seed the backend with `npm run seed` from the `backend` folder.
