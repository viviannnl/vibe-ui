// Functional parity. Must pass UNMODIFIED on both bench/baseline and bench/styled.
// Drives the app only through data-testid, never through roles or CSS, so that a
// baseline with bad accessibility still passes. If this fails on either branch, the
// before/after comparison is void.
import { test, expect } from '@playwright/test';

const T = (p, id) => p.locator(`[data-testid="${id}"]`);

async function load(page, state) {
  await page.goto(state ? `/?state=${state}` : '/');
  if (state !== 'loading' && state !== 'error') {
    await T(page, 'item-count').waitFor({ timeout: 5000 }).catch(() => {});
  }
}

test.describe('data states', () => {
  test('populated renders all 12 items', async ({ page }) => {
    await load(page);
    await expect(T(page, 'item-row')).toHaveCount(12);
    await expect(T(page, 'item-count')).toHaveText('12 items');
  });

  test('loading state is present and exclusive', async ({ page }) => {
    await load(page, 'loading');
    await expect(T(page, 'state-loading')).toBeVisible();
    await expect(T(page, 'item-row')).toHaveCount(0);
  });

  test('error state offers retry', async ({ page }) => {
    await load(page, 'error');
    await expect(T(page, 'state-error')).toBeVisible();
    await expect(T(page, 'retry')).toBeVisible();
  });

  test('empty and noresults are distinct containers', async ({ page }) => {
    await load(page, 'empty');
    await expect(T(page, 'state-empty')).toBeVisible();
    await expect(T(page, 'state-noresults')).toHaveCount(0);

    await load(page, 'noresults');
    await expect(T(page, 'state-noresults')).toBeVisible();
    await expect(T(page, 'state-empty')).toHaveCount(0);
  });
});

test.describe('filtering and sorting', () => {
  test('search filters by title and author', async ({ page }) => {
    await load(page);
    await T(page, 'search').fill('Søren');
    await expect(T(page, 'item-row')).toHaveCount(1);
    await T(page, 'search').fill('zzzzzz');
    await expect(T(page, 'state-noresults')).toBeVisible();
  });

  test('status filter narrows to exactly one reading item', async ({ page }) => {
    await load(page);
    await T(page, 'filter-status').selectOption('reading');
    await expect(T(page, 'item-row')).toHaveCount(1);
    // singular copy, not "1 items"
    await expect(T(page, 'item-count')).toHaveText('1 item');
  });

  test('search and status compose', async ({ page }) => {
    await load(page);
    await T(page, 'filter-status').selectOption('done');
    const done = await T(page, 'item-row').count();
    await T(page, 'search').fill('a');
    expect(await T(page, 'item-row').count()).toBeLessThanOrEqual(done);
  });

  test('sort by title orders alphabetically', async ({ page }) => {
    await load(page);
    await T(page, 'sort').selectOption('title');
    const titles = await T(page, 'item-title').allInnerTexts();
    const sorted = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });
});

test.describe('reader view', () => {
  test('clicking an item opens reader, back returns', async ({ page }) => {
    await load(page);
    const first = await T(page, 'item-title').first().innerText();
    await T(page, 'item-row').first().click();
    await expect(T(page, 'reader')).toBeVisible();
    await expect(T(page, 'reader-title')).toHaveText(first);
    await expect(T(page, 'item-row')).toHaveCount(0);

    await T(page, 'reader-back').click();
    await expect(T(page, 'reader')).toHaveCount(0);
    await expect(T(page, 'item-row')).toHaveCount(12);
  });
});

test.describe('star', () => {
  test('toggles and reports state, surviving a view change', async ({ page }) => {
    await load(page);
    const star = T(page, 'star').first();
    await expect(star).toHaveAttribute('aria-pressed', 'false');
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');

    await T(page, 'item-row').first().click();
    await T(page, 'reader-back').click();
    await expect(T(page, 'star').first()).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('note modal', () => {
  test('rejects whitespace-only and stays open', async ({ page }) => {
    await load(page);
    await T(page, 'note-open').first().click();
    await expect(T(page, 'modal')).toBeVisible();
    await expect(T(page, 'note-error')).toHaveCount(0);

    await T(page, 'note-input').fill('   ');
    await T(page, 'note-save').click();
    await expect(T(page, 'note-error')).toBeVisible();
    await expect(T(page, 'modal')).toBeVisible();
  });

  test('saves valid note and closes', async ({ page }) => {
    await load(page);
    await T(page, 'note-open').first().click();
    await T(page, 'note-input').fill('A real note.');
    await T(page, 'note-save').click();
    await expect(T(page, 'modal')).toHaveCount(0);
  });

  test('escape closes without saving', async ({ page }) => {
    await load(page);
    await T(page, 'note-open').first().click();
    await T(page, 'note-input').fill('discard me');
    await page.keyboard.press('Escape');
    await expect(T(page, 'modal')).toHaveCount(0);

    await T(page, 'note-open').first().click();
    await expect(T(page, 'note-input')).toHaveValue('');
  });

  test('cancel closes without saving', async ({ page }) => {
    await load(page);
    await T(page, 'note-open').first().click();
    await T(page, 'note-input').fill('nope');
    await T(page, 'note-cancel').click();
    await expect(T(page, 'modal')).toHaveCount(0);
  });
});

test.describe('theme', () => {
  test('toggles and persists across reload', async ({ page }) => {
    await load(page);
    await T(page, 'theme-toggle').click();
    const after = await page.evaluate(() => localStorage.getItem('theme'));
    expect(after).toBe('dark');
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  });
});

test.describe('edge-case data is actually present', () => {
  test('all eight seeded edge cases render', async ({ page }) => {
    await load(page);
    const titles = await T(page, 'item-title').allInnerTexts();
    expect(titles.some(t => t.length >= 72)).toBeTruthy();          // long title
    expect(titles.some(t => /Søren/.test(t))).toBeTruthy();          // non-ASCII latin
    expect(titles.some(t => /日本語/.test(t))).toBeTruthy();          // CJK
    expect(titles.some(t => /^\S{40,}$/.test(t))).toBeTruthy();      // unbroken string
    const counts = await page.evaluate(() =>
      window.__bench.items.map(i => ({ tags: i.tags.length, rating: i.rating })));
    expect(counts.some(c => c.tags === 0)).toBeTruthy();
    expect(counts.some(c => c.tags >= 6)).toBeTruthy();
    expect(counts.some(c => c.rating === null)).toBeTruthy();
  });

  test('no element overflows the viewport horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1); // sub-pixel rounding only
  });
});
