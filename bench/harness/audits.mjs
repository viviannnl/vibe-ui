// Browser-side audit functions. Exported as plain function bodies so they can be
// handed to page.evaluate(). Each returns JSON-serializable data.
//
// These implement the Tier 1 / Tier 2 metrics pre-registered in bench/README.md.

/** T1.2 — WCAG AA contrast of every rendered text node. */
export function contrastAudit() {
  const parse = (s) => {
    const m = String(s).match(/[\d.]+/g);
    if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (fg, bg) => ({            // composite fg (with alpha) onto opaque bg
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
  });
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  // Walk ancestors for the first non-transparent background, compositing as we go.
  const effectiveBg = (el) => {
    let stack = [];
    for (let n = el; n && n !== document.documentElement.parentNode; n = n.parentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) { stack.push(bg); if (bg.a === 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };

  const results = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue.trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;

    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;
    const bg = effectiveBg(el);
    const fg = over(fgRaw, bg);
    const px = parseFloat(cs.fontSize);
    const weight = +cs.fontWeight || 400;
    // WCAG "large": >=24px, or >=18.66px at >=700 weight.
    const large = px >= 24 || (px >= 18.66 && weight >= 700);
    const required = large ? 3.0 : 4.5;
    const r = ratio(fg, bg);
    results.push({
      selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(/\s+/)[0] : ''),
      sample: text.slice(0, 40), px, weight, large,
      ratio: Math.round(r * 100) / 100, required, pass: r >= required,
    });
  }
  return {
    checked: results.length,
    failures: results.filter(r => !r.pass),
    worst: results.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 5),
  };
}

/** T1.4 — interactive targets below the WCAG 2.2 SC 2.5.8 24x24 minimum. */
export function targetSizeAudit() {
  const sel = 'a[href],button,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])';
  const small = [];
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) continue;
    if (b.width < 24 || b.height < 24) {
      small.push({
        tag: el.tagName.toLowerCase(),
        testid: el.dataset.testid ?? null,
        w: Math.round(b.width), h: Math.round(b.height),
      });
    }
  }
  return small;
}

/** T2.2–T2.4 — how many distinct values are actually in use. Lower = more systematic. */
export function scaleAudit() {
  const fontSizes = new Set(), radii = new Set(), spacing = new Set();
  const colors = new Set(), shadows = new Set(), durations = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    fontSizes.add(cs.fontSize);
    if (cs.borderRadius !== '0px') radii.add(cs.borderRadius);
    if (cs.boxShadow !== 'none') shadows.add(cs.boxShadow);
    if (cs.transitionDuration !== '0s') durations.add(cs.transitionDuration);
    colors.add(cs.color);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(cs.backgroundColor);
    for (const p of ['paddingTop', 'paddingLeft', 'marginTop', 'marginLeft', 'gap']) {
      const v = cs[p];
      if (v && v !== '0px' && v !== 'normal') spacing.add(v);
    }
  }
  return {
    fontSizes: [...fontSizes].sort(), radii: [...radii],
    spacing: [...spacing].sort((a, b) => parseFloat(a) - parseFloat(b)),
    colors: [...colors], shadows: [...shadows], durations: [...durations],
  };
}

/** T2.6 — transitions/animations on properties that force layout. */
export function motionAudit() {
  const LAYOUT = ['width', 'height', 'top', 'left', 'right', 'bottom',
                  'margin', 'padding', 'all'];
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const props = cs.transitionProperty.split(',').map(s => s.trim());
    const bad = props.filter(p => LAYOUT.some(l => p === l || p.startsWith(l + '-')));
    if (bad.length && cs.transitionDuration !== '0s') {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        testid: el.dataset.testid ?? null, props: bad,
      });
    }
  }
  // Infinite animations — the ambient-motion anti-pattern.
  const infinite = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.animationIterationCount.split(',').some(v => v.trim() === 'infinite')) {
      infinite.push({ tag: el.tagName.toLowerCase(), name: cs.animationName });
    }
  }
  return { layoutAnimated: offenders, infinite };
}

/** Which of the five pre-registered data states this build actually implements. */
export function stateProbe() {
  const ids = ['state-loading', 'state-error', 'state-empty', 'state-noresults', 'item-row'];
  const out = {};
  for (const id of ids) out[id] = document.querySelectorAll(`[data-testid="${id}"]`).length;
  return out;
}

/** Accessible-name coverage for controls that have no visible text. */
export function nameAudit() {
  const missing = [];
  for (const el of document.querySelectorAll('button,a[href],input,select,textarea')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const text = (el.innerText || '').trim();
    const aria = el.getAttribute('aria-label');
    const labelled = el.getAttribute('aria-labelledby');
    const title = el.getAttribute('title');
    const hasLabel = el.labels ? el.labels.length > 0 : false;
    if (!text && !aria && !labelled && !title && !hasLabel) {
      missing.push({ tag: el.tagName.toLowerCase(), testid: el.dataset.testid ?? null });
    }
  }
  return missing;
}
