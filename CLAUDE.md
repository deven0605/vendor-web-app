# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Type-check then build for production (tsc && vite build)
npm run preview  # Preview the production build
```

There are no tests configured yet.

## Architecture

**ThaliCloud Vendor Portal** — a React 18 + TypeScript SPA for cloud kitchen vendors to manage meal plans and track orders. Built with Vite.

### Tech stack
- React 18 with React Router v6 (file-based routing via `AppRouter`)
- TypeScript strict mode, no unused locals/parameters enforced
- CSS Modules for all styling (each component/page has a co-located `.module.css`)
- Leaflet / react-leaflet for interactive map (used in vendor registration)
- No state management library — local `useState` only; all data is currently mocked

### Path alias
`@/` resolves to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### Route structure (`src/routes/AppRouter.tsx`)
| Path | Component | Layout |
|---|---|---|
| `/login` | `LoginPage` | standalone (full-screen split panel) |
| `/register` | `RegisterPage` | standalone |
| `/dashboard` | `DashboardPage` | `AppLayout` (sidebar) |
| `/meal-plans` | `MealPlansPage` | `AppLayout` |
| `/meal-plans/create` | `CreateMealPlanPage` | `AppLayout` |
| `/meal-plans/:planId/manage` | `ManageDaysPage` | `AppLayout` |
| `*` | redirect → `/login` | — |

`AppLayout` wraps authenticated pages with a persistent left sidebar (`Sidebar`) and an `<Outlet>` for the page content.

### Auth (`src/utils/authFetch.ts`)
- Tokens stored in `localStorage` under keys `accessToken` and `refreshToken`
- `authFetch` is a drop-in `fetch` replacement that injects `Bearer` token and retries once on 401 by calling `/api/auth/refresh`
- `logoutApi` POSTs to `/api/auth/logout` (best-effort) then clears localStorage and redirects to `/login`
- Use `authFetch` instead of plain `fetch` for all authenticated API calls

### API proxy
Vite dev server proxies `/api/*` → `http://localhost:8081` (the backend). All API calls use relative paths like `/api/auth/login`.

### Current data state
All page data is **mocked** with hardcoded constants (marked with `// Mock data — replace with API calls` comments). Pages like `MealPlansPage`, `DashboardPage`, `ManageDaysPage`, and `CreateMealPlanPage` have `TODO` placeholders where real API calls should go.

### KitchenMap component (`src/components/KitchenMap/KitchenMap.tsx`)
Used on the registration page for location selection. Calls OpenStreetMap Nominatim for reverse geocoding on pin-drop and forward geocoding for the search box. Leaflet marker icons are manually fixed for Vite's asset bundling (default icons are broken without the explicit `L.icon()` override at the top of the file).

### Registration flow (`src/pages/RegisterPage.tsx`)
3-step wizard: Basic Info → Location (map or manual) → Operating Hours. On submit, POSTs to `/api/auth/register` and stores tokens on success.
