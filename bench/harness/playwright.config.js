// Used only for the parity suite. The metrics harness (bench.mjs) drives Playwright
// directly. APP_DIR is set by run-parity.mjs to point at a branch worktree.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /parity\.spec\.js/,
  fullyParallel: true,
  reporter: [['list'], ['json', { outputFile: '../results/parity.json' }]],
  use: {
    baseURL: process.env.BENCH_URL ?? 'http://127.0.0.1:8099',
    trace: 'off',
  },
});
