# Anti-patterns — the generated-UI tells

Each entry: the tell, why it happens, what to do instead. Scan this list during
self-critique (SKILL.md §6) before reporting a UI done.

---

## Color & surface

**Purple/indigo gradient background.**
The single most recognizable signature. Overrepresented in component-library defaults
and therefore in training data.
→ Flat `--surface`. If the page feels empty, that's a layout problem; solve it with
structure and content, not with a gradient.

**Full-page gradient of any hue.**
Same failure, different color. It shouts "decorated" and fights every element on top.
→ Flat surface. Reserve gradients for one small element, same-hue only.

**Glassmorphism everywhere.**
`backdrop-filter: blur()` on cards, nav, modals, and sidebar simultaneously. Reads as
a 2021 dribbble shot, costs real GPU time, and destroys text contrast.
→ At most one surface, with a reason (a floating toolbar over content it must not
hide). Verify contrast *over the actual worst-case background*.

**Pure black or pure white as the dark/light surface.**
`#000` makes shadows invisible and light text vibrate; `#fff` with `#000` text is
harsh at full contrast.
→ `--n-950` and `--n-50`/white with `--n-900` text. See palette.md § Dark mode.

**Six accent colors.**
Every button, badge, and icon a different hue. Nothing reads as primary.
→ One accent (`--accent-h`) plus the fixed status colors. Hierarchy comes from
weight and size, not from hue variety.

**Saturated accent used as a large background fill.**
A full-bleed `accent-600` hero band vibrates and dates instantly.
→ `--accent-subtle` for large areas, full `--accent` for small high-intent elements
(the primary button).

---

## Typography

**Uniform font weight.**
Everything 400, or everything 600. Without weight contrast there's no hierarchy, and
the page reads flat no matter what the sizes are.
→ 400 body / 500 UI labels and buttons / 600 headings / 700 sparingly.

**Three near-identical sizes.**
15px, 16px, 17px. The reader can't tell them apart, so they encode nothing.
→ The scale in `tokens.css`. Adjacent steps must be obviously different.

**`text-gray-500` as the whole hierarchy system.**
Every non-primary thing muted, and nothing else varied.
→ Muted color is one of four tools. Size, weight, and spacing do more work and are
more robust. Use color last.

**Default letter-spacing on large text.**
Type set at 32px+ with normal tracking looks loose and amateur.
→ `letter-spacing: -0.015em` on headings (already in the base layer). Positive
tracking (`0.04em`) only for all-caps labels.

**Prose with no measure.**
Body text running the full width of a 27" monitor. Unreadable past ~90 characters.
→ `max-width: var(--measure)` (68ch). Already on `p` in the base layer.

**Lorem ipsum in a deliverable.**
Hides the layout bugs real content exposes, and signals unfinished work.
→ Write plausible real copy. Then test the long case (a 60-character name) and the
empty case.

---

## Shadow, border, radius

**`box-shadow: 0 0 10px rgba(0,0,0,0.5)`.**
Single blur, no offset, pure black, 5× too opaque. Looks like a glow, not a shadow.
→ Layered, offset, hue-tinted, low-opacity: `--shadow-sm/md/lg`.

**Shadow on everything.**
If every surface floats, the z-axis carries no information.
→ Shadow marks genuine elevation: dropdowns, modals, popovers, dragged items. Cards
in a grid want a border, not a shadow.

**Mixed radii.**
8px on cards, 12px on buttons, 6px on inputs, 4px on badges — chosen independently.
→ Three radii plus full, from the tokens. Nested corners: the inner radius should be
outer minus padding, or they look wrong.

**`border-radius: 50px` on everything.**
Pill-shaped cards, pill inputs, pill containers. Reads as a template.
→ `--radius-full` for pills, avatars, and tags only.

---

## Layout

**One centered card on a colored background.**
The default "app" shape that isn't a layout. Signals that no layout decision was made.
→ Build the real structure: nav, content region, sidebar if the data warrants one.

**Everything centered.**
Centered headings, centered body, centered form labels. Centered text has no
consistent left edge, so the eye has to re-find each line.
→ Left-align by default (or per writing direction). Center only short, isolated
things: a hero headline, an empty state, a modal's title.

**No focal element.**
Six equally-weighted cards. The user doesn't know where to start.
→ One focal element per screen. Decide what the user came to do and make it loudest;
actively suppress the rest.

**Uniform spacing everywhere.**
Same 16px gap between related and unrelated items, so nothing groups.
→ Proximity is the strongest grouping cue available. Related items tight (`--sp-2`),
groups apart (`--sp-5`/`--sp-6`). The jump should be visible.

**Desktop-only.**
Layout collapses or scrolls horizontally under 500px, discovered later.
→ Check ≤400px during the look-at-it loop. One-column fallback, no horizontal scroll.

**Fixed heights on content containers.**
`height: 240px` on a card whose content varies → clipped text or dead space.
→ `min-height`, and decide overflow behavior deliberately.

---

## Iconography & imagery

**Emoji as icons.**
🚀 📊 ✅ in buttons and nav. Renders differently per OS, can't be recolored, can't be
sized reliably, and reads as a placeholder.
→ A real icon set: Lucide, Phosphor, Heroicons, Radix Icons. One set, one weight, one
size per context.

**Mixed icon sets.**
Lucide in the nav, Font Awesome in the toolbar. Different stroke weights and grids
never look intentional.
→ One set. If it's missing an icon, compose from that set or draw to match its grid.

**Icons with no accessible name.**
Icon-only buttons with no label.
→ `aria-label`, plus a tooltip if the meaning isn't obvious.

**Random stock photography / gradient mesh blobs.**
Decoration that carries no information.
→ Show the actual product, actual data, or nothing.

---

## States & feedback

**Centered spinner for predictable content.**
A spinner where you already know the shape of what's loading.
→ Skeleton matching the real layout. Spinner only for genuinely unknown-shape or
sub-500ms waits. See states.md.

**No empty state.**
A blank region on first run — indistinguishable from a bug.
→ What this is, why it's empty, and the action that fills it.

**No error state.**
Failures logged to console, invisible to the user.
→ What failed, in plain language, with a retry.

**Missing hover/active/focus.**
A button that only has a rest state feels dead, and is unusable by keyboard.
→ All five states on every control. See states.md.

**`outline: none` with no replacement.**
Breaks keyboard navigation entirely. The most common serious a11y defect.
→ `:focus-visible` with a visible ring (in the base layer already). Never remove it.

**Placeholder as label.**
`placeholder="Email"` with no `<label>`. Vanishes on input; screen readers may skip it.
→ A real `<label>`. Placeholder is for format hints (`you@example.com`).

**Disabled buttons with no explanation.**
Greyed-out submit and no indication of what's missing.
→ Say what's required, or keep it enabled and validate on submit.

---

## Motion

**Animating `width`, `height`, `top`, `margin`.**
Triggers layout every frame; janks on anything mid-range.
→ `transform` and `opacity` only. Use `scale` for size, `translate` for position.

**Everything animating at once.**
Six elements sliding, fading, and scaling simultaneously — reads as noise, not polish.
→ One moving thing at a time. Stagger sequences 30–50ms.

**Durations over 400ms.**
A 700ms "smooth" fade feels like lag. Users perceive it as the app being slow.
→ 150 / 250 / 400 ceiling. See motion.md.

**Infinite ambient animation.**
Pulsing glows, floating cards, forever-bouncing arrows. Draws the eye permanently and
costs battery.
→ Motion responds to user action, or indicates real progress. Then it stops.

**No `prefers-reduced-motion`.**
Causes actual nausea for people with vestibular disorders.
→ Handled in the base layer. Don't override it away.

---

## Code-level

**Literal values in components.**
`#6366f1`, `padding: 13px`, `border-radius: 7px` scattered across files. Makes dark
mode and consistency impossible.
→ Tokens, always.

**Inline styles for anything themeable.**
`style={{ color: '#333' }}` can't respond to theme.
→ Classes or CSS variables.

**`!important` to win a cascade fight.**
A symptom of specificity chaos; the next override needs two.
→ Fix the selector or the layer order.

**A 900-line component.**
Nav, table, modal, and form in one file. Nothing is reusable and nothing is reviewable.
→ Split at the point where a piece has its own states.

**Pixel-perfect copy of a screenshot.**
Rebuilding a reference design literally, including its accidents.
→ Steal structure, density, and interaction patterns. Not pixels.
