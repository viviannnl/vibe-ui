# vibe-ui bench — results

Generated 2026-09-25T04:11:46.990Z · Node v22.23.1
Baseline `98e4a40` → Styled `fbc4e62`

Both branches pass `harness/parity.spec.js` unmodified, so every difference below is
presentational. Read the caveats in [../README.md](../README.md) before quoting any of
these numbers — in particular, **Tier 2 is circular** and is a regression guard, not
evidence of quality.

---

## Tier 1 — external standards

These use rulesets and physics I don't control (WCAG, axe-core, the compositor), so
they carry real evidential weight.

| Metric | Baseline | Styled | Change |
|---|---:|---:|---|
| axe-core violated rules | 4 | 0 | **improved** -4 (-100%) |
| axe-core failing nodes | 47 | 0 | **improved** -47 (-100%) |
| axe-core impact-weighted score | 310 | 0 | **improved** -310 (-100%) |
| Text nodes failing WCAG AA contrast | 300 | 0 | **improved** -300 (-100%) |
| Worst contrast ratio found | 1 | 4.52 | **improved** +3.52 (+352%) |
| Controls with no accessible name | 1 | 0 | **improved** -1 (-100%) |
| Targets under 24×24px | 24 | 0 | **improved** -24 (-100%) |
| Horizontal overflow at 390px (px) | 839 | 0 | **improved** -839 (-100%) |
| Tabbable elements with no focus indicator | 3 | 0 | **improved** -3 (-100%) |
| Cumulative Layout Shift | 0 | 0 | · |
| Long animation frames (>50ms) | 0 | 0 | · |
| Longest frame (ms) | 0 | 0 | · |

### axe-core violations

**Baseline:**

- `aria-allowed-attr` (critical, 12 nodes) — Elements must only use supported ARIA attributes
- `select-name` (critical, 2 nodes) — Select element must have an accessible name
- `label` (critical, 1 node) — Form elements must have labels
- `color-contrast` (serious, 32 nodes) — Elements must meet minimum color contrast ratio thresholds

**Styled:**

_none_

### Worst contrast failures — baseline

| State | Element | Sample | Size | Ratio | Needs |
|---|---|---|---:|---:|---:|
| modal-light-desktop | `button.btn` | "Save" | 14px/400 | **1** | 4.5 |
| modal-dark-desktop | `button.btn` | "Save" | 14px/400 | **1** | 4.5 |
| modal-light-mobile | `button.btn` | "Save" | 14px/400 | **1** | 4.5 |
| modal-dark-mobile | `button.btn` | "Save" | 14px/400 | **1** | 4.5 |
| populated-light-desktop | `span.count` | "12 items" | 13px/400 | **2.32** | 4.5 |
| loading-light-desktop | `span.count` | "0 items" | 13px/400 | **2.32** | 4.5 |
| loading-light-desktop | `div.msg` | "Loading..." | 15px/400 | **2.32** | 4.5 |
| error-light-desktop | `span.count` | "0 items" | 13px/400 | **2.32** | 4.5 |

### Worst contrast failures — styled

_no failures_

---

## Tier 2 — conformance to the skill (circular)

I wrote the rules, fixed the UI against them, then scored it with them. A perfect score
here means "conforms to vibe-ui", **not** "is a better UI". Useful as a regression guard
and as a check that the skill's own advice was actually applied.

| Metric | Baseline | Styled | Change |
|---|---:|---:|---|
| Literal colors outside token defs | 35 | 0 | **improved** -35 (-100%) |
| Distinct font sizes rendered | 5 | 3 | **improved** -2 (-40%) |
| Distinct spacing values rendered | 8 | 10 | **regressed** +2 (+25%) |
| Distinct border-radius values | 4 | 3 | **improved** -1 (-25%) |
| Distinct colors rendered | 9 | 9 | · |
| Distinct shadows rendered | 1 | 1 | · |
| Transitions on layout properties | 13 | 1 | **improved** -12 (-92%) |
| Infinite animations | 0 | 0 | · |
| Data states implemented (of 5) | 5 | 5 | · |
| prefers-reduced-motion handled | no | yes | **improved** |
| `outline: none` present | yes | yes | · |
| `!important` count | 0 | 0 | · |
| :focus-visible rules | 0 | 6 | **improved** +6 |
| :hover rules | 3 | 9 | **improved** +6 (+200%) |
| :active rules | 0 | 2 | **improved** +2 |
| :disabled rules | 0 | 6 | **improved** +6 |

---

## What these numbers do not say

- Nothing here measures whether the result is *pretty*, whether the visual hierarchy
  reads correctly, or whether the focal element is the right one. Use
  `npm run blind` for that.
- n = 1 app, and the baseline was written by the same author as the skill. This can
  falsify the skill but cannot validate it.
- The React/Tailwind/shadcn path in `stacks.md` is untested — this fixture exercises
  the no-build path only.

## Screenshots

`results/screens/{baseline,styled}/<state>-<theme>-<viewport>.png`
plus `modal-*` and `reader-*` for each theme and viewport.
