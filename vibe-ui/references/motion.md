# Motion — specs, not vibes

Motion is most of what makes an interface feel dynamic, and it's also where generated
UI overreaches hardest. Everything here is a number so it can be checked.

---

## The two hard rules

**1. Animate `transform` and `opacity` only.**

Those two are the only properties the browser can composite on the GPU without
recalculating layout. Everything else costs a layout or paint pass per frame.

| Don't animate | Animate instead |
|---|---|
| `width`, `height` | `transform: scale()` |
| `top`, `left`, `margin` | `transform: translate()` |
| `box-shadow` | opacity of a stacked pseudo-element |
| `background-color` | acceptable — paint only, cheap at small sizes |
| `filter`, `backdrop-filter` | avoid animating entirely; very expensive |

Height animation for accordions is the common exception people reach for. Correct
solutions: CSS grid `grid-template-rows: 0fr → 1fr`, or Framer Motion's `height:
'auto'` (which measures and uses transforms), or `calc-size()` where supported. Do not
animate raw `height` in a loop.

**2. `prefers-reduced-motion` is not optional.**

Vestibular disorders are real, and the global handler in `tokens.css` covers the
default case. Where motion carries meaning, replace rather than delete:

```css
@media (prefers-reduced-motion: reduce) {
  .slide-in { animation: fade-in var(--dur-fast) both; } /* opacity, no transform */
}
```

---

## Duration

| Duration | Token | Use |
|---|---|---|
| 100–150ms | `--dur-fast` | Hover, press, focus ring, tooltip, color change |
| 200–300ms | `--dur-base` | Toggle, accordion, tab switch, dropdown |
| 350–400ms | `--dur-slow` | Modal entrance, page transition, large layout shift |

- **Under ~100ms** isn't perceived as motion — it just looks like a jump. Fine for
  press feedback, pointless elsewhere.
- **Over 400ms** reads as lag, not elegance. This is the most common mistake: a 700ms
  "smooth" fade makes the whole app feel slow.
- **Exits are faster than entrances** — roughly 2/3. The user has already decided;
  don't make them wait.
- **Scale with distance.** A tooltip moving 4px and a sheet moving 400px should not
  share a duration. Larger travel → longer, within the ceiling.

---

## Easing

| Curve | Token | Use |
|---|---|---|
| `cubic-bezier(0.16, 1, 0.30, 1)` | `--ease-out` | Entering. Fast start, soft settle. |
| `cubic-bezier(0.55, 0, 0.85, 0.35)` | `--ease-in` | Exiting. Accelerates away. |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | `--ease-spring` | Toggles, drags — slight overshoot |

- **Never `linear`** for UI motion (only for continuous things: spinners, marquees,
  progress bars).
- **Never `ease-in-out` on entrances** — the slow start reads as hesitation.
- `ease-out` is the right default for roughly 80% of UI transitions.

**Springs beat curves for anything the user physically manipulates** — drags, toggles,
sheets. A spring's velocity can carry through from the gesture, so the motion
continues from where the finger left off instead of restarting. In Framer Motion:
`transition={{ type: 'spring', stiffness: 400, damping: 30 }}`. Stiffness sets speed,
damping sets bounce; `damping: 30` at `stiffness: 400` is barely-perceptible overshoot,
which is usually what you want.

---

## Patterns worth having

### Enter / exit

```css
@keyframes enter {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
.enter { animation: enter var(--dur-base) var(--ease-out) both; }
```

8px of travel, not 40. Large entrance distances look theatrical and slow the
perceived speed.

### Staggered lists

30–50ms per item, capped at ~8 — beyond that the last item is a visible wait.

```css
.list-item { animation: enter var(--dur-base) var(--ease-out) both; }
.list-item:nth-child(1) { animation-delay: 0ms }
.list-item:nth-child(2) { animation-delay: 40ms }
/* … cap at 8; item 9+ shares the 320ms delay */
```

Framer Motion: `staggerChildren: 0.04` on the parent's `transition`.

### Hover intent

Without a delay, moving the pointer across a row of menu triggers flickers every
panel open. ~100ms before open, ~200–300ms grace before close.

```js
let t;
el.addEventListener('pointerenter', () => { t = setTimeout(open, 100); });
el.addEventListener('pointerleave', () => { clearTimeout(t); setTimeout(close, 250); });
```

### Layout animation (React)

`<motion.div layout>` is the highest-leverage single line in this document. It does
FLIP correctly — measures before and after, animates the delta with transforms. Free
correct animation on reorder, filter, resize, and expand.

```jsx
{items.map(i => <motion.li key={i.id} layout>{i.name}</motion.li>)}
```

`key` must be a stable id, not the array index, or it animates the wrong elements.

### View Transitions (no framework)

For plain HTML, Flask/Jinja, or any MPA — cross-document morphs in a few lines:

```css
@view-transition { navigation: auto; }

/* view-transition-name must be UNIQUE per element on the page, and must match
   across the two documents for the morph to happen. Generate it server-side
   from the record id — it is not a design token. */
.card-title { view-transition-name: var(--vt-name); }
```
```html
<h2 class="card-title" style="--vt-name: listing-{{ listing.id }}">…</h2>
```

Chrome and Safari support this; Firefox is behind a flag as of early 2026. It degrades
to an instant navigation, so it's safe to ship unguarded.

### Scroll-driven (no JS)

```css
.reveal {
  animation: enter linear both;
  animation-timeline: view();
  animation-range: entry 10% cover 30%;
}
```

Runs off the compositor, so it can't jank the main thread the way a scroll listener
can. Use sparingly — scroll-triggered reveals on every section is its own
anti-pattern.

---

## Budget

**One moving thing at a time.** The most common motion failure isn't a wrong duration,
it's six unrelated things animating at once. That reads as noise; the eye has nowhere
to land.

- A transition should have one clear subject. Everything else holds still.
- Sequence related motion (stagger) rather than firing it simultaneously.
- **No infinite ambient animation** — pulsing glows, floating cards, bouncing arrows.
  It permanently captures attention and costs battery. Exception: genuine
  indeterminate progress.
- If you can't name what a given animation communicates, delete it.

---

## Verifying

- **DevTools → Rendering → Frame Rendering Stats.** Watch for drops below 60fps.
- **Paint flashing** in the same panel: green rectangles during your animation mean
  you're painting, which means you animated the wrong property.
- **CPU throttling 4×.** Animation that only works on an M-series laptop isn't done.
- **Toggle reduced-motion** in DevTools (Rendering → Emulate CSS media) and confirm
  the UI still functions and nothing important becomes invisible.
