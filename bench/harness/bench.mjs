// Orchestrator: checks out both branches into git worktrees, measures each, writes a
// report. Metrics are those pre-registered in bench/README.md.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';
import * as audits from './audits.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const OUT = resolve(HERE, '../results');
const WT = resolve(HERE, '../.worktrees');

const BRANCHES = [
  { key: 'baseline', ref: 'bench/baseline', label: 'Baseline (no skill)' },
  { key: 'styled', ref: 'bench/styled', label: 'Styled (vibe-ui applied)' },
];
const STATES = ['populated', 'loading', 'error', 'empty', 'noresults'];
const THEMES = ['light', 'dark'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }).trim();
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- CSS source
async function cssSource(appDir) {
  const path = join(appDir, 'styles.css');
  const css = existsSync(path) ? await readFile(path, 'utf8') : '';
  const strip = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Literal colors OUTSIDE of a custom-property definition are the anti-pattern;
  // literals inside :root{--x:...} are how a token file is legitimately written.
  const declarations = strip.split(/[;{}]/);
  const literalOutsideToken = declarations.filter(d => {
    const isTokenDef = /^\s*--[\w-]+\s*:/.test(d);
    const hasLiteral = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(d);
    return hasLiteral && !isTokenDef;
  }).length;
  return {
    bytes: css.length,
    literalColorsTotal: (strip.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? []).length,
    literalColorsOutsideTokens: literalOutsideToken,
    customProperties: new Set((strip.match(/--[\w-]+\s*:/g) ?? [])).size,
    varUsages: (strip.match(/var\(--/g) ?? []).length,
    reducedMotion: /prefers-reduced-motion/.test(strip),
    darkMode: /prefers-color-scheme|\[data-theme/.test(strip),
    focusVisibleRules: (strip.match(/:focus-visible/g) ?? []).length,
    hoverRules: (strip.match(/:hover/g) ?? []).length,
    activeRules: (strip.match(/:active/g) ?? []).length,
    disabledRules: (strip.match(/:disabled|\[aria-disabled/g) ?? []).length,
    importantCount: (strip.match(/!important/g) ?? []).length,
    outlineNone: /outline\s*:\s*(none|0)/.test(strip),
  };
}

// ------------------------------------------------------------ focus indicator
// Real Tab traversal, so this measures tab order AND whether :focus-visible paints.
async function focusAudit(page) {
  await page.goto(page.url().split('?')[0] + '?state=populated');
  await page.locator('[data-testid="item-count"]').waitFor({ timeout: 5000 }).catch(() => {});
  await page.evaluate(() => document.body.focus());

  const seen = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        testid: el.dataset?.testid ?? null,
        outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle,
        outlineColor: cs.outlineColor, boxShadow: cs.boxShadow,
        borderColor: cs.borderColor, backgroundColor: cs.backgroundColor,
        visible: b.width > 0 && b.height > 0,
      };
    });
    if (!info) break;
    const key = `${info.tag}:${info.testid}:${seen.length}`;
    // A focus indicator counts if there's a real outline or a box-shadow ring.
    const hasOutline = info.outlineStyle !== 'none' && parseFloat(info.outlineWidth) > 0;
    const hasRing = info.boxShadow !== 'none';
    seen.push({ ...info, key, indicated: hasOutline || hasRing });
    if (seen.length > 1 && seen.at(-1).testid && seen.at(-1).testid === seen[0].testid
        && seen.length > 8) break; // wrapped around
  }
  return {
    tabbable: seen.length,
    unindicated: seen.filter(s => !s.indicated),
    offscreen: seen.filter(s => !s.visible),
  };
}

// -------------------------------------------------------------- performance
async function perfAudit(page, url) {
  await page.goto(url + '?state=populated');
  await page.evaluate(() => {
    window.__perf = { cls: 0, longFrames: [], longTasks: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries())
          if (e.duration > 50) window.__perf.longFrames.push(Math.round(e.duration));
      }).observe({ type: 'long-animation-frame', buffered: true });
    } catch { /* Chromium < 123 */ }
    try {
      new PerformanceObserver((l) => { window.__perf.longTasks += l.getEntries().length; })
        .observe({ type: 'longtask', buffered: true });
    } catch { /* unsupported */ }
  });
  await page.locator('[data-testid="item-count"]').waitFor({ timeout: 5000 }).catch(() => {});

  // Exercise the interactions that animate.
  const click = async (sel) => {
    const l = page.locator(sel).first();
    if (await l.count()) { await l.click().catch(() => {}); await page.waitForTimeout(450); }
  };
  await click('[data-testid="theme-toggle"]');
  await click('[data-testid="theme-toggle"]');
  await click('[data-testid="star"]');
  await click('[data-testid="note-open"]');
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  const statusSel = page.locator('[data-testid="filter-status"]');
  if (await statusSel.count()) {
    await statusSel.selectOption('done').catch(() => {});
    await page.waitForTimeout(400);
    await statusSel.selectOption('all').catch(() => {});
    await page.waitForTimeout(400);
  }
  await click('[data-testid="item-row"]');
  await click('[data-testid="reader-back"]');

  const p = await page.evaluate(() => window.__perf);
  return {
    cls: Math.round(p.cls * 10000) / 10000,
    longFrameCount: p.longFrames.length,
    longFrameMax: p.longFrames.length ? Math.max(...p.longFrames) : 0,
    longTasks: p.longTasks,
  };
}

// ------------------------------------------------------------------- per branch
async function measureBranch(browser, b, axeSource) {
  const appDir = join(WT, b.key, 'bench/app');
  if (!existsSync(appDir)) throw new Error(`missing app dir for ${b.ref}: ${appDir}`);
  const { server, url } = await serve(appDir);
  const shotDir = join(OUT, 'screens', b.key);
  await mkdir(shotDir, { recursive: true });

  const result = { key: b.key, label: b.label, ref: b.ref, url,
                   css: await cssSource(appDir), states: {} };

  try {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme, reducedMotion: 'no-preference',
        });
        // Pre-seed the theme so first paint is already correct.
        await ctx.addInitScript(t => localStorage.setItem('theme', t), theme);
        const page = await ctx.newPage();

        for (const state of STATES) {
          const tag = `${state}-${theme}-${vp.name}`;
          await page.goto(`${url}/?state=${state}`);
          await page.waitForTimeout(state === 'loading' ? 300 : 900);

          await page.screenshot({ path: join(shotDir, `${tag}.png`), fullPage: true });

          const rec = {};
          rec.contrast = await page.evaluate(audits.contrastAudit);
          rec.targets = await page.evaluate(audits.targetSizeAudit);
          rec.names = await page.evaluate(audits.nameAudit);
          rec.probe = await page.evaluate(audits.stateProbe);
          if (vp.name === 'desktop') {
            rec.scales = await page.evaluate(audits.scaleAudit);
            rec.motion = await page.evaluate(audits.motionAudit);
          }
          // axe
          await page.addScriptTag({ content: axeSource });
          rec.axe = await page.evaluate(async () => {
            const r = await window.axe.run(document, {
              resultTypes: ['violations'],
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
            });
            return r.violations.map(v => ({
              id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help,
            }));
          });
          result.states[tag] = rec;
        }

        // Modal screenshot — an important surface the state sweep misses.
        await page.goto(`${url}/?state=populated`);
        await page.waitForTimeout(900);
        const open = page.locator('[data-testid="note-open"]').first();
        if (await open.count()) {
          await open.click().catch(() => {});
          await page.waitForTimeout(500);
          await page.screenshot({ path: join(shotDir, `modal-${theme}-${vp.name}.png`) });
          const rec = { contrast: await page.evaluate(audits.contrastAudit) };
          await page.addScriptTag({ content: axeSource });
          rec.axe = await page.evaluate(async () => {
            const r = await window.axe.run(document, { resultTypes: ['violations'],
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
            return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
          });
          result.states[`modal-${theme}-${vp.name}`] = rec;
        }

        // Reader view screenshot.
        await page.goto(`${url}/?state=populated`);
        await page.waitForTimeout(900);
        const row = page.locator('[data-testid="item-row"]').first();
        if (await row.count()) {
          await row.click().catch(() => {});
          await page.waitForTimeout(500);
          await page.screenshot({ path: join(shotDir, `reader-${theme}-${vp.name}.png`), fullPage: true });
          result.states[`reader-${theme}-${vp.name}`] =
            { contrast: await page.evaluate(audits.contrastAudit) };
        }

        if (vp.name === 'desktop' && theme === 'light') {
          result.focus = await focusAudit(page);
          result.perf = await perfAudit(page, url);
        }
        await ctx.close();
      }
    }
  } finally {
    server.close();
  }
  return result;
}

// ------------------------------------------------------------------ aggregate
function rollup(r) {
  const states = Object.entries(r.states);
  const axeAll = states.flatMap(([, s]) => s.axe ?? []);
  const weight = { critical: 10, serious: 5, moderate: 2, minor: 1 };
  // Dedupe axe rules by id, keeping the max node count seen in any state.
  const byId = new Map();
  for (const v of axeAll) {
    const prev = byId.get(v.id);
    if (!prev || v.nodes > prev.nodes) byId.set(v.id, v);
  }
  const uniq = [...byId.values()];
  const desktopLight = r.states['populated-light-desktop'] ?? {};

  const probeStates = ['state-loading', 'state-error', 'state-empty', 'state-noresults'];
  const implemented = probeStates.filter(id =>
    states.some(([tag, s]) => tag.startsWith(id.replace('state-', '')) && (s.probe?.[id] ?? 0) > 0)
  ).length + (states.some(([, s]) => (s.probe?.['item-row'] ?? 0) > 0) ? 1 : 0);

  return {
    // Tier 1
    axeRules: uniq.length,
    axeNodes: sum(uniq.map(v => v.nodes)),
    axeWeighted: sum(uniq.map(v => (weight[v.impact] ?? 1) * v.nodes)),
    axeDetail: uniq.sort((a, b) => (weight[b.impact] ?? 1) - (weight[a.impact] ?? 1)),
    contrastChecked: sum(states.map(([, s]) => s.contrast?.checked ?? 0)),
    contrastFailures: sum(states.map(([, s]) => s.contrast?.failures?.length ?? 0)),
    contrastWorst: Math.min(...states.flatMap(([, s]) =>
      (s.contrast?.worst ?? []).map(w => w.ratio)).concat([99])),
    smallTargets: Math.max(...states.map(([, s]) => s.targets?.length ?? 0)),
    missingNames: Math.max(...states.map(([, s]) => s.names?.length ?? 0)),
    unindicatedFocus: r.focus?.unindicated.length ?? null,
    tabbable: r.focus?.tabbable ?? null,
    cls: r.perf?.cls ?? null,
    longFrames: r.perf?.longFrameCount ?? null,
    longFrameMax: r.perf?.longFrameMax ?? null,
    // Tier 2
    literalColors: r.css.literalColorsOutsideTokens,
    customProps: r.css.customProperties,
    varUsages: r.css.varUsages,
    reducedMotion: r.css.reducedMotion,
    outlineNone: r.css.outlineNone,
    important: r.css.importantCount,
    fontSizes: desktopLight.scales?.fontSizes.length ?? null,
    spacingValues: desktopLight.scales?.spacing.length ?? null,
    radii: desktopLight.scales?.radii.length ?? null,
    colorsInUse: desktopLight.scales?.colors.length ?? null,
    shadows: desktopLight.scales?.shadows.length ?? null,
    layoutAnimated: desktopLight.motion?.layoutAnimated.length ?? null,
    infiniteAnimations: desktopLight.motion?.infinite.length ?? null,
    statesImplemented: implemented,
    focusVisibleRules: r.css.focusVisibleRules,
    hoverRules: r.css.hoverRules,
    activeRules: r.css.activeRules,
    disabledRules: r.css.disabledRules,
  };
}

// ----------------------------------------------------------------------- main
async function setupWorktrees() {
  await rm(WT, { recursive: true, force: true });
  for (const b of BRANCHES) {
    try { git('worktree', 'remove', '--force', join(WT, b.key)); } catch {}
  }
  git('worktree', 'prune');
  for (const b of BRANCHES) git('worktree', 'add', '--detach', join(WT, b.key), b.ref);
}

const main = async () => {
  await mkdir(OUT, { recursive: true });
  console.log('setting up worktrees…');
  await setupWorktrees();

  const axeSource = await readFile(
    resolve(HERE, 'node_modules/axe-core/axe.min.js'), 'utf8');
  const browser = await chromium.launch();
  const results = {};
  for (const b of BRANCHES) {
    console.log(`measuring ${b.ref}…`);
    results[b.key] = await measureBranch(browser, b, axeSource);
    results[b.key].rollup = rollup(results[b.key]);
  }
  await browser.close();

  const meta = {
    generated: new Date().toISOString(),
    node: process.version,
    commits: Object.fromEntries(BRANCHES.map(b => [b.key, git('rev-parse', '--short', b.ref)])),
  };
  await writeFile(join(OUT, 'report.json'),
    JSON.stringify({ meta, results }, null, 2));
  const { renderReport } = await import('./report.mjs');
  await writeFile(join(OUT, 'report.md'), renderReport(meta, results));
  console.log(`\nwrote ${join(OUT, 'report.md')}`);

  // Leave worktrees in place so the report's screenshots can be regenerated cheaply.
  console.log(`worktrees left at ${WT} (remove with: git worktree remove --force <path>)`);
};

await main();
