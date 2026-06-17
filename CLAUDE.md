# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CookShare is a recipe-sharing service split into two independently-installed apps in one repo:

- `backend/` — Express + TypeScript REST API on port **4000**
- `frontend/` — Next.js 14 (App Router) + shadcn/ui on port **3000**

There is no root-level package manager workspace; each app has its own `package.json` and `node_modules`. Run `npm install` in each directory separately.

Design docs live in `docs/` (`MVP-SPEC.md`, `WBS.md`, `ARCHITECTURE.md`, `RISK-ANALYSIS.md`) — read these for product scope, schedule, and known risks before larger changes.

## Commands

### Backend (`cd backend`)

- `npm run dev` — start API with hot reload (`tsx watch`)
- `npm run build` — compile to `dist/` (`tsc`)
- `npm run typecheck` — type-check without emitting; **use this to validate backend changes**
- `npm start` — run compiled `dist/index.js`
- First-time setup: `cp .env.example .env` (the API refuses to boot without `JWT_SECRET`)

### Frontend (`cd frontend`)

- `npm run dev` — Next.js dev server
- `npm run build` — production build; **use this to validate frontend changes** (catches type errors)
- `npm run lint` — ESLint (`next lint`)
- First-time setup: `cp .env.example .env.local` (sets `NEXT_PUBLIC_API_URL`)

### Tests

No test framework is configured yet. Per `docs/WBS.md`, tests are planned but not present — do not assume a test runner exists. Validate via `npm run typecheck` (backend) and `npm run build` (frontend).

## Backend architecture

Request flow is a strict layering — keep new code in the matching layer:

```
routes/ → controllers/ → models/ → db/
```

- **`config/env.ts`** is the single source of env config. `requireEnv` throws on missing vars (only `JWT_SECRET`), `optionalEnv` supplies defaults. Import `env` from here; never read `process.env` directly elsewhere.
- **`db/index.ts`** exposes an async **pg `Pool`** via `getPool()`/`query()` (node-postgres) connecting to `DATABASE_URL`. `setPool()` lets tests inject a pg-mem pool. All DB access goes through models, which `await query(...)`.
- **`db/migrate.ts`** runs `CREATE TABLE IF NOT EXISTS` (Postgres DDL) on boot — `await migrate()` is called from `index.ts` before `app.listen`. No migration versioning; add schema changes here manually.
- **`models/`** own all SQL as **async** functions using parameterized `query("... $1 ...", [..])` (search uses `ILIKE`, inserts use `RETURNING`). The key pattern lives in `recipe.model.ts`:
  - DB rows are **snake_case** (`RecipeRow`); API returns **camelCase** DTOs (`RecipeDTO`).
  - `ingredients` and `steps` are stored as **JSON strings** in the DB and parsed to arrays in `toRecipeDTO`. Always serialize with `JSON.stringify` on write and map through the DTO on read.
  - Models join the author and return `author: { id, name }`.
- **`controllers/`** validate input with **zod** schemas defined at the top of each file, then call models. They throw `AppError` for failures.
- **`middleware/error.ts`** defines `AppError(message, status, code)` and the central error handler. **All error responses use the shape `{ error: { message, code } }`** — match this when adding endpoints.
- **`middleware/auth.ts`** — `requireAuth` validates the `Authorization: Bearer <token>` header, then attaches `req.user: { id, email, name }` (typed via a global Express augmentation). Protected routes mount it before the controller.
- **`storage/`** is a swappable file-storage abstraction. `storage/index.ts` is a factory keyed on `STORAGE_DRIVER` (currently only `local` → `LocalStorage` writing to `UPLOAD_DIR`). To add S3, implement `Storage` in a new file and add a `case 's3'` — controllers depend only on the `Storage` interface and need no changes.

JWT payload uses `sub` (user id), `email`, `name` (`utils/jwt.ts`). Passwords hashed with bcryptjs (`utils/password.ts`).

## Frontend architecture

- **Fully client-side data fetching.** Pages are `'use client'` and fetch through `lib/api.ts`; there is no server-component data loading. Builds succeed without the backend running.
- **`lib/api.ts`** is the single API gateway: it injects the `Bearer` token from `localStorage`, strips `Content-Type` for `FormData` uploads, and throws `Error` on non-OK responses. Add all new endpoint calls here.
- **`lib/auth.tsx`** — `AuthProvider` / `useAuth()` hold the token + user in React state, persist the token to `localStorage`, and restore the session on mount via `getMe()`. `logout()` only clears client state (tokens are not server-revocable).
- **shadcn/ui** components live in `components/ui/` and were added manually (no `shadcn` CLI). `lib/utils.ts` provides the `cn()` helper.
- Uploaded images are served from the backend origin (`http://localhost:4000/uploads/...`), which is why `next.config.mjs` whitelists that host under `images.remotePatterns`.

## Cross-cutting contract

Frontend ↔ backend are coupled by an implicit API contract (no shared types package). When changing one side:

- **Field casing:** API DTOs are camelCase (`imageUrl`, `cookTime`), DB rows are snake_case.
- **Error shape:** backend always returns `{ error: { message, code } }`. The frontend error parser in `lib/api.ts` must read `error.message` from that nested shape — verify both sides agree when touching error handling.
- **Image flow:** upload first via `POST /api/uploads` (multipart field `image`), then send the returned `url` as `imageUrl` when creating/updating a recipe.

The full endpoint list is in `README.md` and `docs/ARCHITECTURE.md`.
