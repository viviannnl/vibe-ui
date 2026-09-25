// Renders report.md. Tier 1 and Tier 2 are kept visually separate because they carry
// very different evidential weight — see bench/README.md § Validity safeguards.

const fmt = (v) => v === null || v === undefined ? '—'
  : typeof v === 'boolean' ? (v ? 'yes' : 'no')
  : typeof v === 'number' ? String(Math.round(v * 10000) / 10000) : String(v);

function delta(a, b, dir) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    if (typeof a === 'boolean' && typeof b === 'boolean')
      return a === b ? '·' : (b ? '**improved**' : '**regressed**');
    return '·';
  }
  if (a === b) return '·';
  const better = dir === 'down' ? b < a : b > a;
  const d = b - a;
  const pct = a !== 0 ? ` (${d > 0 ? '+' : ''}${Math.round((d / a) * 100)}%)` : '';
  return `${better ? '**improved**' : '**regressed**'} ${d > 0 ? '+' : ''}${Math.round(d * 10000) / 10000}${pct}`;
}

const T1 = [
  ['axe-core violated rules', 'axeRules', 'down'],
  ['axe-core failing nodes', 'axeNodes', 'down'],
  ['axe-core impact-weighted score', 'axeWeighted', 'down'],
  ['Text nodes failing WCAG AA contrast', 'contrastFailures', 'down'],
  ['Worst contrast ratio found', 'contrastWorst', 'up'],
  ['Controls with no accessible name', 'missingNames', 'down'],
  ['Targets under 24×24px', 'smallTargets', 'down'],
  ['Horizontal overflow at 390px (px)', 'reflowOverflowMobile', 'down'],
  ['Tabbable elements with no focus indicator', 'unindicatedFocus', 'down'],
  ['Cumulative Layout Shift', 'cls', 'down'],
  ['Long animation frames (>50ms)', 'longFrames', 'down'],
  ['Longest frame (ms)', 'longFrameMax', 'down'],
];

const T2 = [
  ['Literal colors outside token defs', 'literalColors', 'down'],
  ['Distinct font sizes rendered', 'fontSizes', 'down'],
  ['Distinct spacing values rendered', 'spacingValues', 'down'],
  ['Distinct border-radius values', 'radii', 'down'],
  ['Distinct colors rendered', 'colorsInUse', 'down'],
  ['Distinct shadows rendered', 'shadows', 'down'],
  ['Transitions on layout properties', 'layoutAnimated', 'down'],
  ['Infinite animations', 'infiniteAnimations', 'down'],
  ['Data states implemented (of 5)', 'statesImplemented', 'up'],
  ['prefers-reduced-motion handled', 'reducedMotion', 'up'],
  ['`outline: none` present', 'outlineNone', 'down'],
  ['`!important` count', 'important', 'down'],
  [':focus-visible rules', 'focusVisibleRules', 'up'],
  [':hover rules', 'hoverRules', 'up'],
  [':active rules', 'activeRules', 'up'],
  [':disabled rules', 'disabledRules', 'up'],
];

function table(rows, a, b) {
  const out = ['| Metric | Baseline | Styled | Change |', '|---|---:|---:|---|'];
  for (const [label, key, dir] of rows)
    out.push(`| ${label} | ${fmt(a[key])} | ${fmt(b[key])} | ${delta(a[key], b[key], dir)} |`);
  return out.join('\n');
}

export function renderReport(meta, results) {
  const a = results.baseline.rollup, b = results.styled.rollup;

  const axeList = (r) => r.rollup.axeDetail.length
    ? r.rollup.axeDetail.map(v =>
        `- \`${v.id}\` (${v.impact}, ${v.nodes} node${v.nodes === 1 ? '' : 's'}) — ${v.help}`).join('\n')
    : '_none_';

  const worstContrast = (r) => {
    const rows = Object.entries(r.states)
      .flatMap(([tag, s]) => (s.contrast?.failures ?? []).map(f => ({ tag, ...f })))
      .sort((x, y) => x.ratio - y.ratio).slice(0, 8);
    if (!rows.length) return '_no failures_';
    return ['| State | Element | Sample | Size | Ratio | Needs |', '|---|---|---|---:|---:|---:|']
      .concat(rows.map(r =>
        `| ${r.tag} | \`${r.selector}\` | ${JSON.stringify(r.sample)} | ${r.px}px/${r.weight} | **${r.ratio}** | ${r.required} |`))
      .join('\n');
  };

  return `# vibe-ui bench — results

Generated ${meta.generated} · Node ${meta.node}
Baseline \`${meta.commits.baseline}\` → Styled \`${meta.commits.styled}\`

Both branches pass \`harness/parity.spec.js\` unmodified, so every difference below is
presentational. Read the caveats in [../README.md](../README.md) before quoting any of
these numbers — in particular, **Tier 2 is circular** and is a regression guard, not
evidence of quality.

---

## Tier 1 — external standards

These use rulesets and physics I don't control (WCAG, axe-core, the compositor), so
they carry real evidential weight.

${table(T1, a, b)}

### axe-core violations

**Baseline:**

${axeList(results.baseline)}

**Styled:**

${axeList(results.styled)}

### Worst contrast failures — baseline

${worstContrast(results.baseline)}

### Worst contrast failures — styled

${worstContrast(results.styled)}

---

## Tier 2 — conformance to the skill (circular)

I wrote the rules, fixed the UI against them, then scored it with them. A perfect score
here means "conforms to vibe-ui", **not** "is a better UI". Useful as a regression guard
and as a check that the skill's own advice was actually applied.

${table(T2, a, b)}

---

## What these numbers do not say

- Nothing here measures whether the result is *pretty*, whether the visual hierarchy
  reads correctly, or whether the focal element is the right one. Use
  \`npm run blind\` for that.
- n = 1 app, and the baseline was written by the same author as the skill. This can
  falsify the skill but cannot validate it.
- The React/Tailwind/shadcn path in \`stacks.md\` is untested — this fixture exercises
  the no-build path only.

## Screenshots

\`results/screens/{baseline,styled}/<state>-<theme>-<viewport>.png\`
plus \`modal-*\` and \`reader-*\` for each theme and viewport.
`;
}
