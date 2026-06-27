# Wardrobe Management Userflow

> Part of the app journey — see [`app-journey.md`](./app-journey.md) for how this fits the whole.

## Purpose

This userflow describes how a person **manages the clothing pieces they own** — browsing, editing,
and removing them. The wardrobe is the **spine of the app**: planning, daily logging, suggestions,
and insights all read from it. This document covers *tending* an existing wardrobe; the
convenience-critical motion of *adding* pieces has its own document, [`add-item.md`](./add-item.md),
because the app's success rests on it.

The guiding principle is **a calm, scannable inventory the person trusts**: it should be easy to see
what they own, find a specific piece, and keep details accurate, without ceremony.

This document describes the intended experience; deltas from what ships today are listed at the end.

## Design Decisions

- **The wardrobe is the single source of pieces.** Every place that uses clothing — the planner, the
  daily log, suggestions, stats — selects from this one set. Keeping it accurate is therefore
  high-leverage, and management is built around quick correction, not data entry ceremony.
- **Two views for two needs: see vs. scan.** An **image-first grid** is for recognizing pieces at a
  glance; a **compact list** is for fast scanning and bulk-style work across many pieces. The person
  switches freely; the choice is a preference, not a mode that changes what they can do.
- **Text-only pieces are equal citizens.** A piece without a photo shows a stable placeholder and is
  fully usable everywhere. The wardrobe never pressures the person to add images.
- **Editing is direct and low-stakes.** Opening a piece lets the person fix its name, type, color,
  notes, or image in place. Corrections are expected and frequent (a wardrobe drifts as life
  changes), so editing is one of the primary motions, not an afterthought.
- **Deletion is deliberate.** Removing a piece is a clear, confirmed action because the piece may be
  referenced by past wear and future plans; the person should understand what removal means before
  it happens.

## Primary Journey

The person opens **Wardrobe** and sees everything they own. By default the **grid** presents pieces
image-first, each showing its image (or a placeholder), name, and type. The person can switch to a
**list** view for denser, faster scanning when they have many pieces or want to work down the
collection quickly.

To **find** a specific piece in a large wardrobe, the person narrows the set — by label and by text —
so the grid/list shows only what's relevant.

To **edit**, the person opens a piece and changes any of its details — name, type, color, notes, or
image — then saves. The change is reflected immediately wherever the piece appears.

To **remove** a piece, the person deletes it from the piece itself, confirming the action. Because a
piece can be tied to wear history and plans, the app makes the consequence clear before removing.

To **add** pieces — the most important wardrobe motion — the person uses the always-available add
entry point. That flow (single add, inline add) is documented separately in
[`add-item.md`](./add-item.md).

## Important Moments

- If the wardrobe is empty (a new account), the page leads the person straight to **adding pieces**
  rather than showing a blank grid. (This cold start is the backbone of
  [`app-journey.md`](./app-journey.md).)
- If the person has many pieces, they can switch to the list view and/or narrow by type and text to
  find a specific piece quickly.
- If a piece has no image, the grid and list show a stable placeholder and the piece stays fully
  usable.
- If the person edits a piece, the change appears immediately everywhere the piece is shown or
  selectable.
- If the person deletes a piece, they confirm first, and the app makes clear it may affect wear
  history and plans that reference it.
- If the person needs to add while managing, the add entry point is always one tap away.

## User Expectations

- The wardrobe shows everything they own, accurately, in one place.
- They can view it image-first to recognize pieces, or as a list to scan fast.
- They can find a specific piece by type and text without scrolling endlessly.
- They can correct a piece's details quickly and see the fix reflected everywhere.
- Removing a piece is deliberate and explained, not accidental.
- Pieces without photos are just as usable as pieces with them.
- The wardrobe is private and scoped to their account.

## Success Criteria

- The wardrobe lists every piece the person owns, scoped to their account.
- Grid (image-first) and list (compact) views are both available and switch freely.
- The person can narrow the wardrobe by item type and by text search.
- A piece's name, type, color, notes, and image are editable, and edits propagate to every surface
  that uses the piece.
- A piece can be deleted via a confirmed action that surfaces its impact on history and plans.
- Pieces without images render a stable placeholder and remain fully functional.
- The add entry point is reachable from the wardrobe at all times (detail in
  [`add-item.md`](./add-item.md)).
- An empty wardrobe routes the person into adding pieces rather than a dead-end blank state.

## Current vs. Intended (implementation deltas)

- **CRUD ships today:** list (`clothes/index.get.ts`), create (`index.post.ts`),
  edit (`[id].put.ts`), delete (`[id].delete.ts`), image upload (`upload.post.ts`). Grid and list
  views exist.
- **Label filter + text search** narrow the wardrobe on this page (over the existing `label` set and
  piece names). The app stays focused on garments — there is no bedding/non-clothing item type.
- **Deletion-impact messaging** (warning that a piece is referenced by history/plans) is a design
  target to round out the confirmed-delete action.
