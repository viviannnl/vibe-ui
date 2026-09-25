---
name: vibe-ui
description: Build UI that doesn't look AI-generated. Use BEFORE writing the first line of any interface — a new page, component, screen, layout, or app shell — and when asked to "make it prettier", restyle, redesign, or polish existing UI. Supplies a token contract, an anti-pattern list, a required-states matrix, motion specs with real numbers, stack recipes, and a look-at-it verification loop. Triggers on build/create a UI, page, component, screen, dashboard, landing page, form, modal, app; style/restyle/redesign/polish/clean up the UI; "make this look good"; any greenfield frontend work — including when the request never mentions design at all.
user-invocable: true
---

# vibe-ui — interfaces that don't look generated

Generated UI fails in a small, predictable set of ways. This skill's job is to make the
default output good without the user having to review it, because in vibe coding they
are judging the screen, not the diff.

Read this file fully. Load reference files as the task needs them.

## Order of operations

1. **Classify the surface** — what kind of UI is this? (§1)
2. **Install the token contract** before any component code. (§2)
3. **Build, obeying the anti-pattern list and state matrix.** (§3, §4)
4. **Add motion last,** from the spec, not from taste. (§5)
5. **Run it and look at it.** Self-critique, fix, repeat. (§6)
6. **Pass the ship gate** before reporting done. (§7)

Do not skip step 2 because the task "is just one component." A component built on
ad-hoc values is the thing that makes the next ten components inconsistent.

---

## 1. Classify the surface

Density and hierarchy differ enormously by surface type. Pick one and commit:

| Surface | Density | Focal rule | Type baseline |
|---|---|---|---|
| **Dashboard / tool** | High — 8–12px gaps, 13–14px body | Data is the focus; chrome recedes | 14px |
| **Marketing / landing** | Low — 48–96px section gaps | One headline, one CTA | 16–18px |
| **Reader / content** | Medium — generous line height | The prose is the UI | 17–19px, 65–75ch measure |
| **Form / settings** | Medium — grouped, labeled | One column, clear submit | 14–16px |
| **App shell / nav** | High, quiet | Never the focus | 13–14px |

If the request spans several (most apps do), classify per screen, not per app.

**One focal element per screen.** If three things are bold, saturated, and large, none
of them is. Decide what the user is here to do, make that the loudest thing, and
actively de-emphasize everything else.

---

## 2. Token contract — do this first

Copy `references/tokens.css` into the project and import it before any other CSS.
Every value you write afterwards references a token. No literal hexes, no `padding:
13px`, no one-off `border-radius`.

Why this is non-negotiable: dark mode, consistency, and "it feels like one product"
are all downstream of tokens existing. Retrofitting them costs 10× more than starting
with them.

- Full file and rationale: `references/tokens.css`
- Color method, contrast validation, how to swap the accent: `references/palette.md`

**Swap the accent hue before shipping.** The file ships one variable, `--accent-h`.
Change that one number to fit the product. Leaving the default is how everything you
build ends up the same color.

For Tailwind projects, map the tokens into `theme.extend` rather than using Tailwind's
raw palette — `references/stacks.md` has the config.

**Charts, graphs, plots, dashboards with data viz:** stop and use the `dataviz` skill
for anything chart-shaped. It owns categorical/sequential palettes and mark specs.
This skill owns the surrounding interface. They agree on method — semantic tokens,
OKLCH, validated contrast — so they compose; don't invent a second chart palette here.

---

## 3. Anti-patterns — the generated-UI tells

These are the specific things that make a UI read as machine-made. Full list with
fixes in `references/antipatterns.md`. The ones that matter most:

- **Purple/indigo gradient backgrounds.** Also any full-page gradient. Use a flat
  surface token.
- **Emoji as iconography.** Use a real icon set (Lucide, Phosphor, Heroicons). Emoji
  render inconsistently across platforms and instantly date the work.
- **One centered card floating on a colored background.** The default "app" shape that
  isn't a real layout. Build the actual layout.
- **Glassmorphism / `backdrop-blur` on everything.** At most one surface, with a reason.
- **`box-shadow: 0 0 10px rgba(0,0,0,0.5)`.** Single huge blur, pure black, too opaque.
  Use the layered, hue-tinted shadow tokens.
- **Uniform font weight.** Everything at 400, or everything at 600. Hierarchy needs
  weight contrast (400 body / 500 UI labels / 600–700 headings).
- **Three near-identical font sizes** (15/16/17px). Use the scale; make steps obvious.
- **`text-gray-500` as the entire hierarchy system.** Muted text is one tool, not the
  only one. Size, weight, and spacing carry more.
- **Centered spinner for predictable content.** Skeletons that match the real layout.
- **Unstyled focus rings** (or `outline: none` with no replacement). Keyboard users and
  accessibility audits both fail on this.
- **Placeholder text as label.** Disappears on input; fails accessibility.
- **Lorem ipsum in a deliverable.** Write plausible real copy — it exposes layout bugs
  that lorem hides (long names, empty values, huge numbers).

---

## 4. Required states

Most "unfinished-feeling" UI is missing states, not styling. Both matrices are
mandatory. Details and snippets: `references/states.md`.

**Per screen or data region — all five:**
1. **Empty** — first-run, with a next action. Never a blank box.
2. **Loading** — skeleton shaped like the real content. Never a bare spinner for
   layout you can predict.
3. **Error** — what failed, and a retry affordance.
4. **Populated** — the normal case.
5. **Edge** — one item, 10,000 items, missing fields, very long strings. Overflow
   behavior decided on purpose (truncate / wrap / scroll), never left to chance.

**Per interactive element — all five:**
`rest` · `hover` · `active` (pressed) · `focus-visible` · `disabled`

Plus `loading` for anything that fires a request, and `selected`/`checked` where it
applies. A button with only a rest state is not done.

---

## 5. Motion

Motion is where "dynamic" actually comes from — but it's also where generated UI
overreaches. Rules, with numbers, so this is checkable. Full spec:
`references/motion.md`.

- **Animate `transform` and `opacity` only.** Never `width`, `height`, `top`, `left`,
  `margin` — they trigger layout on every frame.
- **Durations:** 150ms micro-feedback (hover, press) · 250ms state change · 400ms
  entrance or layout shift. Above 400ms feels broken; below 100ms isn't perceived.
- **Easing:** ease-out for things entering, ease-in for exiting, spring for anything
  the user drags or toggles. Never `linear` for UI, never `ease-in-out` on entrances.
- **Stagger lists 30–50ms per item,** capped at ~8 items. Longer and it's a wait.
- **Hover-intent delay ~100ms** on anything that opens, so the UI doesn't flicker as
  the pointer crosses it.
- **`prefers-reduced-motion: reduce`** must cut transforms to opacity-only. Non-optional.
- One moving thing at a time. Simultaneous unrelated animation reads as noise.

Highest-leverage single addition in React: Framer Motion's `layout` prop — free
correct animation on reorder and resize. Plain HTML/Jinja: the View Transitions API
gets cross-page morphs in ~10 lines of CSS.

---

## 6. The look-at-it loop

The user is evaluating pixels. Code that compiles is not evidence the UI is good.

1. **Run it.** Use the `run` skill — it already knows how to launch this project type.
2. **Look at it.** Screenshot, or drive a browser. If Playwright MCP is unavailable
   (it fails to connect fairly often), fall back to: `open` the URL and ask the user
   for a screenshot, or use a headless shot via a devDependency if one exists. Say
   which path you took — don't silently skip the step and imply you saw it.
3. **Self-critique against §3 and §7.** Name the worst thing on screen, fix it, repeat.
   Two or three passes is normal.
4. **Check both themes and a narrow viewport** before calling it done.

Never report a UI as finished on the strength of the diff alone. If you could not
actually view it, say so plainly and state what remains unverified.

---

## 7. Ship gate

Answer all of these before reporting done. Any "no" is unfinished work.

- [ ] Tokens imported; zero literal colors, spacings, or radii in component code
- [ ] `--accent-h` changed from the default
- [ ] All five screen states exist for every data region
- [ ] All five interaction states exist for every control
- [ ] `:focus-visible` is visible on every focusable element
- [ ] Body text ≥ 4.5:1 contrast; large text and UI borders ≥ 3:1 — both themes
- [ ] Exactly one focal element per screen
- [ ] No item from the §3 anti-pattern list is present
- [ ] Motion: `transform`/`opacity` only, within duration bounds, reduced-motion handled
- [ ] Real copy, not lorem; tested with a long string and an empty value
- [ ] Keyboard-only pass: tab order sensible, nothing reachable-but-invisible,
      Escape closes overlays
- [ ] Looked at it running, in both themes, at ≤400px wide

---

## Scope boundaries

- **Charts, plots, graphs, data viz** → `dataviz` skill. Don't duplicate its palettes.
- **Launching / screenshotting the app** → `run` skill.
- **Settings, hooks, permissions** → `update-config` skill.
- This skill covers visual and interaction design of interfaces. It does not cover
  state management, data fetching architecture, or API design.

## Reference files

| File | Load when |
|---|---|
| `references/tokens.css` | Always — step 2 |
| `references/palette.md` | Choosing or validating color; dark mode |
| `references/antipatterns.md` | Before self-critique; when something looks off |
| `references/states.md` | Building any data region or control |
| `references/motion.md` | Adding animation or transitions |
| `references/stacks.md` | Choosing the stack; Tailwind config; no-build setup |
