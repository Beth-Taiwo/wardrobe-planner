# User Account Management Plan

## Summary
Add personal user accounts to the Nuxt 3 wardrobe planner with email/password login plus Google OAuth sign-in. The current database integration is Prisma 7 using the MySQL provider with `@prisma/adapter-mariadb`, configured from `DATABASE_URL`, so account management should be implemented in `prisma/schema.prisma` and the existing async Prisma helper layer in `server/utils/db.ts`.

Each authenticated user gets a private calendar, wardrobe, stats, suggestions, imports, and outfit history. Existing pre-account wardrobe data should not be assigned to new users; after account support is enabled, authenticated users start with empty personal data.

## Database And Prisma Changes
- Extend `prisma/schema.prisma` with auth models:
  - `User`: id, email, normalized unique email, display name, optional password hash, timestamps.
  - `Session`: id, hashed token, `userId`, expiry timestamp, timestamps, relation to `User`.
  - `OAuthAccount`: provider, provider account id, `userId`, provider email metadata, timestamps, relation to `User`.
  - Optional `PasswordResetToken` if password reset is implemented in the same pass.
- Add ownership to existing wardrobe models:
  - `DressEntry.userId` with relation to `User`.
  - `ClothingItem.userId` with relation to `User`.
  - Keep `DressEntryItem` as the join table between owned dress entries and owned clothing items.
- Replace the current global `DressEntry.date @unique` with a compound uniqueness rule: `@@unique([userId, date])`.
- Add useful indexes for scoped reads: `[userId, date]`, `[userId, label]`, and auth lookup indexes for sessions and OAuth identities.
- Because the project currently uses `prisma db push` rather than checked-in migrations, update the plan for schema application to use:
  - `npm run prisma:validate`
  - `npm run prisma:generate`
  - `npm run db:push`
- For existing data, choose one explicit transition before applying required `userId` fields:
  - archive or delete legacy `dress_entries`, `clothing_items`, and `dress_entry_items`, then add required ownership fields; or
  - temporarily add nullable `userId`, deploy account support, then clean up legacy unowned rows and make ownership required.

## Auth Implementation
- Add server-side auth helpers in the existing server utility pattern:
  - create and verify password hashes using Node `crypto.scrypt`.
  - generate random session tokens.
  - store only hashed session tokens in the Prisma `Session` table.
  - expose `getCurrentUser(event)` and `requireUser(event)` helpers for API routes.
- Set the session cookie as `HttpOnly`, `SameSite=Lax`, and `Secure` in production; allow non-secure cookies during local development.
- Add email/password routes:
  - register
  - login
  - logout
  - current user
  - password change in account settings
- Add Google OAuth routes:
  - authorization redirect start
  - callback handler
  - account creation from verified Google identity
  - linking by matching verified email when a password account already exists.
- Keep account deletion transactional: delete sessions, OAuth accounts, dress-entry joins, dress entries, clothing items, and finally the user.

## API And Data Scoping
- Update `server/utils/db.ts` functions to accept `userId` for all private data access instead of reading global records.
- Scope current helper behavior by user:
  - `listDressEntries(userId, filters)`
  - `findDressByDate(userId, date)`
  - `upsertDressEntry(userId, entry)` using the new compound unique key.
  - `updateDressEntry(userId, id, entry)` using `updateMany` or a compound ownership check.
  - `deleteDressEntry(userId, id)`
  - `listClothingItems(userId)`, create/update/delete clothing item helpers.
  - stats, suggestions, outfit history, imports, and category normalization.
- Validate clothing ownership before creating `DressEntryItem` rows so a user cannot link another user’s clothing item by ID.
- Protect these API route groups with `requireUser(event)`:
  - `/api/dresses`
  - `/api/clothes`
  - `/api/stats`
  - `/api/suggestions`
- Return `401` for unauthenticated requests and `404` for authenticated requests targeting a resource not owned by the current user.

## UI Changes
- Add `/login` and `/register` pages with email/password forms and a Google sign-in action.
- Add route middleware so `/home`, `/wardrobe`, and `/plan` require authentication.
- Add signed-in account controls to the main layout:
  - display name or email
  - logout
  - link to account settings.
- Add an account settings page with:
  - profile display name update
  - password change for password-based accounts
  - linked Google account status
  - account deletion flow.
- Ensure unauthenticated users are redirected to `/login`, then returned to their original route after successful login.

## Configuration
- Continue using `DATABASE_URL` for Prisma/MariaDB.
- Add required auth environment variables:
  - `AUTH_SESSION_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
- Document Google OAuth setup, redirect URI requirements, and the local MariaDB `DATABASE_URL` default in project docs.

## Test Plan
- Run `npm run prisma:validate`, `npm run prisma:generate`, and `npm run build`.
- Register with email/password, log out, log back in, and confirm wardrobe data persists only for that user.
- Sign in with Google and confirm a new empty account is created.
- Sign in with Google using an email that already has a password account and confirm account linking behavior.
- Verify two users can both create an outfit on the same date.
- Verify one user cannot fetch, update, delete, search, import into, normalize, or link another user’s data by guessing IDs.
- Verify stats, suggestions, outfit history, calendar, wardrobe, imports, and category normalization only use the current user’s data.
- Verify session expiry, logout, invalid session cookies, and unauthenticated API calls behave correctly.

## Assumptions
- V1 supports personal private accounts only: no sharing, organizations, roles, or admin console.
- Google is the only OAuth provider in v1.
- The app remains on Prisma with the MySQL provider and MariaDB adapter.
- Existing pre-account data remains inaccessible to new users by default.
- Account deletion removes the user’s wardrobe, calendar entries, OAuth identities, sessions, and account record.
