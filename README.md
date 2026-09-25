# vibe-ui

A Claude Code skill for building UI that doesn't look AI-generated.

Generated interfaces fail in a small, predictable set of ways — purple gradients, emoji
icons, a lone centered card, no empty state, a 700ms fade that reads as lag. This skill
front-loads the fixes so the *default* output is good, which matters specifically in
vibe coding: you're judging the screen, not reading the diff.

## What's in it

| Piece | What it does |
|---|---|
| **Token contract** (`tokens.css`) | Drop-in OKLCH palette, spacing/type/radius scales, layered shadows, motion tokens, light + dark. One variable (`--accent-h`) re-themes everything. |
| **Anti-pattern list** | ~45 specific generated-UI tells with fixes. Naming failures steers better than teaching design theory. |
| **State matrices** | Five required screen states (empty / loading / error / populated / edge) × five required control states (rest / hover / active / focus / disabled). |
| **Motion spec** | Real numbers — durations, easing curves, stagger intervals, hover-intent delays — plus which properties are safe to animate. |
| **Stack recipes** | React (Tailwind + shadcn + Framer Motion), Flask/Jinja (Tailwind + Alpine + HTMX), no-build single file. Tailwind v4 token mapping included. |
| **Look-at-it loop** | Run it, screenshot it, self-critique, fix, repeat. Blocks "done" claims based on the diff alone. |
| **Ship gate** | 12 yes/no items checked before reporting finished. |

## Install

Symlink the skill directory into your skills folder:

```bash
git clone https://github.com/viviannnl/vibe-ui.git
ln -s "$PWD/vibe-ui/vibe-ui" ~/.claude/skills/vibe-ui
```

Or for a single project:

```bash
ln -s /path/to/vibe-ui/vibe-ui .claude/skills/vibe-ui
```

Verify with `/help` — `vibe-ui` should appear in the skill list. It also fires
automatically on UI work, including when the request never mentions design.

## Using the tokens without the skill

`vibe-ui/references/tokens.css` is standalone. Copy it into any project, import it
first, change `--accent-h`, and reference the semantic tokens (`--surface`, `--text`,
`--border`, `--accent`) instead of literals. Dark mode then costs nothing.

## Does it actually work?

There's a before/after fixture in [`bench/`](bench/): one small app built twice with
**identical behavior** — `bench/baseline` with no design guidance, `bench/styled` with
the skill applied. A 16-test parity suite drives both through `data-testid` and must
pass unmodified on each, so every measured difference is presentational.

Tier 1 results ([full report](bench/results/report.md)), using standards the skill
doesn't control:

| Metric | Baseline | Styled |
|---|---:|---:|
| axe-core violations (rules / nodes) | 4 / 47 | **0 / 0** |
| Text nodes failing WCAG AA contrast | 300 | **0** |
| Targets under 24×24px | 24 | **0** |
| Horizontal overflow at 390px | 839px | **0** |
| Tabbable elements with no focus indicator | 3 | **0** |

**Read the caveats before quoting that.** n=1 app; I wrote both the skill and the
baseline, so this can falsify the skill but not validate it. The report's Tier 2 section
is explicitly labelled circular — scoring a UI against rules I wrote and then fixed it
against proves nothing. And nothing there measures whether the result is *pretty*;
`npm run blind` exists for that and needs a human.

The exercise was worth more as a bug-finder than as a scoreboard. It turned up five real
defects in the skill itself — status colors that failed AA as text on their own tints,
three of seven recommended accent hues failing contrast, a false claim that hue swaps
preserve contrast, an accent hue that made focus rings look like errors, and a broken
OKLCH parse in the shipped validator. Those are fixed; see the commit log.

## Scope

Covers visual and interaction design of interfaces. Defers charts and data viz to the
`dataviz` skill, app launching to the `run` skill. Doesn't cover state management, data
fetching, or API design.

## Layout

```
vibe-ui/
├── README.md
└── vibe-ui/                    ← symlink this into ~/.claude/skills/
    ├── SKILL.md                ← the skill: order of operations, ship gate
    └── references/
        ├── tokens.css          ← the token contract
        ├── palette.md          ← OKLCH method, contrast validator, dark mode
        ├── antipatterns.md     ← the generated-UI tells
        ├── states.md           ← both state matrices, forms, overlays
        ├── motion.md           ← duration/easing specs, patterns
        └── stacks.md           ← stack recipes, icons, fonts
```
