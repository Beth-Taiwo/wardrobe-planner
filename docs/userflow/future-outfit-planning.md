# Future Outfit Planning Userflow

## Purpose

This userflow describes how an authenticated Wardrobe Planner user plans an outfit for a future event or occasion. The experience starts from insight, moves into a dedicated planning page, and keeps the date as one part of the plan rather than making the calendar the main workflow.

## Primary Journey

The user signs in and lands on insight. This page gives them a quick read on their wardrobe activity, repeat patterns, and upcoming planning needs. From there, the user clicks a clear `Plan outfit` action.

The app takes the user to a dedicated plan page. The page focuses on the plan itself: the event or occasion, the date, the outfit pieces, and any reminders the user needs before wearing it.

The user names the event or occasion, not the outfit. Examples might be `Team presentation`, `Birthday dinner`, `Church`, `Travel day`, or `Client meeting`. This gives the plan a useful reason without forcing the user to invent names for clothing combinations.

The user chooses the date and builds the outfit from wardrobe pieces. At least one piece is required because the pieces are the outfit. If the piece already exists in their wardrobe, they select it for the plan. If it does not exist yet, they add it inline with a name and clothing type, then attach it to the current plan.

Images are nice-to-add, not required. If the user has not uploaded images, the plan still works with text-only pieces such as `Black trousers`, `White blouse`, or `Gold earrings`. The interface should show a stable placeholder for pieces without images and keep the user focused on completing the outfit.

To keep the form simple, optional planning details stay collapsed by default. The user can expand an `Additional details` section to choose a context or add prep notes. Context helps classify the plan for filtering and suggestions, such as `Work`, `Church`, `Travel`, `Dinner`, `Formal`, or `Casual`. Prep notes capture practical reminders, such as accessories, washing, ironing, shoes, or weather concerns. Neither field is required to save the plan.

The user can also ask for a suggestion. Suggestions are optional: they help the user reuse something from their history without repeating too soon, but they never block manual planning.

When the user saves, the outfit plan is attached to the event and date. The plan becomes visible from insight as an upcoming plan and can be reopened later for editing.

## Important Moments

- If the user has no upcoming plans, insight makes the `Plan outfit` action prominent.
- If the user starts from insight, they should not need to visit a calendar just to choose a date.
- If the user changes the date while drafting, the draft keeps its event and outfit details.
- If the selected date already has a plan, the app should help the user understand the conflict before saving.
- If the wardrobe is empty, the user must add at least one text-only piece inline before saving the plan.
- If a selected piece has no image, the app shows a placeholder and keeps the piece selectable.
- If the user does not need context or prep notes, those fields stay hidden inside a collapsed optional section.
- If suggestions are unavailable, the user sees that state and continues manually.
- If saving succeeds, insight and plan history reflect the upcoming plan immediately.
- If the user reopens a saved plan, the page loads it in edit mode.

## User Expectations

- A signed-in user can plan for any valid future event date.
- Each user has private outfit plans.
- The user names the event or occasion, not the outfit.
- The date supports planning, but the calendar is not the primary planning surface.
- Different users can plan outfits for the same event date independently.
- Outfit pieces are required.
- Images, suggestions, outfit history, context, and prep notes are helpful additions, not required steps.
- Optional fields should use progressive disclosure so the main form only asks for the event, date, and outfit pieces.

## Success Criteria

- Insight is the authenticated landing page.
- Insight includes a clear `Plan outfit` action.
- The `Plan outfit` action takes the user to a dedicated plan page.
- A user can save a future outfit plan with an event name, date, and at least one outfit piece.
- Context and prep notes are collapsed by default in an optional details section.
- Saved future plans appear in insight or another upcoming-plan surface.
- Reopening a saved future plan opens edit mode.
- Inline clothing creation can attach a new text-only or image-backed piece to the current plan.
- Suggestion failure does not block saving.
- Authenticated data remains scoped to the current user.
