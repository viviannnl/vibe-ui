# Color — method, validation, dark mode

The token file already contains a working palette. This file is the *why* and the
*how to change it safely*.

## Why OKLCH

In hex/HSL, equal numeric steps are not equal perceptual steps: `hsl(60 100% 50%)`
(yellow) is far lighter than `hsl(240 100% 50%)` (blue) despite identical `L`. Ramps
built that way have dead zones and jumps.

OKLCH's `L` is perceptual lightness. Two consequences you get for free:

1. A ramp with even `L` steps looks evenly spaced.
2. Changing only `H` rotates hue without changing *perceived* lightness — so
   re-theming by editing one number keeps the ramp looking like a ramp.

That's why `--accent-h` works as a single-knob theme switch.

### What it does NOT buy you

**Perceptual lightness is not WCAG luminance, and contrast ratios do not survive a hue
change.** WCAG relative luminance is a fixed weighted sum of sRGB channels
(0.2126R + 0.7152G + 0.0722B); it weights green roughly 10× more than blue. OKLCH `L`
models human lightness perception, which is a different function. So two colors with
identical `L` and different `H` can differ by 20% in measured contrast.

Measured on this file's own accent ramp, white on `--accent-600`:

| Hue | Ratio | vs 4.5 floor |
|---|---:|---|
| 25 (terracotta) | 5.35 | pass |
| 255 (blue) | 4.95 | pass |
| 145 (green) | **4.49** | **fail** |
| 195 (teal) | **4.44** | **fail** |

Two of the hues recommended below fail out of the box. Green and teal sit in the
high-luminance part of the spectrum, so at a given `L` they're "brighter" to the WCAG
formula than a red or blue of the same perceived lightness.

**So: after changing `--accent-h`, run the validator.** If white-on-accent fails, drop
`--accent-600`'s lightness by ~0.03 and re-check. This is not optional bookkeeping —
it's the difference between a themed button that passes AA and one that doesn't.

### Don't pick an accent that collides with a status hue

Separate from contrast: keep the accent at least ~60° away from your `--danger` hue
(25 by default), and ideally from `--success` (150) too.

An accent near the danger hue makes the **focus ring indistinguishable from an error
state**. A focused input gets `border-color: var(--border-focus)`; if that's a red, the
field reads as a failed validation before the user has typed anything. The same
applies to a green accent against success — a "saved" affordance and a primary button
stop being separable.

This is not something contrast math catches; both states can pass AA and still be
semantically ambiguous. It shows up the moment you screenshot a focused field, which
is the argument for the look-at-it loop in SKILL.md §6.

## Changing the accent

Edit `--accent-h` in `tokens.css`. Nothing else.

| Hue | Reads as | Good for | Needs accent-600 darkened? |
|---|---|---|---|
| 25 | terracotta / rust | warm, editorial, human | no (5.33) — but see collision note |
| 70 | amber | energetic, warning-adjacent (careful) | **yes** |
| 145 | green | finance, health, "go" | **yes** (4.49) |
| 195 | teal | technical, calm, trustworthy | **yes** (4.44) |
| 230 | azure | corporate, calm | **yes** (4.30) |
| 255 | blue | default in the token file | no (4.93) |
| 320 | magenta | creative, bold | no (5.36) |

Measured, not estimated. **Three of the seven fail unmodified** — green, teal, and
azure. Only 25, 255, and 320 ship AA-clean.

**Avoid 270–290.** That indigo-violet band is the single strongest "this was
generated" signal, because it's the default in most component libraries and
therefore in most training data.

After changing the hue, re-run the contrast check below — chroma behaves differently
per hue, and yellow-greens in particular go out of gamut or lose contrast fast.

## Contrast requirements

WCAG 2.1 AA, which is the floor, not the goal:

| Element | Minimum |
|---|---|
| Body text, any text < 18px (or < 14px bold) | **4.5:1** |
| Large text ≥ 18px, or ≥ 14px bold | **3:1** |
| UI component boundaries, focus indicators, icons conveying meaning | **3:1** |
| Decorative / disabled | no requirement |

The shipped tokens are measured against these (values computed from the OKLCH
definitions, not estimated):

| Token | Light | Dark | Verdict |
|---|---|---|---|
| `--text` | 17.8:1 | 18.0:1 | body ✓ |
| `--text-muted` | 4.7:1 | 7.6:1 | body ✓ |
| `--text-subtle` | 3.0:1 | 4.2:1 | **large text / icons only** |
| `--border-interactive` | 3.0:1 | 4.2:1 | control edges ✓ |
| `--border-focus` | 3.7:1 | — | focus ring ✓ |
| `--accent` + `--text-on-accent` | 5.0:1 | 7.4:1 | button label ✓ |
| `--accent-text` on `--surface` | 7.0:1 | 10.3:1 | link text ✓ |
| `--border-strong` | 1.5:1 | 1.9:1 | **decorative only** |
| `--border` | 1.3:1 | 1.3:1 | **decorative only** |
| `--success-text` on `--success-bg` | 4.6:1 | 6.6:1 | badge label ✓ |
| `--warning-text` on `--warning-bg` | 4.6:1 | 7.8:1 | badge label ✓ |
| `--danger-text` on `--danger-bg` | 4.6:1 | 5.4:1 | badge label ✓ |
| `--info-text` on `--info-bg` | 4.6:1 | 6.4:1 | badge label ✓ |
| `--success` on `--success-bg` | 3.5:1 | 6.6:1 | **light: borders/icons only** |
| `--info` on `--info-bg` | 3.4:1 | 6.4:1 | **light: borders/icons only** |
| `--warning` on `--warning-bg` | 2.7:1 | 7.8:1 | **light: fills only** |

Two traps worth naming, because both are easy to walk into:

- **`--n-400` does not clear 3:1** (2.6:1 on white), which is why `--text-subtle`
  points at `--n-450` instead. A "400-level" gray is the intuitive pick for muted text
  and it fails — in Tailwind's default palette too (`gray-400` is ~2.6:1). Don't
  substitute it back.
- **`--border-strong` is not accessible-strong.** It's 1.5:1 — visually heavier, still
  decorative. When a border is the *only* thing marking an interactive control (input
  outline, checkbox edge, ghost button), use `--border-interactive`. Decorative
  separators have no contrast requirement at all, so both tokens are legitimate; the
  bug is using the wrong one.
- **`--success` on `--success-bg` fails AA in light mode** (3.5:1), and so do the other
  three status pairs. The obvious badge recipe — vivid status color on its own tint — is
  an accessibility bug. Use `--success-text` / `--warning-text` / `--danger-text` /
  `--info-text` for any status *text*, and keep the vivid token for borders, icon
  strokes, and solid fills. Dark mode doesn't have this problem, which makes it easy to
  miss if you only check one theme.

Both traps above were found by measuring, not by reading. That's the argument for
running the validator rather than trusting a palette that looks fine.

### Validator

Paste into the browser console on your actual page. It reads computed tokens, so it
tests what shipped, not what you intended.

```js
// Contrast check against the real computed tokens.
//
// Colors are resolved by PAINTING them to a canvas, not by regex. This matters:
// getComputedStyle returns modern color syntax verbatim, so a token defined as
// oklch(0.556 0.01 250) comes back as that string, and a /[\d.]+/ match reads it
// as rgb(0.556, 0.01, 250) -- silently scoring every OKLCH color as garbage while
// hex-based CSS parses fine. Canvas readback normalizes anything the browser can
// paint: oklch, lab, color-mix, hex, named.
const _cv = document.createElement('canvas'); _cv.width = _cv.height = 1;
const _ctx = _cv.getContext('2d', { willReadFrequently: true });
const parse = (s) => {
  _ctx.clearRect(0, 0, 1, 1);
  _ctx.fillStyle = '#000';
  _ctx.fillStyle = s;             // invalid input leaves fillStyle at #000
  _ctx.fillRect(0, 0, 1, 1);
  const d = _ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
};
const srgb = (c) => { c /= 255; return c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4; };
const lum  = ([r,g,b]) => 0.2126*srgb(r) + 0.7152*srgb(g) + 0.0722*srgb(b);
const ratio = (a, b) => {
  const [l1, l2] = [lum(parse(a)), lum(parse(b))].sort((x,y) => y-x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const PAIRS = [
  ['--text',           '--surface',        4.5],
  ['--text-muted',     '--surface',        4.5],
  ['--text-subtle',    '--surface',        3.0],
  ['--text',           '--surface-raised', 4.5],
  ['--text-muted',     '--surface-sunken', 4.5],
  ['--accent-text',    '--surface',        4.5],
  ['--text-on-accent', '--accent',         4.5],
  ['--border-interactive', '--surface',    3.0],
  ['--border-focus',   '--surface',        3.0],
  // Status TEXT on status tint. The vivid --success/--warning/--danger/--info
  // tokens fail here in light mode; that's what the -text variants are for.
  ['--success-text',   '--success-bg',     4.5],
  ['--warning-text',   '--warning-bg',     4.5],
  ['--danger-text',    '--danger-bg',      4.5],
  ['--info-text',      '--info-bg',        4.5],
  // --border and --border-strong are decorative; WCAG sets no floor for them.
];

console.table(PAIRS.map(([fg, bg, min]) => {
  const r = ratio(tok(fg), tok(bg));
  return { fg, bg, ratio: r.toFixed(2), min, pass: r >= min ? 'PASS' : 'FAIL' };
}));
```

Run it once in light mode and once in dark. Any `FAIL` is a bug, not a preference.

## Dark mode

Three rules the token file encodes:

1. **Never pure black.** `#000` kills shadows (nothing to darken against) and makes
   light text vibrate. Start at `--n-950` (L 0.145).
2. **Elevation inverts.** In light mode, raised surfaces get a shadow. In dark mode,
   they get *lighter* — `--surface-raised` is `--n-900` against a `--n-950` page.
   Stacking shadows in dark mode does nothing visible.
3. **Desaturate and lighten accents.** A chroma-0.19 accent that looks rich on white
   glows and fuzzes on near-black. Dark mode maps `--accent` to `accent-400` instead
   of `accent-600`.

Also: images and illustrations designed for light backgrounds usually need
`filter: brightness(0.85)` or a dedicated dark asset. Check them — a white-background
PNG in dark mode is glaring.

## Gradients

Allowed, narrowly:

- **Never** as a full-page background.
- Subtle same-hue shifts only — e.g. `--accent-600 → --accent-700`, not blue → pink.
- Interpolate in OKLCH (`linear-gradient(in oklch, ...)`), which avoids the muddy
  gray midpoint sRGB interpolation produces between complementary hues.
- One gradient per screen, maximum, on one element.

## Fallbacks

If the target needs pre-2023 browsers, ship hex alongside:

```css
:root {
  --surface: #ffffff;
  --text: #18181b;
}
@supports (color: oklch(0 0 0)) {
  :root {
    --surface: oklch(1 0 0);
    --text: oklch(0.208 0.007 250);
  }
}
```

In practice, check the project's real browser support target before spending effort
here — for internal tools and personal projects it's almost never needed.

## Relationship to the `dataviz` skill

`dataviz` owns color *inside* charts — categorical series, sequential and diverging
scales, and the accessibility constraints specific to encoding data by hue. It uses
the same method (OKLCH, semantic tokens, validated contrast), so the two compose:
chart marks come from `dataviz`, chart chrome (axes, labels, cards, tooltips) comes
from these tokens. Do not define a second chart palette here.
