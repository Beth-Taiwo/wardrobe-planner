# Application Userflow — The Whole Journey

## Purpose

This is the **over-arching userflow** for Dress Calendar. Where the other documents in this folder
each describe one feature in depth, this one steps back and maps the **single journey a person
travels through the whole app** — from a cold, empty account to a steady daily habit. It exists to
answer one question the feature docs cannot: *how do the pieces connect, and in what order does a
real person meet them?*

It is a **map, not a flow.** The turn-by-turn detail lives in the per-feature documents (linked in
§ "Where each feature is described"). The unique value here is the **hand-offs between features** —
the edges, not the boxes — and the **shape of the loop** that keeps a person coming back.

The companion diagram is [`app-journey-diagram.md`](./app-journey-diagram.md).

> **Scope — this is the *target* journey.** It describes the intended end-to-end experience and
> follows the core loop framing in the [PRD](../../PRD.md) (§7). A few motions it leads with are
> roadmap, not yet shipped: the one-tap **Log today** quick action, the dedicated
> **add-item** surface, and the **Home insights** dashboard (PRD §7.3, §7.1). They are described
> here as design targets — the same way [`auth-and-accounts.md`](./auth-and-accounts.md) treats
> designed-but-not-built flows. Where this map and the running app differ, the per-feature docs (and
> the PRD) carry the implementation deltas.

## The shape of the app, in one sentence

> A person **stocks** their wardrobe, **captures** what they wore, **plans** what they'll wear, and
> **reviews** how they actually dress — and stocking the wardrobe is the thing everything else
> depends on, so it is built to be effortless.

## Design Decisions

- **The wardrobe is the spine; everything else consumes it.** Planning, daily logging, suggestions,
  and insights all read from the same set of owned clothing pieces. A plan *cannot exist* without at
  least one owned piece (enforced — `OutfitPlanItemOwnershipError`). A log is thin without pieces to
  attach. Home has nothing to summarize until pieces have been worn. So the journey is gated on one
  thing: **getting items into the wardrobe.**
- **"Add an item" is its own first-class motion, not a sub-page of "manage wardrobe."** Logically it
  lives inside the wardrobe, but it is treated as a distinct, convenience-critical surface because
  the success of the entire app rests on it being frictionless. It must be reachable from
  *everywhere a person discovers a gap* — the wardrobe, the planner (inline), and the daily log
  (inline) — not only from one "Add" button on one page.
- **The journey is a loop, not a funnel.** A person does not finish the app. The intended steady
  state is a repeating cycle: **Build → Capture → Plan → Review → Build…** Each lap feeds the next.
  The product's job is to keep that loop short and rewarding, never to push the person toward an
  exit.
- **Capture (daily logging) is the engine of the insight half.** Logging what was worn is the input
  every statistic, "not worn this year" nudge, and suggestion depends on. It is therefore designed
  to be near one-tap, with today pre-filled — a quick action, not a destination the person has to
  navigate to.
- **Home is the hub and the mirror.** After sign-in the person lands on Home. It is both the place
  the loop returns to (review) and the launch pad it sets out from (the prominent *Plan outfit* and
  *Log today* actions). Every lap passes through Home.
- **Friction is front-loaded once, then removed.** The only unavoidable friction is the first
  account and the first few items. After that, the daily motions (log, plan, glance at Home) are
  built to cost as little as possible.

## The core loop

The whole app is four motions in a ring. The user named three of them as the headline features
(manage wardrobe, plan outfits, add an item); the fourth — daily capture — is the quiet input the
insight half of the product runs on. They map onto the app like this:

| Motion | What the person does | Where it lives | Depth doc |
| --- | --- | --- | --- |
| **Build** | Stock and tend the wardrobe; **add new pieces** (the convenience-critical motion) | `/wardrobe` + the add-item surface | *wardrobe-management*, *add-item* (planned) |
| **Capture** | Log what was actually worn today | Quick action → daily-wear log (`DressEntry`) | *daily-wear-log* (planned) |
| **Plan** | Plan an outfit for a future event | `/plan` | [future-outfit-planning](./future-outfit-planning.md) |
| **Review** | Read patterns, most/least worn, upcoming plans | `/home` | *insights* (planned) |

The motions are connected by hand-offs, and the hand-offs are the point:

- **Build → everything.** Every other motion reads the pieces Build produces. This is why Build is
  the spine.
- **Plan → Build (inline).** When a person is planning and the piece they want isn't in the wardrobe
  yet, they add it *without leaving the plan* — the add-item motion reaches into the planner.
- **Capture → Build (inline).** Same story for logging: a piece worn but never recorded can be added
  in place.
- **Capture → Review.** Each log feeds the statistics and the "not worn this year" surface on Home.
- **Review → Plan / Capture.** Home's *Plan outfit* and *Log today* actions launch the next lap.
- **Capture/history → suggestions → Plan.** Past wear, scored to avoid repeating too soon, feeds
  optional outfit suggestions back into planning. (Optional — it never blocks manual planning.)

## Primary Journey

### Getting in

Every protected surface (`/home`, `/wardrobe`, `/plan`, `/account`) sits behind sign-in. An
unauthenticated person is sent to the auth surface and, after signing in — one click with Google, or
email/password — is returned to wherever they were headed, defaulting to Home. The full account
journey is its own document: [auth-and-accounts](./auth-and-accounts.md).

### Cold start — the empty account

A brand-new person lands on Home with **nothing to show**: an empty wardrobe, no wear history, no
plans, no stats. This is the most important moment in the whole app, because almost everything
downstream is blocked until the wardrobe has pieces — a person literally **cannot save a plan**
without owning at least one item.

So the cold-start journey points at one thing: **add your first pieces.** Home's empty state should
lead the person to the **add-item** motion rather than to a generic tour. Because the add-item
surface is built for speed — fast single add with add-another momentum, and text-only pieces as
first-class (a piece works with no image, just a name and type) — a person can stock a usable
wardrobe quickly, with or without photos. This first stocking is the one unavoidable bit of
friction, and the reason the add-item surface is designed for maximum convenience.

The moment the wardrobe is non-empty, the rest of the app unlocks: the person can plan, log, and
start to see insights.

### The steady state — the daily loop

Once stocked, the person settles into the repeating loop:

1. **Build / tend (`/wardrobe`).** They browse pieces in an image-first grid or a fast-scanning
   list, edit details, and — most importantly — **add new pieces as they acquire them.** Adding is
   never more than a tap away. *(Detail: wardrobe-management + add-item, planned.)*
2. **Capture (Log today).** On most days the central act is recording what they wore. A persistent
   **Log today** quick action, with the date pre-filled to today, makes this near one-tap; the
   calendar/history view stays reachable as a secondary surface for backfilling missed days. If a
   worn piece isn't in the wardrobe yet, they add it inline. *(Detail: daily-wear-log, planned.)*
3. **Plan (`/plan`).** Looking ahead to an event, the person plans an outfit — naming the *event*,
   not the outfit — picking pieces from the wardrobe or adding them inline, with optional prep notes
   and optional suggestions. Plans can stack on one date by event. *(Detail:
   [future-outfit-planning](./future-outfit-planning.md).)*
4. **Review (`/home`).** They glance at Home to see what's been worn, what's gathering dust, and
   what's coming up — then push off into the next lap via *Plan outfit* or *Log today*. *(Detail:
   insights, planned.)*

No single lap requires all four motions. A quiet day might be one tap of *Log today*. A big week
might be several plans and a wardrobe top-up. The loop bends to the person's life; it does not demand
a fixed sequence.

### Tending the account

Off to the side of the loop, reachable any time from the account control in the top bar, sits
**account settings** — profile, password, linked Google, and account deletion — plus **sign out**.
This is not part of the daily loop; it is the maintenance edge of the journey. Full detail:
[auth-and-accounts](./auth-and-accounts.md).

## Important Moments

- **First sign-in lands on an empty Home, and Home points straight at adding items** — not a generic
  welcome. The cold start *is* the add-item motion.
- **The wardrobe-empty wall is real and early:** a person cannot save a plan with zero owned pieces.
  The app should explain this where it happens and offer inline item creation, never a dead end.
- **"Add an item" is reachable from wherever a gap is discovered** — the wardrobe page, inside the
  planner, and inside the daily log — not only from a single Add button.
- **Logging stays cheap:** *Log today* is one prominent action with today pre-filled; backfilling
  older days is possible but secondary.
- **Every lap returns through Home,** which both mirrors the wardrobe back to the person (review) and
  launches the next motion (plan / log).
- **Images are always optional.** Across building, logging, and planning, a text-only piece is
  first-class and shows a stable placeholder; nothing in the journey is gated on uploading a photo.
- **Suggestions assist but never block.** History-based suggestions feed planning when available;
  when they're absent or fail, manual planning proceeds unchanged.
- **The loop has no exit.** There is no "done" screen; the steady state is a person dropping in for a
  quick log or plan and leaving — the success state is *return frequency*, not completion.
- **Account maintenance is off the loop,** reachable any time but never in the path of the daily
  motions.

## User Expectations

- The app is a place they **return to**, not a task they finish.
- The first thing worth doing on a fresh account is **adding clothes**, and that is made fast.
- They can **add a piece from wherever they notice it's missing** — wardrobe, plan, or log.
- **Logging today's outfit is quick** and doesn't require navigating to a dedicated page.
- Planning, logging, and insights all draw on **the same wardrobe they built** — one source of truth.
- They are **never forced through a fixed sequence**; they can do just one motion and leave.
- **Photos, suggestions, and prep notes are bonuses,** never required steps.
- Everything they see is **their own private data**, scoped to their account.

## Success Criteria

- A new person's first session leads, from an empty Home, into the **add-item** motion, and they can
  stock a usable wardrobe quickly (including text-only pieces).
- The **wardrobe is the single source of pieces** consumed by planning, logging, suggestions, and
  insights.
- **Adding an item is reachable** from the wardrobe and inline from both the planner and the daily
  log.
- A persistent **Log today** quick action captures the day's outfit with the date pre-filled, with
  the history/calendar view available for backfilling.
- **Home is the authenticated landing page**, serves as both review surface and launch pad, and every
  lap of the loop passes through it.
- The four motions — **Build, Capture, Plan, Review** — are each reachable and connected by the
  documented hand-offs, with no required global sequence.
- The journey **cannot dead-end** on the wardrobe-empty wall: inline item creation is always offered.
- Optional aids (**images, suggestions, prep notes**) never block any motion.
- All data stays **private and scoped to the current user** throughout the journey.

## Where each feature is described

This document is the index of the journey; each motion has (or will have) its own depth doc:

| Area | Document | Status |
| --- | --- | --- |
| Sign-in, accounts, settings | [`auth-and-accounts.md`](./auth-and-accounts.md) | Written |
| Plan (future outfits) | [`future-outfit-planning.md`](./future-outfit-planning.md) | Written |
| Build — manage the wardrobe | [`wardrobe-management.md`](./wardrobe-management.md) | Written |
| Build — **add an item** (convenience-critical) | [`add-item.md`](./add-item.md) | Written |
| Capture — daily wear log / *Log today* | [`daily-wear-log.md`](./daily-wear-log.md) | Written |
| Review — Home insights & stats | `insights.md` | Planned |

> When the planned docs are written, they should describe the *inside* of one motion and defer the
> hand-offs to this document — keeping each feature doc focused and this map the single place the
> connections live.
