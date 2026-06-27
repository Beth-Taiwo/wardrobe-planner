# Daily Wear Log Userflow

> Part of the app journey — see [`app-journey.md`](./app-journey.md) for how this fits the whole.

## Purpose

This userflow describes how a person **records what they actually wore on a given day**. Logging is
the quiet input the entire insight half of the product runs on: every statistic, every "not worn
this year" nudge, and every history-based suggestion depends on it. If logging is a chore, those
features starve. So the guiding principle is **near one-tap capture** — today pre-filled, the
heaviest lifting optional — with a calmer history surface available for filling in missed days.

This document describes the intended experience, including the roadmap **Log today** quick action;
deltas from what ships today are listed at the end.

## Design Decisions

- **Capture is the point; everything else is optional.** A log earns its keep the moment the person
  records *that they got dressed and roughly what they wore*. Title, color, category, notes, and a
  photo are all optional enrichments. The bar to a valid log is deliberately low.
- **Today is the default.** The common case is logging the current day, so the date is pre-filled to
  today and capture is reachable as a persistent quick action — not a page the person has to
  navigate to and configure.
- **Pieces tie the log to the wardrobe.** A log can reference the actual wardrobe pieces worn, which
  is what powers most-worn / least-worn insights and the "don't repeat too soon" suggestion scoring.
  Attaching pieces is encouraged but not forced — a quick text log still counts.
- **One log per day, editable.** Each day holds a single wear entry per person (a day is one outfit
  story). Re-logging the same day updates that day's entry rather than creating a duplicate.
- **History is for backfilling and review, not the main act.** A calendar/history surface lets the
  person fill in days they missed and look back at past wear, but it is the secondary surface; the
  primary motion is the quick "log today."
- **Inline add keeps capture unbroken.** If a worn piece isn't in the wardrobe yet, the person adds
  it in place (see [`add-item.md`](./add-item.md)) rather than abandoning the log.

## Primary Journey

### Logging today (the headline path)

The person triggers **Log today** — a persistent quick action with the date already set to today.
They give the outfit a short title (or accept a light default), optionally pick the pieces they
wore, and optionally add color, a category, notes, or a photo. They save. That's the whole motion:
ideally a few taps, capturing the day before the memory fades.

If a piece they wore isn't in the wardrobe yet, they add it inline and it both joins the wardrobe and
attaches to today's log.

### Backfilling a missed day

To record a day they forgot, the person opens the **history / calendar** surface, selects the date,
and logs it the same way — the only difference is the date isn't today. The history surface is also
where they browse and review past outfits.

### Re-logging a day

If the person logs a day that already has an entry, the app updates that day's existing entry rather
than creating a second one — a day is a single wear story. The person can reopen any day's entry to
correct its title, pieces, or details.

## Important Moments

- If the person uses **Log today**, the date is already today and capture is a few taps.
- If the person provides at least a minimal entry for a day, the log is saved and immediately feeds
  insights and suggestion scoring.
- If a worn piece isn't in the wardrobe, the person adds it inline without leaving the log.
- If the person logs a day that already has an entry, the existing entry is updated, not duplicated.
- If the person attaches no pieces, the log still saves as a lighter record (with reduced insight
  value).
- If the person misses days, the history/calendar surface lets them backfill any past date.
- If the person reopens a day, it loads in edit mode with its saved details.
- Photos, color, category, and notes are always optional and never block saving.

## User Expectations

- Logging today is fast, with today already selected.
- They can capture a day with very little — a title and maybe the pieces.
- Attaching the pieces they wore makes their insights and suggestions better, but isn't required.
- Each day holds one outfit entry, which they can edit later.
- They can fill in missed days from a history view without it being the main workflow.
- They can add a missing piece without abandoning the log.
- Their wear history is private and scoped to their account.

## Success Criteria

- A persistent **Log today** quick action captures the day with the date pre-filled to today.
- A wear entry saves with a minimal record; title, color, category, notes, pieces, and image are all
  optional beyond what identifies the day.
- Each day holds exactly one wear entry per person; re-logging a day updates it instead of
  duplicating (one-per-date is enforced).
- Worn pieces can be attached from the wardrobe, and a missing piece can be added inline (detail in
  [`add-item.md`](./add-item.md)).
- A history/calendar surface lets the person backfill any past date and review past outfits.
- Reopening a day loads its entry in edit mode.
- Saved logs immediately feed Home insights and suggestion scoring.
- All wear data is scoped to the current user.

## Current vs. Intended (implementation deltas)

- **Wear entries exist today** (`DressEntry`, `server/api/dresses/`): create/update via
  `index.post.ts` (one entry per `userId + date`, enforced — a conflicting date returns 409),
  list via `index.get.ts`, and delete via `[id].delete.ts`. The calendar/history UI lives in
  `DressCalendarApp.vue`, which is where past wear is reviewed.
- **The persistent "Log today" quick action** (top bar + prominent on Home, today pre-filled) is
  built — a drawer with the date pre-filled, plus a wear-history calendar on Home as the secondary
  backfill/review surface.
- **Inline add from the log** should match the planner's existing inline-add (see
  [`add-item.md`](./add-item.md)).
