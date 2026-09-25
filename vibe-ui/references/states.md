# States — the two mandatory matrices

Missing states, not bad styling, is what makes UI feel unfinished. Both matrices
below are required by the ship gate.

---

## Matrix A — per screen or data region

Every region that displays fetched or user-generated data needs all five.

### 1. Empty

Three jobs: say what belongs here, why it's empty, and give the action that fills it.

```jsx
<div className="empty">
  <Inbox aria-hidden />                          {/* icon from ONE set, muted */}
  <h3>No saved listings yet</h3>
  <p>Listings you star will show up here so you can compare them side by side.</p>
  <button className="btn-primary">Browse listings</button>
</div>
```

Distinguish the three empties — they need different copy:

| Kind | Cause | Copy angle |
|---|---|---|
| **First-run** | User is new | Teach + primary action |
| **Cleared** | User finished / deleted everything | Congratulate briefly, offer next |
| **No results** | Filter or search excluded everything | Show the query, offer "clear filters" |

Treating "no search results" as first-run empty is a common and confusing mistake —
never tell someone to "get started" when they have 400 items and a bad filter.

### 2. Loading

**Skeletons for predictable layout. Spinners only when the shape is unknown.**

A skeleton must match the real content's geometry — same number of rows, same heights,
same widths. A skeleton that doesn't match causes a visible jump on load, which is
worse than a spinner.

```css
.skeleton {
  background: linear-gradient(90deg,
    var(--surface-sunken) 25%,
    var(--surface-hover)  37%,
    var(--surface-sunken) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { from { background-position: 100% 0 } to { background-position: 0 0 } }

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: var(--surface-sunken); }
}
```

Timing rules that matter more than the styling:

- **< 300ms:** show nothing. A flashed skeleton is worse than a brief blank.
- **300ms–10s:** skeleton or inline progress.
- **> 10s:** explicit progress with an estimate, and let the user leave.
- **Mutations** (save, submit): the *button* takes the loading state, not the page.
  Never replace the whole form.

Optimistic updates where the outcome is near-certain: apply the change immediately,
roll back with an error toast if it fails. This is most of what makes an app feel fast.

### 3. Error

```jsx
<div role="alert" className="error-state">
  <h3>Couldn't load listings</h3>
  <p>The server didn't respond. Your saved items are safe.</p>
  <button onClick={retry}>Try again</button>
  <details><summary>Details</summary><pre>{err.message}</pre></details>
</div>
```

- Plain language, not the raw exception. Raw text goes behind `<details>`.
- Always a recovery path: retry, go back, or contact.
- Reassure about data when relevant ("nothing was lost").
- `role="alert"` so screen readers announce it.
- Distinguish scopes: a field error belongs at the field, a region error replaces the
  region, a fatal error replaces the screen. Don't blow away a whole page because one
  widget's fetch failed.

### 4. Populated

The normal case. Nothing special — but make sure it's actually the *normal* case you
designed for, not the three-perfect-rows case.

### 5. Edge cases

Explicitly test each; each one is a real bug source:

- **One item.** Does a grid with one card look broken? Does "1 results" read wrong?
- **Thousands of items.** Virtualize or paginate. Does the page still scroll smoothly?
- **Very long strings.** A 60-char name, a URL with no spaces. Decide per element:
  `text-overflow: ellipsis` (with a `title`), wrap, or `overflow-wrap: anywhere`.
  Never leave it to chance — unbroken strings blow out layouts.
- **Missing optional fields.** No avatar, no description, null price. Every optional
  field needs a fallback or a hidden-when-absent rule.
- **Zero / negative / huge numbers.** `0`, `-1`, `1,204,993`. Alignment and width.
- **Slow and flaky network.** Throttle to Slow 3G once. Most loading bugs surface only
  there.

---

## Matrix B — per interactive element

Five states minimum on every control. A button with only a rest state is not done.

| State | Selector | Treatment |
|---|---|---|
| **Rest** | — | Baseline |
| **Hover** | `:hover` | Background one step (`--surface-hover`); 150ms |
| **Active** | `:active` | Darker + `scale(0.98)`; no transition (instant) |
| **Focus** | `:focus-visible` | Visible ring, never removed |
| **Disabled** | `:disabled` | `opacity: 0.55`, `cursor: not-allowed`, no hover |

Add where applicable: **loading** (spinner in place, width preserved, disabled),
**selected/checked**, **error/invalid**, **dragging**, **read-only** (distinct from
disabled — still focusable and copyable).

```css
.btn-primary {
  padding: var(--sp-2) var(--sp-4);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--text-on-accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-sm);
  transition: background var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
.btn-primary:hover:not(:disabled)  { background: var(--accent-hover); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); transition: none; }
.btn-primary:focus-visible         { outline: 2px solid var(--border-focus);
                                     outline-offset: 2px; }
.btn-primary:disabled              { opacity: 0.55; cursor: not-allowed;
                                     box-shadow: none; }
```

Two details that are easy to get wrong:

- **Press must feel instant.** `transition: none` on `:active`. A 150ms press
  animation feels like input lag.
- **Hover only on hover-capable devices.** On touch, `:hover` sticks after tap. Guard
  with `@media (hover: hover)` if you see stuck states.

### Loading buttons must not resize

A button that shrinks when its label becomes a spinner shifts everything near it.

```jsx
<button disabled={saving} aria-busy={saving}>
  <span style={{ visibility: saving ? 'hidden' : 'visible' }}>Save changes</span>
  {saving && <Spinner className="absolute-center" aria-label="Saving" />}
</button>
```

---

## Form validation

Inputs need `--border-interactive`, not `--border`. An input's outline is the only
thing telling the user it's a field, so it's a UI boundary at the 3:1 floor —
`--border` (1.3:1) is for separators and will fail an audit here.

```css
.input {
  border: 1px solid var(--border-interactive);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
  background: var(--surface);
}
.input[aria-invalid="true"] { border-color: var(--danger); }
```

- **Validate on blur, not on keystroke.** Erroring while someone is still typing their
  email is hostile.
- **Re-validate on change once a field has errored,** so the error clears as soon as
  it's fixed.
- Error message sits **adjacent to the field**, wired with `aria-describedby`, and
  `aria-invalid="true"` on the input.
- On submit failure: **focus the first invalid field** and summarize at the top if
  there are several.
- Never rely on color alone — pair the red with an icon and text.

---

## Overlays — modals, dialogs, popovers

Easy to get subtly wrong; all of these are required:

- **Focus trap** while open; **return focus** to the trigger on close.
- **Escape closes.** Click-outside closes, unless there's unsaved work.
- `aria-modal="true"` + `role="dialog"` + a labelled title (`aria-labelledby`).
- **Lock body scroll** while open — and compensate for the scrollbar width, or the
  page shifts.
- Scrim uses `--scrim`, animates opacity only.
- Mobile: full-screen or bottom sheet under ~640px, not a shrunken desktop modal.

Prefer the platform: `<dialog>` with `showModal()` gives focus trap, Escape, and
scrim for free. Radix/Headless UI primitives if you need more control. Hand-rolling a
modal is how a11y bugs get shipped.

---

## Toasts & inline feedback

- Success that's already visible in the UI doesn't need a toast. A saved row that
  updates is its own confirmation.
- Toasts: bottom or top-right, `role="status"` (`role="alert"` for errors), auto-dismiss
  4–6s, never auto-dismiss an error the user must act on.
- Stack at most 3; collapse beyond that.
- Anything destructive needs undo, and undo beats a confirmation dialog for reversible
  actions.
