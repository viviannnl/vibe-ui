// Builds randomized A/B screenshot pairs for human judgment, with the answer key in a
// separate file. The automated metrics say nothing about aesthetics; this is the only
// part of the bench that can.
import { mkdir, copyFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCREENS = resolve(HERE, '../results/screens');
const OUT = resolve(HERE, '../results/blind');

const shots = await readdir(join(SCREENS, 'baseline'));
await mkdir(OUT, { recursive: true });

const key = [];
for (const shot of shots.filter(f => f.endsWith('.png'))) {
  // Randomize which branch is A per comparison, so order carries no information.
  const flip = randomInt(2) === 1;
  const [A, B] = flip ? ['styled', 'baseline'] : ['baseline', 'styled'];
  const stem = shot.replace(/\.png$/, '');
  await copyFile(join(SCREENS, A, shot), join(OUT, `${stem}__A.png`));
  await copyFile(join(SCREENS, B, shot), join(OUT, `${stem}__B.png`));
  key.push({ comparison: stem, A, B });
}

await writeFile(join(OUT, '../blind-key.json'), JSON.stringify(key, null, 2));
await writeFile(join(OUT, 'HOW-TO.md'), `# Blind comparison

${key.length} pairs in this directory, named \`<comparison>__A.png\` / \`__B.png\`.
Which branch is A was randomized per comparison.

Look at each pair and note whether you prefer A or B, without looking at the key.
Then check \`../blind-key.json\`.

Worth recording per pair: which you preferred, and one sentence on why. The "why" is
more useful than the tally — it's the only signal here about *what* changed perceptually,
and it can contradict the automated metrics.
`);

console.log(`wrote ${key.length} blind pairs to ${OUT}`);
console.log(`answer key: ${resolve(OUT, '../blind-key.json')} — don't open it first`);
