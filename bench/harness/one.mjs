// Ad-hoc single-directory parity runner, for testing one branch's app in place.
import { serve } from './server.mjs';
import { spawn } from 'node:child_process';
const { server, url } = await serve(process.argv[2]);
const code = await new Promise(r => spawn('npx', ['playwright','test','--reporter=line'],
  { cwd: process.cwd(), stdio: 'inherit', env: { ...process.env, BENCH_URL: url } })
  .on('close', r));
server.close(); process.exit(code ?? 1);
