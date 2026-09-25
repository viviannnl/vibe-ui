# Color — method, validation, dark mode

The token file already contains a working palette. This file is the *why* and the
*how to change it safely*.

## Why OKLCH

In hex/HSL, equal numeric steps are not equal perceptual steps: `hsl(60 100% 50%)`
(yellow) is far lighter than `hsl(240 100% 50%)` (blue) despite identical `L`. Ramps
built that way have dead zones and jumps.

OKLCH's `L` is perceptual lightness. Two consequences you get for free:

1. A ramp with even `L` steps looks evenly spaced.
2. Changing only `H` rotates hue without changing perceived lightness — so you can
   re-theme by editing one number and your contrast ratios survive.

That's the entire reason `--accent-h` works as a single-knob theme switch.

## Changing the accent

Edit `--accent-h` in `tokens.css`. Nothing else.

| Hue | Reads as | Good for |
|---|---|---|
| 25 | terracotta / rust | warm, editorial, human |
| 70 | amber | energetic, warning-adjacent (careful) |
| 145 | green | finance, health, "go" |
| 195 | teal | technical, calm, trustworthy |
| 230 | azure | default-safe, corporate |
| 255 | blue | default in the token file |
| 320 | magenta | creative, bold |

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

### Validator

Paste into the browser console on your actual page. It reads computed tokens, so it
tests what shipped, not what you intended.

```js
// Contrast check against the real computed tokens.
const srgb = (c) => { c /= 255; return c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4; };
const lum  = ([r,g,b]) => 0.2126*srgb(r) + 0.7152*srgb(g) + 0.0722*srgb(b);
const parse = (s) => { // resolve any CSS color to rgb via the canvas
  const d = document.createElement('div');
  d.style.color = s; document.body.appendChild(d);
  const rgb = getComputedStyle(d).color.match(/[\d.]+/g).slice(0,3).map(Number);
  d.remove(); return rgb;
};
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
