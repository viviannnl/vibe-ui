# Marginalia — app spec

Both branches implement this exactly. Behavior is fixed; only presentation may differ.
`harness/parity.spec.js` enforces it.

## Files (per branch, under `bench/app/`)

```
index.html
app.js
data.js       — identical on both branches
styles.css
```

`data.js` is byte-identical across branches. `index.html`, `app.js`, and `styles.css` may
all differ: applying the skill legitimately changes markup, not just CSS — skeleton
loaders, richer empty states, and SVG icons all need DOM that the baseline doesn't have.

**The guarantee is behavioral, not structural.** Every `data-testid` below must be present
with identical semantics, and `harness/parity.spec.js` must pass unmodified on both
branches. That's what makes measured differences presentational rather than functional.

## Views

**Library** (default) — list of items showing title, author, status, tags, date added.
**Reader** — activated by clicking an item; shows that item's full text and a back
control. Only one view visible at a time.

## Controls and test hooks

| `data-testid` | Element | Behavior |
|---|---|---|
| `search` | text input | Filters by title or author, case-insensitive, live |
| `filter-status` | select | `all` \| `unread` \| `reading` \| `done` |
| `sort` | select | `added` (newest first) \| `title` (A→Z) |
| `item-count` | text | `"N items"` reflecting current filter; `"1 item"` when N=1 |
| `item-row` | repeated | One per visible item; clicking opens Reader |
| `item-title` | within row | The item's title text |
| `star` | within row | Toggles starred; `aria-pressed` reflects state |
| `note-open` | within row | Opens the note modal for that item |
| `reader` | container | Present only in Reader view |
| `reader-title` | text | Title of the open item |
| `reader-back` | button | Returns to Library |
| `theme-toggle` | button | Cycles light → dark; persists to localStorage |
| `modal` | container | Present only while note modal is open |
| `note-input` | textarea | Note body |
| `note-save` | button | Saves; rejects empty/whitespace-only |
| `note-error` | text | Present only when save was rejected |
| `note-cancel` | button | Closes without saving |
| `state-loading` | container | Present only during load |
| `state-error` | container | Present only on load failure |
| `state-empty` | container | Present only when the library has zero items |
| `state-noresults` | container | Present only when a filter excludes everything |
| `retry` | button | Within error state; re-attempts load |

## Forced states

Query param `?state=`:

| Value | Effect |
|---|---|
| *(absent)* / `populated` | Normal load, 400ms simulated latency |
| `loading` | Load never resolves |
| `error` | Load rejects |
| `empty` | Loads successfully with zero items |
| `noresults` | Loads full data, search pre-filled with `zzzz` |

`?seed=1` is implied — data is fixed, never random, so screenshots are comparable.

## Seed data

12 items, deliberately including these edge cases:

1. A 72-character title
2. An author name of 48 characters
3. An item with zero tags
4. An item with 6 tags
5. An item with `rating: null`
6. Exactly one item with status `reading`
7. A title containing non-ASCII (`Søren`, `日本語`)
8. A title that is a single unbroken 40-character string (no spaces)

These exist to surface overflow and empty-field handling. Any version that clips,
overlaps, or blows out its container on these is failing.

## Behavioral rules

- Filters compose: search AND status both apply; sort applies after filtering.
- `noresults` is distinct from `empty` — different container, different copy.
- Note modal: Escape closes, `note-save` with whitespace-only input shows `note-error`
  and does not close.
- Star state survives view changes within a session.
- Theme persists across reload.
