# vibe-ui bench

A purpose-built before/after fixture for testing whether the `vibe-ui` skill actually
improves a UI, and by how much.

## Why not test on a real project

The obvious candidates (freemap, astra-books) are confounded: their existing UI was
written by the same author who wrote the skill, so "before" already carries the skill's
biases. A fixture built fresh, with both states retained in git, isolates the
intervention.

## Design

One small app — **Marginalia**, a reading-list tracker — implemented twice with
**identical behavior** and different presentation.

| Branch | Contents |
|---|---|
| `bench/baseline` | The app as written with no design guidance |
| `bench/styled` | Branched *from* `bench/baseline`, with the skill applied |
| `main` | This harness and the results report |

`bench/styled` branches from `bench/baseline` specifically so that
`git diff bench/baseline..bench/styled` **is** the intervention, with nothing else in it.

No build step, no backend. Plain HTML/CSS/JS so that the diff is legible and the CSS
metrics are directly greppable. This tests `tokens.css` — the skill's core artifact —
via the no-build stack recipe. **The React/Tailwind/shadcn path is not tested here.**

## Validity safeguards

These exist because the easy version of this experiment is worthless.

**1. Metrics are pre-registered.** Everything in the table below was committed to `main`
*before* `bench/styled` existed. Check the git history if you doubt it. Without this I
could quietly pick the metrics that happened to improve.

**2. Functional parity is enforced, not asserted.** `harness/parity.spec.js` drives the
app entirely through `data-testid` hooks and must pass **unmodified on both branches**.
If it fails on either, the comparison is void. This is what makes any measured
difference purely presentational — I can't "improve" the UI by changing what it does.

**3. Tier 2 metrics are labelled circular.** I wrote the anti-pattern list, then fix the
UI against it, then score it with it. Of course it improves — that's Goodhart's law, not
a finding. Tier 2 is a **regression guard**, not evidence of quality. Only Tier 1 uses
standards I don't control.

**4. Every data state is measured, not just the happy path.** State is forced by query
param so the harness can capture all of them deterministically:
`?state=loading|error|empty|noresults|populated`.

## Known limitations

Stated up front so the report can't overclaim:

- **I wrote the baseline, so it may be a straw man.** I wrote it in one pass without
  consulting the skill files, but I cannot fully un-know them. A genuinely
  uncontaminated baseline would come from a model with no access to the skill. What
  anti-patterns the baseline happens to contain is documented in the report rather than
  planted from a list.
- **n=1 app.** This can *falsify* the skill (if the gate is impractical, or the tokens
  fight a third-party stylesheet) but cannot validate it.
- **No human judgment in the automated run.** Tier 1 and Tier 2 say nothing about
  whether the result is *pretty*. That needs a blind pick — see "Blind comparison".
- **Aesthetic quality is not measured at all.** No number here captures hierarchy
  reading correctly or the focal element being the right one.

## Pre-registered metrics

### Tier 1 — external standards (trustworthy)

| # | Metric | Source | Direction |
|---|---|---|---|
| T1.1 | axe-core violations, weighted by impact | axe-core 4.x | ↓ |
| T1.2 | Text nodes failing WCAG AA contrast for their size/weight | computed from rendered DOM | ↓ |
| T1.3 | Focusable elements with no visible focus indicator | computed style delta on `:focus-visible` | ↓ |
| T1.4 | Interactive targets smaller than 24×24 CSS px | WCAG 2.2 SC 2.5.8 | ↓ |
| T1.5 | Cumulative Layout Shift | PerformanceObserver | ↓ |
| T1.6 | Long animation frames (>50ms) during interaction | PerformanceObserver | ↓ |
| T1.7 | Images/controls missing accessible names | axe subset, reported separately | ↓ |
| T1.8 | Horizontal overflow at 390px viewport | WCAG 2.1 SC 1.4.10 Reflow | ↓ |

### Tier 2 — conformance to the skill (circular; regression guard only)

| # | Metric | Direction |
|---|---|---|
| T2.1 | Literal hex/rgb colors in CSS source | ↓ toward 0 |
| T2.2 | Distinct computed font-size values in use | ↓ toward scale size |
| T2.3 | Distinct computed spacing values in use | ↓ |
| T2.4 | Distinct computed border-radius values | ↓ toward 4 |
| T2.5 | Controls missing any of hover/active/focus/disabled states | ↓ toward 0 |
| T2.6 | Transitions on layout-triggering properties | ↓ toward 0 |
| T2.7 | `prefers-reduced-motion` handled | false → true |
| T2.8 | Data states implemented (of 5) | ↑ toward 5 |

### Not measured

Taste, hierarchy, whether it looks good. Deliberately absent — see Blind comparison.

## Running it

```bash
cd bench/harness
mise exec node@22 -- npm install
mise exec node@22 -- npm run bench     # both branches via git worktrees, writes ../results/
```

Outputs `bench/results/report.md`, `report.json`, and screenshots of every
state × theme × viewport for both branches.

## Blind comparison

The automated run deliberately omits aesthetic judgment. For that:

```bash
mise exec node@22 -- npm run blind     # writes shuffled A/B screenshot pairs + a key file
```

Pairs are randomized per comparison and the answer key is written to a separate file, so
you can look at the pairs and pick without knowing which branch is which.
