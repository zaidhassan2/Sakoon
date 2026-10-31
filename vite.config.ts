import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
// @ts-ignore
import {evaluateMockScenario} from './public/js/mock-api.js';

function sukoonStaticAndApiPlugin() {
  return {
    name: 'sukoon-static-and-api',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = (req.url || '/').split('?')[0];

        if (req.method === 'GET' && url === '/api/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ok: true}));
          return;
        }

        if (req.method === 'POST' && url === '/api/chat') {
          let raw = '';
          req.on('data', (chunk: any) => {
            raw += chunk;
          });
          req.on('end', () => {
            let payload = {};
            try {
              payload = JSON.parse(raw || '{}');
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  error: {
                    code: 'bad_request',
                    message: 'Invalid JSON request body',
                    retryAfterSeconds: null,
                  },
                })
              );
              return;
            }

            const result = evaluateMockScenario(payload);
            setTimeout(() => {
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(result.body));
            }, result.delayMs);
          });
          return;
        }

        if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
          const publicHtml = path.resolve(__dirname, 'public/index.html');
          if (fs.existsSync(publicHtml)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(publicHtml, 'utf-8'));
            return;
          }
        }

        next();
      });
    },
    closeBundle() {
      const publicIndex = path.resolve(__dirname, 'public/index.html');
      const distIndex = path.resolve(__dirname, 'dist/index.html');
      if (fs.existsSync(publicIndex) && fs.existsSync(path.resolve(__dirname, 'dist'))) {
        fs.copyFileSync(publicIndex, distIndex);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [sukoonStaticAndApiPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
