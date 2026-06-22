# Dress Calendar — Product Requirements Document

> **Scope of this document:** This PRD records the **current product** (what is built and
> shipping today) and the **near-term roadmap** (planned work signalled by the codebase and
> `tracker.md`). It is descriptive first, forward-looking second. Where the older design notes in
> `docs/` conflict with the running app, this document follows the code and recent commits.

---

## 1. Overview

**Dress Calendar** is a private, single-user wardrobe-planning web app. It helps a person:

- keep a digital **wardrobe** of their real clothing pieces,
- log **what they wore each day**,
- **plan outfits** for future events,
- and **review** how they actually use their wardrobe over time.

It is a personal operational tool — calm, practical, and built for repeat daily use — not a social
or marketing product. All data is **private and scoped per user**: no sharing, no feeds, no other
people's wardrobes.

### Who it's for

A single individual managing their own clothing. Each account is fully self-contained. There are no
organizations, roles, shared closets, or admin surfaces.

### Why it exists

People own more than they wear, forget what they have, repeat the same few outfits, and scramble to
decide what to wear for events. Dress Calendar turns a wardrobe into a tracked, plannable inventory
so the user can make deliberate, informed choices and get more value from clothes they already own.

---

## 2. Goals & Non-Goals

### Goals

- Give the user a complete, private digital inventory of their clothing.
- Make logging daily wear fast enough to become a habit.
- Let the user plan outfits for upcoming events without inventing outfit names.
- Surface useful patterns (most worn, never worn, repeat cadence) to inform decisions.
- Reduce decision fatigue with optional, non-blocking outfit suggestions.
- Keep every user's data strictly isolated.

### Non-Goals (V1)

These are deliberately out of scope and are carried forward from the original account plan's
assumptions (`docs/plan/user-account.md`):

- **No sharing, social, or multi-user closets.** Accounts are personal and private.
- **No organizations, teams, roles, or admin console.**
- **No OAuth providers beyond Google** in V1 (plus email/password).
- **No e-commerce, shopping, price tracking, or affiliate features.**
- **No native mobile app** — the app is a responsive web app.

---

## 3. Core Features

Each feature below maps to real pages (`pages/`) and API resource groups (`server/api/`).

### 3.1 Authentication & Accounts
*Pages: `login`, `register`, `account` · API: `auth`, `account`*

- Email/password sign-up and sign-in (passwords scrypt-hashed).
- Google OAuth sign-in, including linking to an existing password account by verified email.
- Session-based auth via an `HttpOnly` hashed-token cookie (`wardrobe_session`).
- Password reset support (`PasswordResetToken` model).
- Account settings: update display name, change password, view linked Google account, and delete
  the account (transactional removal of all owned data).
- Route middleware (`middleware/auth.ts`) redirects unauthenticated users to `/login`.

### 3.2 Wardrobe (Clothing Items)
*Pages: `wardrobe` · API: `clothes`*

- Create, edit, and delete clothing pieces with **name, label/type, color, notes, and image**.
- Grid view (image-first) and list view (fast scanning) of the wardrobe.
- Image upload per item, plus **batch upload** for adding many pieces at once.
- Text-only pieces are first-class: an item works without an image (a placeholder is shown).

### 3.3 Daily Wear Log (Dress Calendar)
*Component: `DressCalendarApp.vue` · API: `dresses`, `outfits/history`*

- Record what was worn on a given date (`DressEntry`): title, color, category, notes, image, and
  the clothing pieces involved.
- One entry per user per date (compound-unique on `userId + date`).
- Browse wear history by date and review past outfits.

### 3.4 Future Outfit Planning
*Pages: `plan` · API: `plans`*

- Plan an outfit for a future **event/occasion** (e.g. "Team presentation", "Birthday dinner"),
  naming the *event*, not the outfit.
- A plan requires a date and **at least one clothing piece** (enforced —
  `OutfitPlanItemOwnershipError`); pieces can be selected from the wardrobe or added inline.
- **Multiple plans per date** are supported, distinguished by event name.
- Optional **prep notes** (accessories, ironing, weather reminders) live in a collapsed
  "Additional details" section (progressive disclosure).
- Upcoming plans surface on Home and reopen in edit mode.

### 3.5 Outfit Suggestions
*API: `suggestions`*

- For a target date, suggests pieces/outfits to reuse from history, scored to avoid repeating
  something worn too recently.
- Scoring favors same-month and same-weekday patterns, workday-appropriate categories, and longer
  time-since-last-worn; each suggestion includes human-readable reasons.
- Suggestions are **optional and never block** manual planning; suggestion failure is non-fatal.

### 3.6 Insights & Stats (Home)
*Pages: `home` (default landing) · API: `stats`*

- Home dashboard summarizing wardrobe usage: metric cards, most-worn items, category breakdown,
  and "not worn this year" cleanup opportunities.
- A clear **"Plan outfit"** call to action.
- A "classify uncategorized" entry point for cleanup.

### 3.7 Import & Category Cleanup
*API: `import`, `import/preview`, `categories/normalize`*

- Bulk-import wardrobe/wear data with a **preview** step before committing.
- Normalize/clean up category labels across existing items.

---

## 4. Navigation & Information Architecture

- **Default landing after sign-in:** `/home`. (`/` redirects to `/home`.)
- **Primary navigation:** Home · Wardrobe · Plan.
- Account controls (display name/email, link to settings, logout) live in a compact top bar.
- Auth pages (`/login`, `/register`) do not use the full app navigation.

> Note: the older `docs/theme-layout.md` references a standalone "Calendar" destination. There is no
> separate `calendar` route in the current app — the daily-wear calendar UI lives inside the app
> shell, and the dedicated future-planning surface is `/plan`. The visual/theming guidance in that
> doc otherwise still applies.

---

## 5. Data Model (summary)

Per-user ownership is enforced on every wardrobe model via `userId`.

| Model | Purpose | Key fields |
| --- | --- | --- |
| `User` | Account identity | email, normalizedEmail (unique), displayName, passwordHash? |
| `Session` | Auth session | hashed token, userId, expiresAt |
| `OAuthAccount` | Linked provider identity | provider, providerAccountId, userId, emailVerified |
| `PasswordResetToken` | Password reset | hashed token, userId, expiresAt, usedAt? |
| `ClothingItem` | A wardrobe piece | userId, name, label, color?, imageUrl?, notes? |
| `DressEntry` | What was worn on a date | userId, date, title, color?, category?, notes?, imageUrl? |
| `DressEntryItem` | Join: entry ↔ pieces | dressEntryId, clothingItemId |
| `OutfitPlan` | Planned outfit for an event | userId, date, eventName, prepNotes? |
| `OutfitPlanItem` | Join: plan ↔ pieces | outfitPlanId, clothingItemId |

Conventions: app-generated UUIDs (`VarChar(36)`); dates stored as `YYYY-MM-DD` strings; snake_case
table/column names via Prisma `@map`/`@@map`; schema applied with `db push` (no checked-in
migrations).

---

## 6. Non-Functional Requirements

- **Privacy & isolation:** every protected route starts with `requireUser(event)` and scopes all
  queries by `user.id`. Unauthenticated requests return `401`; requests for resources owned by
  another user return `404`. No endpoint may leak another user's data.
- **Data access discipline:** all DB access goes through `server/utils/db.ts`; rows are passed
  through `to*` serializers before reaching clients; join-table mutations run in a transaction.
- **Rendering:** Nuxt 3 SSR enabled.
- **Validation:** request bodies validated/sanitized in handlers; client errors thrown via
  `createError({ statusCode, statusMessage })`.
- **Environment hygiene:** `.env` and `.env.example` kept in sync; validated with
  `npm run env:check`.

---

## 7. Roadmap (Planned / Known Gaps)

Signalled by `tracker.md` and the codebase:

1. **Private image storage.** Uploaded images currently live under `public/uploads/clothes/<userId>/`
   and are publicly reachable by URL. Move uploads out of `public/` into private storage and serve
   them through an **authenticated streaming endpoint** (e.g. `/api/images/clothes/[id]`) that runs
   `requireUser(event)` + ownership-by-`userId` on every request — matching the app's existing
   access pattern and giving instant revocation. Signed time-limited URLs are deferred to a later
   move to object storage (S3/R2/GCS), if/when image traffic warrants it.
2. **Category expansion beyond clothing (as a top-level item type).** Add household textiles such as
   **beddings** by introducing a single top-level `type` field on `ClothingItem` —
   `"clothing"` (default) | `"bedding"` — *above* the existing `label`. `label` remains the sub-type
   within a type (garment labels for clothing; sheet/duvet/pillowcase for bedding). Existing rows
   default to `"clothing"`. **Gate behavior by type:** outfit planning, suggestions, the daily-wear
   log, and outfit-centric stats operate on `clothing` only; the wardrobe page gains a simple
   Clothing/Bedding filter. This keeps the "what do I wear today" loop free of non-garments. Avoid a
   generic nested-category system — one field, sensible default, behavior gating. (Note: this is a
   deliberate step from "outfit planner" toward "personal textile inventory.")
3. **First-class daily wear logging ("Log today").** Logging is the input the entire insight half of
   the product depends on, so it must be near-frictionless. Add a persistent primary
   **"Log today's outfit"** quick action (top bar + prominent on Home) with the date pre-filled to
   today — a one-tap capture, *not* a new top-level Calendar page. Keep the calendar/history view
   reachable as a secondary surface for backfilling missed days and reviewing past wear. This makes
   the core loop explicit: Wardrobe (build) → Log today (capture) → Plan (look ahead) →
   Home (review).
4. **Account management polish.** Continue rounding out the account surface (profile, password,
   linked providers, deletion) — largely built, tracked for refinement.

---

## 8. Open Questions

*None currently open — earlier questions on private-image delivery, bedding taxonomy, and daily-wear
navigation are resolved in §7.*
