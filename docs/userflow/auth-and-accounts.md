# Authentication & Accounts Userflow

## Purpose

This userflow describes how a person creates an account, signs in, and manages that account in
the Wardrobe Planner. The guiding principle is **least friction to get in**: signing in is the
gate in front of every private wardrobe, so the fastest possible path should be the default one.
The app treats **Continue with Google as the primary, one-click way in** — it both creates an
account and signs an existing user back in — and keeps the email/password form available but
tucked behind a secondary "other sign-in options" reveal for people who do not want to use Google.

This document designs the intended experience. It folds in two changes from what ships today:
a **single unified auth surface** (replacing the separate `/login` and `/register` pages) and
**Google sign-in that returns the user to the page they were trying to reach**. Password reset is
described as designed-but-not-yet-built. Where the doc and the running app differ, the
implementation deltas are listed at the end.

## Design Decisions

- **Google-first, single click.** "Continue with Google" is the prominent primary action on the
  auth surface. Because the Google callback already resolves new-vs-returning users and links by
  verified email, one button covers both sign-up and sign-in. The user does not pick "register"
  vs. "log in" before using Google.
- **One auth surface, not two pages.** The separate `/login` and `/register` pages collapse into a
  single page. The new-vs-returning distinction only matters for the email/password path, so it is
  handled *inside* the revealed form (a toggle), not by routing the user to a different page first.
- **Progressive disclosure for email/password.** The email/password form is hidden by default
  behind an "other sign-in options" control. It is a deliberate secondary path, not a competing
  primary one.
- **Account, not credentials, is the identity.** A single account can have both a password and a
  linked Google identity. Signing in with Google using an email that already has a password account
  links them rather than creating a duplicate.

## Primary Journey

### Getting in (the headline path)

An unauthenticated person who opens any protected page (`/home`, `/wardrobe`, `/plan`, `/account`)
is redirected to the auth page, with their intended destination remembered.

The auth page leads with one clear action: **Continue with Google**. The person clicks it once,
chooses a Google account, and is returned signed-in to the page they originally wanted — or to
`/home` if they came in cold. If no account exists for that Google identity, one is created
silently from their verified Google email and name; there is no separate sign-up step. If an
account already exists (by linked Google identity, or by a matching verified email), they are
signed straight into it.

That is the whole journey for most people: one click, no form.

### Using email and password instead

Below the Google action sits a quiet **"Other sign-in options"** control. Activating it reveals
the email/password form in place, without leaving the page.

The revealed form defaults to **sign in**: email, password, a primary "Sign in" button, and a
"Forgot password?" link. A person who does not yet have a password account switches the form to
**create account** via a clear toggle ("New here? Create an account"). In create mode the form
also asks for a display name. Switching between modes keeps whatever email the person has already
typed. On success, the person is signed in and returned to their intended destination, exactly as
with Google.

Google remains visible while the email/password form is open, so a person who changes their mind
can still take the one-click path.

### Recovering a forgotten password *(designed, not yet built)*

From the revealed sign-in form, "Forgot password?" leads to a request screen where the person
enters their email. The app always responds the same way — "If that email has an account, we've
sent a reset link" — so the screen never reveals whether an email is registered. The emailed link
carries a single-use, time-limited token (the `PasswordResetToken` model already exists for this);
following it opens a set-new-password screen, and on success the person is signed in and all other
active sessions for that account are invalidated. A person whose account is Google-only can use
this same flow to *set* a password for the first time, giving them a second way in.

### Managing the account

A signed-in person reaches **Account settings** from the account control in the top bar. Settings
is organized as small, independent cards:

- **Profile** — update the display name. The account email is shown for reference.
- **Password** — change an existing password (requires the current one), or, for a Google-only
  account, *set* a password for the first time (no current password required). A minimum length is
  enforced before the action is allowed.
- **Linked accounts** — shows whether Google is linked. If it is not, "Continue with Google" links
  the current account to the Google identity (matching by verified email) rather than creating a
  new one.
- **Delete account** — a clearly destructive, separated action. It warns that it removes the
  account, sessions, linked identities, wardrobe, calendar entries, plans, and outfit history,
  asks for explicit confirmation, then transactionally deletes everything and returns the person
  to the unauthenticated auth page.

### Signing out

The account control in the top bar offers **Sign out**, which clears the session and returns the
person to the auth page.

## Important Moments

- If an unauthenticated person opens a protected page, they are sent to the auth page and returned
  to that page after signing in — by Google **or** by email/password.
- If the person uses Google and has no account, one is created from their verified Google email and
  name with no extra steps.
- If the person uses Google and an account already exists for that identity or verified email, they
  are signed into it; no duplicate account is created.
- If Google reports the email as unverified, sign-in is refused with a clear message.
- If the person opens "Other sign-in options," the email/password form appears in place and
  defaults to sign in; Google stays visible above it.
- If a returning person is actually new (or vice versa), they switch the email/password form's mode
  with one control, and the email they already typed is preserved.
- If a password account uses a too-short password, the create/change action stays disabled with the
  requirement shown.
- If sign-in or account creation fails, an inline error explains why and the person stays on the
  form with their input intact.
- If the person forgets their password, the reset request screen gives the same response whether or
  not the email is registered, so account existence is never leaked.
- If a Google-only person sets a password in settings or via reset, they gain a second way in
  without losing Google.
- If the person links Google from settings, it attaches to their existing account instead of
  creating a new one.
- If the person deletes their account, they confirm first, and all of their data is removed
  together before they are returned to the auth page.

## User Expectations

- The fastest, most prominent way in is one click with Google, and it works for both new and
  returning people.
- Email/password is always available but never in the way; it lives behind a secondary reveal.
- Choosing "register" vs. "sign in" is not a decision the person makes up front — Google handles
  both, and the email/password form handles both via a single toggle.
- After signing in, the person lands where they were headed, not on a generic page.
- One account can carry both a password and a linked Google identity; using Google with a known
  email links rather than duplicates.
- A Google-only account can gain a password later, and a password account can link Google later.
- Account data is private and per-user; settings only ever shows and changes the current person's
  account.
- Deleting the account removes everything the person owns, and is hard to do by accident.

## Success Criteria

- There is a single auth surface; "Continue with Google" is its primary action and performs both
  sign-up and sign-in.
- Email/password sign-in and account creation are reachable from that surface behind an "other
  sign-in options" reveal, with new-vs-returning handled by an in-form toggle (no separate page).
- Signing in by any method returns the person to the route they originally requested, defaulting to
  `/home`.
- Google sign-in creates an account from a verified Google identity when none exists, and links to
  an existing account by verified email when one does, with no duplicates.
- A person can set, change, and use an email/password credential, including setting one on a
  Google-only account.
- Password reset gives an identical response regardless of whether the email is registered, uses a
  single-use time-limited token, and signs the person in on success. *(Designed; not yet built.)*
- Account settings lets the person update their display name, manage their password, see and link
  Google, and delete the account.
- Account deletion is confirmed, transactional, removes all owned data, and returns the person to
  the auth page.
- Unauthenticated access to protected pages is redirected to the auth page; all account data stays
  scoped to the current user.

## Current vs. Intended (implementation deltas)

These are the gaps between this design and what ships today, for whoever implements the flow:

- **Unify the auth pages.** `pages/login.vue` and `pages/register.vue` are currently two separate
  pages that both lead with the email/password form and place Google below an "or" separator. The
  intended design is a **single auth page** that leads with Google and hides email/password behind
  an "other sign-in options" reveal, with an in-form sign-in/create toggle. Keep `route.query`
  redirect threading that both pages already do.
- **Return-to-route after Google.** `server/api/auth/google/index.get.ts` puts only a CSRF token in
  the OAuth `state`, and `server/api/auth/google/callback.get.ts` hardcodes `sendRedirect("/home")`.
  To honor "return to the originally-requested route," the start route should capture the intended
  redirect (e.g. encode it alongside the CSRF token in `state`) and the callback should send the
  person there after `createSession`, falling back to `/home`.
- **Password reset is unbuilt.** The `PasswordResetToken` model exists, but there are no
  request/confirm routes or UI. The reset journey above is a design target, not current behavior.
- **Account settings already exists** (`pages/account.vue`) and largely matches this design —
  profile, set/change password, link Google, delete — and is carried forward, not redesigned.
