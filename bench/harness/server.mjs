// Minimal static server. Avoids a dependency and keeps the bench self-contained.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export function serve(root, port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let p = normalize(decodeURIComponent(url.pathname));
      if (p.endsWith('/')) p += 'index.html';
      // Contain path traversal to root.
      const file = join(root, p);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      }).end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () =>
      resolve({ server, port: server.address().port,
                url: `http://127.0.0.1:${server.address().port}` }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] ?? '../app';
  const { url } = await serve(new URL(root, import.meta.url).pathname, 8099);
  console.log(`serving ${root} at ${url}`);
}
