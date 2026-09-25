// Runs the parity suite against both branch worktrees. If either fails, the
// before/after comparison is void — that's the whole point of this gate.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const WT = resolve(HERE, '../.worktrees');
const BRANCHES = [['baseline', 'bench/baseline'], ['styled', 'bench/styled']];

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }).trim();

for (const [key, ref] of BRANCHES) {
  const dir = join(WT, key);
  if (!existsSync(dir)) git('worktree', 'add', '--detach', dir, ref);
}

// Must be async: spawnSync would block this process's event loop, and the static
// server runs in THIS process — it would never accept a connection.
const run = (cmd, args, env) => new Promise((resolve) => {
  const p = spawn(cmd, args, { cwd: HERE, stdio: 'inherit', env: { ...process.env, ...env } });
  p.on('close', (code) => resolve(code));
});

let failed = [];
for (const [key, ref] of BRANCHES) {
  const appDir = join(WT, key, 'bench/app');
  const { server, url } = await serve(appDir);
  console.log(`\n=== parity: ${ref} (${url}) ===`);
  const code = await run('npx', ['playwright', 'test', '--reporter=list'], { BENCH_URL: url });
  server.close();
  if (code !== 0) failed.push(ref);
}

if (failed.length) {
  console.error(`\nPARITY FAILED on: ${failed.join(', ')}`);
  console.error('The before/after comparison is void until this passes on both branches.');
  process.exit(1);
}
console.log('\nparity OK on both branches — behavior is identical, differences are presentational');
