# Dress Calendar — Project Instructions

A Nuxt 3 wardrobe-planning app. Users log what they wore each day, build a wardrobe of
clothing items, and plan future outfits. Data is private and scoped per user.

## Tech Stack

- **Framework**: Nuxt 3 (Vue 3, `<script setup>`, TypeScript), SSR enabled.
- **UI**: shadcn-nuxt (New York style, `neutral` base) in `components/ui/`, Tailwind CSS v4
  (configured via `@tailwindcss/vite`, not a `tailwind.config`), CSS variables in
  `assets/css/main.css`. Icons via `@lucide/vue` / `@iconify-json/*`. Toasts via `vue-sonner`.
- **Forms**: `vee-validate` + `@vee-validate/zod` with `zod` schemas.
- **Database**: Prisma 7 with the MariaDB adapter (`@prisma/adapter-mariadb`) over MySQL/MariaDB.
- **Server**: Nuxt Nitro server routes in `server/api/`.

## Commands

- `npm run dev` — start the dev server (port 3000).
- `npm run build` / `npm run generate` — production build / static generate.
- `npm run env:check` — validate `.env` and `.env.example` are in sync (run after env changes).
- `npm run prisma:validate` — validate the Prisma schema.
- `npm run prisma:generate` — generate the Prisma client.
- `npm run db:push` — push the schema to the database (this project uses `db push`, **not**
  checked-in migrations).
- `npm run seed` — seed the database (`scripts/seed.ts`).

## Project Layout

- `pages/` — routes: `index`, `home`, `wardrobe`, `plan`, `account`, `login`, `register`.
- `components/` — app components (e.g. `DressCalendarApp.vue`); `components/ui/` is generated
  shadcn primitives (avoid hand-editing these).
- `composables/` — shared composables (e.g. `useToast`).
- `server/api/` — Nitro endpoints, grouped by resource (`clothes`, `dresses`, `plans`,
  `outfits`, `auth`, `account`, `stats`, `suggestions`, `categories`, `import`).
- `server/utils/` — `db.ts` (Prisma client + all data-access helpers and serializers),
  `auth.ts` (sessions, password/token hashing, `requireUser`), `dress.ts` (input helpers).
- `prisma/schema.prisma` — data model.
- `middleware/auth.ts` — route guard that redirects unauthenticated users to `/login`.
- `types/` — shared TS types. `lib/utils.ts` — `cn()` and shared utilities.
- `docs/` — design notes (`auth.md`, `theme-layout.md`, plans, userflows). `tracker.md` — todo list.

## Conventions

- **TypeScript everywhere**, `<script setup>` for components. Match the surrounding code's
  style: double quotes and no semicolons in `server/` TS files.
- **Auth**: every protected server route starts with `const user = await requireUser(event)`
  and scopes all queries by `user.id`. Never return another user's data.
- **Data access goes through `server/utils/db.ts`.** Use the existing `to*` serializers
  (`toClothingItem`, `toDressEntry`, `toOutfitPlan`) before returning rows to clients — don't
  leak raw Prisma rows. Mutations that touch join tables run inside `prisma.$transaction`.
- **IDs** are app-generated UUIDs (`crypto.randomUUID()`), stored as `VarChar(36)`.
- **Dates** are stored as `VarChar(10)` strings in `YYYY-MM-DD` form, not `DateTime`.
- **Validation**: validate and sanitize request bodies in the handler (see `cleanOptional`,
  allowed-label sets); throw `createError({ statusCode, statusMessage })` for client errors.
- **Image uploads** are written to `public/uploads/clothes/<userId>/` and referenced by URL;
  this directory is gitignored. Allowed types: jpg, jpeg, png, webp, gif.
- **Prisma**: when changing `schema.prisma`, run `prisma:validate` → `prisma:generate` →
  `db:push`. The schema uses `@map`/`@@map` snake_case table/column names.

## Environment Variables (from AGENTS.md — enforced)

- Keep `.env` and `.env.example` in sync: every key present in one must be present in the other.
- Every environment variable used by project source code or runtime configuration must be
  listed in both `.env` and `.env.example`.
- Store real local values only in `.env`. Use safe placeholder values in `.env.example`;
  never commit real secrets.
- When adding, renaming, or removing an environment variable, update both env files in the
  same change and run `npm run env:check`.
- Known vars: `NODE_ENV`, `HOST`, `PORT`, `DATABASE_URL`, `AUTH_SESSION_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

## Notes

- Auth supports email/password (scrypt-hashed) and Google OAuth; sessions use a hashed token
  cookie (`wardrobe_session`). See `docs/auth.md`.
- Outfit plans require at least one owned clothing item (`OutfitPlanItemOwnershipError`).
