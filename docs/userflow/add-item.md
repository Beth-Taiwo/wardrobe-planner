# Add an Item Userflow

> Part of the app journey — see [`app-journey.md`](./app-journey.md) for how this fits the whole.

## Purpose

This userflow describes how a person **adds a clothing piece to their wardrobe**. Logically this
sits inside wardrobe management, but it is documented on its own because it is the
**convenience-critical motion of the whole app**: the wardrobe is the spine everything else reads
from, a person cannot plan an outfit without owning at least one piece, and the very first thing a
new account must do is stock the closet. Every second of friction here taxes the entire product, so
the guiding principle is **the fastest possible path from "I own this" to "it's in my wardrobe."**

This document designs the intended experience. It folds in roadmap behavior (a persistent quick
add) described as a design target; where it differs from what ships today, the deltas are listed at
the end.

> Scope: a **bulk / multi-piece add** (adding many pieces in one pass) is out of scope for now. Add
> is single-piece — one quick add at a time, plus inline add mid-task. Adding stays fast through
> momentum (add-another without leaving), not bulk entry.

## Design Decisions

- **Add one piece at a time, fast.** The person adds the piece they're looking at right now — a
  single quick add — and the form stays ready for the next one. Speed comes from low friction per
  piece and add-another momentum, not from bulk entry.
- **The only required input is identity — a name *or* an image.** A piece is valid with just a name
  (`Black trousers`) or just a photo. Everything else — type, color, notes — is optional. A piece
  added as an image with no name is given a sensible default name so it never blocks.
- **Text-only is first-class; photos are a bonus.** A wardrobe built entirely from typed names works
  completely. Pieces without images show a stable placeholder. Nothing about adding is gated on
  taking or uploading a picture.
- **Type is a pick, not a free-text guess.** Clothing type is chosen from a known label set
  (Blouse, Shirt, Skirt, Dress, Gown, Trousers, Jeans, Kimono, Boubou, Jacket, Top, Shoes,
  Accessory, Other) so the wardrobe stays filterable and the daily/planning surfaces can reason
  about it. Type is still optional.
- **Reachable from wherever a gap is noticed.** Add is available from the wardrobe page, and inline
  from the planner and the daily log — a person who discovers a missing piece mid-task adds it in
  place and keeps going. (The cross-feature hand-offs themselves live in
  [`app-journey.md`](./app-journey.md).)
- **Momentum over modals.** After saving, the person can immediately add another without re-opening
  anything. Adding ten pieces should feel like one continuous motion, not ten separate tasks.

## Primary Journey

### Quick single add

From the wardrobe, the person triggers **Add piece**. They type a name, optionally pick a type, and
optionally add a color, a note, and a photo. The save action is enabled as soon as there is a name
*or* an image — the rest can stay blank. On save, the piece appears in the wardrobe immediately, and
the form stays ready for the next piece so the person can keep adding without leaving.

If the person attached only a photo and no name, the piece is still saved and given a clear default
name (e.g. `New jacket`) they can rename later.

### Adding inline, mid-task

If the person is planning an outfit or logging a worn outfit and the piece isn't in the wardrobe
yet, they add it **in place** with a name and type, and it attaches to the current plan or log while
also joining the wardrobe. They never have to break their task, navigate to the wardrobe, add the
piece, and come back. (See [`app-journey.md`](./app-journey.md) for these hand-offs.)

### Images

Images are written per piece and referenced by URL; allowed types are jpg, jpeg, png, webp, and
gif. A photo is always optional — a piece without one shows a placeholder and behaves identically
everywhere else in the app.

## Important Moments

- If the person provides a name **or** an image, the piece can be saved; if they provide neither, the
  add is rejected.
- If only an image is provided, the piece is saved with a sensible default name.
- If a chosen type isn't in the known label set, it's rejected; a blank type is allowed.
- If the person has no photos, adding still works with text-only pieces.
- After a successful add, the person can immediately add another without re-opening the form.
- If the person adds a piece inline from the planner or the log, it joins the wardrobe and attaches
  to the current task at once.
- Newly added pieces appear in the wardrobe immediately and become selectable everywhere pieces are
  used.

## User Expectations

- Adding a piece is fast and asks for as little as possible — a name or a photo is enough.
- Type, color, notes, and images are optional refinements, not gates.
- They can add one piece quickly, and keep adding without losing momentum.
- They can add a piece from wherever they notice it's missing, without losing their place.
- A text-only wardrobe is fully supported.
- Everything they add is private to their account.

## Success Criteria

- A piece can be created with **only** a name, or **only** an image.
- Type is selected from the known label set and is optional; an invalid type is rejected, a blank
  type is allowed.
- An image-only piece is saved with a sensible default name.
- Adding is reachable from the wardrobe and inline from the planner and the daily log.
- After saving, adding another piece requires no extra navigation.
- New pieces appear immediately in the wardrobe and are selectable across planning and logging.
- Image upload accepts jpg/jpeg/png/webp/gif and is never required.
- All added pieces are scoped to the current user.

## Current vs. Intended (implementation deltas)

- **Single add exists today** (`server/api/clothes/index.post.ts`, image upload via
  `clothes/upload.post.ts`).
- **A persistent, always-one-tap-away "Add piece" entry point** is the convenience target; today's
  entry points should be consolidated toward that.
- **Inline add from the planner and the daily log** both ship today.
