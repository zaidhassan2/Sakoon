import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import chat from '../api/chat.js';
import health from '../api/health.js';
import { send, errorBody } from '../lib/http.js';
const root = resolve('public');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
export function createServer(chatHandler = chat) {
 return http.createServer(async (req, res) => {
  try {
   const path = new URL(req.url, 'http://localhost').pathname;
   if (path === '/api/chat') return await chatHandler(req, res);
   if (path === '/api/health') return health(req, res);
   const file = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
   if (!file.startsWith(root + '/') || req.method !== 'GET') { res.statusCode = 404; return res.end(); }
   try { const data = await readFile(file); res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream'); res.end(data); }
   catch { res.statusCode = 404; res.end(); }
  } catch { send(res, 400, errorBody('bad_request')); }
 });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 const port = Number(process.env.PORT || 3000);
 createServer().listen(port, '127.0.0.1', () => console.info(`Sukoon local server: http://localhost:${port}`));
}
