# Stack recipes

Pick once, from the table. Don't re-litigate the stack on every task.

| Situation | Stack |
|---|---|
| React app, greenfield | Tailwind + shadcn/ui + Framer Motion |
| React app, existing CSS approach | Keep it; add tokens as CSS variables |
| Flask / Django / Rails templates | Tailwind CDN or CLI + Alpine.js |
| Single HTML file, no build | Tailwind Play CDN + Alpine, tokens inline |
| Needs a full component set fast | shadcn/ui (React) · Radix primitives · Headless UI |
| Charts anywhere | The `dataviz` skill decides. Not here. |

**Don't reach for:** Bootstrap or Material UI for new work (both carry a strong,
recognizable look that's hard to escape); CSS-in-JS runtime libraries
(styled-components, Emotion) for new projects — runtime cost and poor RSC support;
a custom design system for anything under ~20 components.

---

## React — Tailwind + shadcn/ui + Framer Motion

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app && npm i
npm i -D tailwindcss @tailwindcss/vite
npm i framer-motion lucide-react
npx shadcn@latest init
```

Map the tokens into Tailwind so utilities and CSS agree. With Tailwind v4, this is
CSS-only — no `tailwind.config.js` needed:

```css
/* app.css */
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-surface:        var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-sunken: var(--surface-sunken);
  --color-border:         var(--border);
  --color-text:           var(--text);
  --color-text-muted:     var(--text-muted);
  --color-accent:         var(--accent);
  --color-accent-hover:   var(--accent-hover);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
}
```

Now `bg-surface-raised text-text-muted shadow-md` resolve to the tokens, and dark mode
works with no `dark:` variants at all — the semantic tokens already flipped.

For Tailwind v3, the same mapping goes in `theme.extend.colors` as
`surface: 'var(--surface)'` etc.

**Why shadcn/ui rather than a package:** it copies source into your repo instead of
vendoring a styled dependency, so restyling to your tokens is editing your own files.
After `npx shadcn@latest add button`, replace its color classes with the semantic ones
above — otherwise you inherit shadcn's default neutral palette alongside yours.

**Framer Motion, the 20% worth knowing:**

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// layout — free FLIP on reorder/resize. Highest leverage thing in the library.
<motion.li layout key={item.id} />

// enter/exit — AnimatePresence is required for exit to run at all
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    />
  )}
</AnimatePresence>

// stagger — on the parent
<motion.ul variants={{ show: { transition: { staggerChildren: 0.04 } } }}
           initial="hide" animate="show" />
```

---

## Flask / Jinja / Django — Tailwind + Alpine

Gets ~80% of React's interactivity with no build step and no client router. Correct
choice for small apps and dashboards.

```html
<link rel="stylesheet" href="{{ url_for('static', filename='tokens.css') }}">
<script src="https://cdn.tailwindcss.com"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
```

```html
<div x-data="{ open: false }">
  <button @click="open = !open" :aria-expanded="open">Filters</button>
  <div x-show="open"
       x-transition:enter="transition ease-out duration-250"
       x-transition:enter-start="opacity-0 -translate-y-1"
       x-transition:enter-end="opacity-100 translate-y-0">
    …
  </div>
</div>
```

Alpine covers: toggles, dropdowns, tabs, modals, inline edit, form state, fetch +
render. Reach for React only when you have genuinely shared client state across many
components.

Pair with **HTMX** for server-rendered partial updates — `hx-get` returning a Jinja
fragment replaces most of what people spin up an SPA for. Alpine for local UI state,
HTMX for server state, is a coherent and very small stack.

The **CDN Tailwind build is dev-only** — it ships the whole framework and compiles in
the browser. Before anything real, switch to the CLI:

```bash
npx @tailwindcss/cli -i ./static/src.css -o ./static/app.css --minify --watch
```

---

## Single HTML file, no build

Genuinely viable for demos and one-pagers. Paste `tokens.css` into a `<style>` block,
use Alpine from CDN, and use the View Transitions API for navigation (see motion.md).
No bundler, no `node_modules`, one file to share.

---

## Icons

One set, project-wide. Never mix.

| Set | Notes |
|---|---|
| **Lucide** | Default recommendation. Consistent 24px grid, 1.5px stroke, ~1500 icons, every framework. |
| **Phosphor** | Six weights — useful if you need filled + outline pairs. |
| **Heroicons** | Pairs naturally with Tailwind; smaller set. |
| **Radix Icons** | 15px grid, very crisp at small sizes; UI-chrome oriented. |

```jsx
import { Search, Settings2 } from 'lucide-react';
<Search size={16} strokeWidth={1.5} aria-hidden />
```

Size icons from the type scale — 16px icons next to 14px text, 20px next to 16px. An
icon that's visually heavier than its label looks wrong. Icon-only buttons need
`aria-label`.

---

## Fonts

The system stack in `tokens.css` is genuinely fine and costs zero bytes. If you load a
webfont, load *one*, with `font-display: swap`, subset to the characters you need, and
self-host (Google Fonts' CDN adds a connection and a privacy question).

Pairings that hold up: Inter or Geist for UI · Instrument Sans or Söhne for something
less common · a serif (Fraunces, Newsreader) for editorial headings against a sans
body. Avoid: two fonts that are both sans and both neutral — the contrast isn't
readable as intentional.

---

## What to look at

Steal structure and interaction patterns, never pixels:

- **Linear** — density, keyboard-first interaction, restrained motion
- **Vercel / Geist** — restraint, spacing discipline, dark mode
- **Stripe docs** — dense data made legible, excellent code blocks
- **Raycast** — command palette and list interaction
- **Radix docs** — accessible primitive behavior, worth reading the source

If the project has an existing design language, match it and stop. A "better" UI that
doesn't match the surrounding app is worse.
