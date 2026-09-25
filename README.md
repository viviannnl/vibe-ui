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
