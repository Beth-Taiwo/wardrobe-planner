# Theme and Layout Specification

This document formalizes the visual direction, layout rules, and reusable interface patterns for Wardrobe Planner. It is intended to guide future UI work across home, wardrobe, authentication, and account screens.

## Product Feel

Wardrobe Planner is a personal operational tool for planning outfits, reviewing wear history, and managing clothing pieces. The interface should feel calm, practical, and organized. It should prioritize fast scanning, clear form flows, and repeat daily use over marketing-style presentation.

The visual style should be refined but restrained:

- Clear hierarchy over decoration.
- Dense but readable information layouts.
- Warm neutral surfaces with functional accent colors.
- Consistent panels, cards, rows, and form spacing.
- Minimal animation, used only for state feedback.

## Theme Tokens

Use a warm, quiet base with teal as the primary action color and amber as a secondary highlight. Avoid building the whole interface from one hue family.

| Token | Value | Usage |
| --- | --- | --- |
| `app.bg` | `#f7f5f1` | Page background |
| `app.surface` | `#ffffff` | Main panels and form surfaces |
| `app.surfaceMuted` | `#f2ede6` | Empty states, image placeholders, subdued blocks |
| `app.border` | `rgba(64, 52, 43, 0.14)` | Default borders |
| `app.borderStrong` | `rgba(64, 52, 43, 0.24)` | Hover/focus borders |
| `app.text` | `#231f1c` | Primary text |
| `app.textMuted` | `#6f6258` | Secondary text and metadata |
| `app.primary` | `#0f766e` | Primary buttons, active nav, focus accents |
| `app.primarySoft` | `#e8f4f1` | Soft primary backgrounds |
| `app.secondary` | `#b45309` | Eyebrows, cleanup prompts, import emphasis |
| `app.success` | `#15803d` | Successful saves/imports |
| `app.warning` | `#d97706` | Suggestion warnings and caution states |
| `app.error` | `#dc2626` | Destructive actions and validation errors |

## Typography

Use the Nuxt UI default font stack unless a project-wide font is deliberately introduced. Typography should be compact and legible.

- Page title: `text-3xl sm:text-4xl`, semibold, tight line height.
- Section title: `text-xl`, semibold.
- Card title: `text-sm` to `text-base`, semibold.
- Body text: `text-sm`.
- Metadata: `text-xs`, muted color.
- Eyebrows: `text-xs`, uppercase, semibold, letter spacing no more than `0.08em`.

Do not scale font sizes directly with viewport width. Use responsive breakpoint classes instead.

## Layout System

### App Shell

The default layout should provide one consistent shell for all pages:

- Max content width: `1440px`.
- Horizontal padding: `1rem` on mobile, `1.25rem` or `1.5rem` on tablet and desktop.
- Vertical page rhythm: `gap-5` or `gap-6`.
- Authenticated user controls live in a compact top bar.
- Main content should not sit inside a decorative outer card.

Recommended structure:

```vue
<main class="app-shell">
  <div class="app-container">
    <header class="app-topbar">...</header>
    <div class="app-main">
      <slot />
    </div>
  </div>
</main>
```

### Page Header

Each primary app view should share the same header pattern:

- Left: product eyebrow, page title, optional short subtitle.
- Right: navigation and view-level actions.
- Mobile: stacked.
- Desktop: title left, actions right, baseline-aligned.

Primary navigation order:

1. Home
2. Wardrobe
3. Calendar

Calendar remains the default destination after sign in.

### Responsive Grids

Use predictable grid tracks for the major workflows:

- Calendar view: `lg:grid-cols-[minmax(0,1fr)_380px]`.
- Wardrobe with editor open: `lg:grid-cols-[minmax(0,1fr)_380px]`.
- Wardrobe without editor: single column.
- Home: metric grid `sm:grid-cols-2 lg:grid-cols-4`; detail grid `lg:grid-cols-3`.
- Auth pages: centered card with max width around `28rem`.
- Account settings: two-column grid on large screens.

Side panels should remain fixed-width on desktop so forms do not expand into uncomfortable line lengths.

## Component Patterns

### Panels

Use panels for major functional areas such as home, wardrobe, and side editors.

Panel rules:

- Border radius: `0.75rem`.
- Border: `app.border`.
- Background: `app.surface`.
- Padding: `1rem`.
- Shadow: subtle only, used consistently.

Panels should not be nested inside other panels.

### Cards

Use cards for repeated items or contained summaries:

- Home metric cards.
- Clothing grid items.
- Selected clothing thumbnails.
- Import preview rows.
- Delete confirmation preview.

Card radius should be `0.5rem`. Avoid large rounded cards.

### Lists

Use list rows for wardrobe list mode, history results, category counts, and most-worn entries.

List row rules:

- Rows have consistent padding.
- Divider between rows.
- Hover background only on interactive rows.
- Text truncates where names can become long.

### Calendar Cells

Calendar cells are interactive tiles with stable dimensions:

- Minimum height: `7rem` desktop, smaller only if mobile space requires it.
- Use border and subtle background to separate cells.
- Selected date should have a clear primary border and soft primary background.
- Empty non-month cells should be muted and disabled.
- Outfit title and category should truncate inside cells.
- Hover detail tooltip should not overlap adjacent critical controls.

### Forms

Forms should be grouped by task:

- Outfit identity: date, title, suggestion controls.
- Classification: color and category.
- Media: image URL and preview.
- Clothing pieces: selected pieces and add-piece controls.
- Notes and actions.

Primary save action belongs at the end of the form. Destructive actions should use outline/error styling and sit beside or below the save action, not before it.

### Upload Areas

Image upload controls should look like upload zones, not plain text labels:

- Dashed border.
- Muted background.
- Icon plus concise label.
- Stable square preview for clothing images.
- Replace action appears over existing preview.

### Empty States

Empty states should be short and task-oriented:

- State what is missing.
- Offer the next available action.
- Avoid explanatory paragraphs.

Example:

```text
No clothing pieces yet
Add clothes, then pair pieces into outfit plans.
```

## Page-Specific Layout

### Calendar

Purpose: plan or edit the outfit for a selected date.

Layout:

- Left panel: month controls, weekday row, calendar grid.
- Right panel: selected date form.
- Keep month navigation icon-only.
- Keep the form title tied to state: `Plan outfit` or `Edit outfit`.

Important states:

- Loading month data.
- Selected date with no outfit.
- Selected date with existing outfit.
- Suggestion returned.
- Suggestion unavailable.
- Delete confirmation.

### Wardrobe

Purpose: manage clothing items and optionally attach them to outfits.

Layout:

- Main panel: grid/list toggle, item count.
- Optional right panel: add/edit clothes form.
- Grid view should prioritize image thumbnails.
- List view should prioritize fast scanning of name, label, color, notes.

Important states:

- Empty wardrobe.
- Uploading image.
- Editing existing piece.
- Delete confirmation.

### Home

Purpose: summarize wardrobe usage and cleanup opportunities.

Layout:

- Header action: classify uncategorized.
- Top row: four metric cards.
- Lower row: most worn, categories, not worn this year.

Important states:

- Zero-data state.
- Uncategorized count available.
- Empty category or history lists.

### Authentication

Purpose: fast account access.

Layout:

- Centered auth card.
- Product label in header.
- Primary email/password action.
- Secondary Google action.
- Link to the alternate auth route.

Auth pages should not use the full app navigation.

### Account

Purpose: manage identity, password, linked providers, and deletion.

Layout:

- Page header: `Account` eyebrow, `Settings` title.
- Two-column settings grid on large screens.
- Separate panels for profile, password, linked accounts, and delete account.
- Destructive delete panel should be visually distinct but not alarmist.

## Implementation Classes

When implementing this specification, prefer named utility classes in `assets/css/main.css` so repeated patterns do not spread across templates.

Recommended class names:

| Class | Purpose |
| --- | --- |
| `.app-shell` | Full-page background and minimum height |
| `.app-container` | Max-width page container |
| `.app-topbar` | Authenticated user/account strip |
| `.app-main` | Main page content stack |
| `.app-page-header` | Shared page header layout |
| `.app-eyebrow` | Uppercase page/category label |
| `.app-title` | Primary page title |
| `.app-subtitle` | Optional page description |
| `.app-panel` | Major functional panel |
| `.app-panel-pad` | Standard panel padding |
| `.app-section-header` | Panel heading/action row |
| `.app-section-title` | Panel title |
| `.app-card` | Repeated card surface |
| `.app-card-pad` | Standard card padding |
| `.app-list` | Bordered list wrapper |
| `.app-list-row` | Individual list row |
| `.app-clickable` | Interactive row/card hover treatment |
| `.app-media` | Image or image-placeholder frame |
| `.app-calendar-cell` | Calendar tile |
| `.app-calendar-popover` | Calendar hover detail |
| `.app-upload` | Image upload/drop zone |
| `.app-auth` | Auth page centering |
| `.app-auth-card` | Auth card sizing |

## Acceptance Checklist

Before considering the theme implemented:

- All primary pages use the same shell spacing and max width.
- Home and wardrobe use named panel/card/list classes instead of one-off surface styling.
- Auth and account pages align with the same typography and spacing system.
- Buttons use icons for common actions where appropriate.
- Calendar and wardrobe grids maintain stable dimensions across content states.
- Long outfit and clothing names truncate cleanly.
- Mobile layout has no overlapping text or controls.
- The palette uses warm neutrals, teal primary, and amber secondary without becoming a single-hue theme.
- `npm run build` passes after implementation.
