# Application Userflow — Diagram

The visual companion to [`app-journey.md`](./app-journey.md). It shows the **whole-app journey**:
the gate (auth), the **cold start** that forces a new person to stock their wardrobe first, and the
**repeating loop** — Build → Capture → Plan → Review → Build — with the inline hand-offs that let a
person add an item from wherever they notice a gap.

Read the edges, not just the boxes: the connections between motions are the payload.

## The journey

```mermaid
flowchart TD
    Visitor([Person opens the app]) --> Auth{Signed in?}
    Auth -- no --> AuthSurface[Auth surface<br/>Google / email-password]
    AuthSurface --> Auth
    Auth -- yes --> Home

    Home{{Home — hub and mirror<br/>review + launch pad}}

    %% Cold start: empty account is gated on stocking the wardrobe
    Home -- empty account --> ColdStart[/Empty state points to<br/>ADD ITEMS/]
    ColdStart --> Add

    %% --- The core loop ---
    subgraph Loop[The daily loop — no required order, no exit]
        direction LR
        Build[Build<br/>/wardrobe<br/>the spine — everything reads from it]
        Add([Add an item<br/>convenience-critical<br/>text-only OK])
        Capture[Capture<br/>Log today — date pre-filled<br/>DressEntry]
        Plan[Plan<br/>/plan — name the event<br/>requires ≥1 owned piece]
        Review[Review<br/>insights, most/least worn,<br/>upcoming plans]

        Add --> Build
        Build --> Capture
        Capture --> Plan
        Plan --> Review
        Review --> Build

        %% Inline add-item reaches into the other motions
        Plan -. add piece inline .-> Add
        Capture -. add piece inline .-> Add

        %% History feeds optional suggestions back into planning
        Capture -. wear history .-> Suggest([Suggestions<br/>optional, never blocks])
        Suggest -. reuse, not too soon .-> Plan
    end

    %% Home is the hub the loop returns to and launches from
    Review --> Home
    Home -- Plan outfit --> Plan
    Home -- Log today --> Capture
    Home -- tend wardrobe --> Build

    %% Build is what unblocks the rest
    Build == unblocks ==> Plan
    Build == unblocks ==> Capture
    Build == feeds ==> Review

    %% Off-loop maintenance
    Home -. top bar .-> Account[/Account settings<br/>profile, password, Google,<br/>delete · sign out/]

    classDef spine fill:#1f2937,stroke:#111827,color:#fff;
    classDef hub fill:#2563eb,stroke:#1e3a8a,color:#fff;
    classDef addmotion fill:#d97706,stroke:#92400e,color:#fff;
    classDef optional fill:#f3f4f6,stroke:#9ca3af,color:#111827;
    class Build spine;
    class Home hub;
    class Add,ColdStart addmotion;
    class Suggest,Account optional;
```

## How to read it

- **Gate (top).** Every surface sits behind sign-in; a signed-in person lands on **Home**. Detail:
  [`auth-and-accounts.md`](./auth-and-accounts.md).
- **Cold start (orange path).** A new, empty account is steered straight into **Add an item** —
  because nothing downstream works until the wardrobe has pieces.
- **The loop (center).** **Build → Capture → Plan → Review → Build.** It is a ring, not a funnel:
  there is no exit, and no lap has to use all four motions.
- **Build is the spine (dark).** The bold `unblocks` / `feeds` edges show that planning, logging, and
  insights all depend on owned pieces. A plan needs at least one (`OutfitPlanItemOwnershipError`).
- **Add an item is everywhere (orange).** Dotted `add piece inline` edges show it reaching into the
  planner and the daily log, not just the wardrobe — the convenience-critical motion.
- **Home is the hub (blue).** Every lap returns to it (review) and launches from it (*Plan outfit*,
  *Log today*, tend wardrobe).
- **Optional aids (grey, dotted).** Wear history feeds **suggestions** back into planning, but they
  never block. Account settings sits off the loop.

## Notes

- This is a Mermaid `flowchart` so it renders inline anywhere Mermaid is supported (GitHub,
  most markdown previewers) and stays diffable in version control — matching the rest of `docs/`.
- If a presentation-grade visual is ever needed, this same graph can be regenerated in FigJam/Figma
  via the Figma MCP `generate_diagram` tool; the Mermaid source here is the canonical version.
