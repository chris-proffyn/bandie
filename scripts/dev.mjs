import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import net from 'node:net';

const PROXY_PORT = 5173;
const VITE_PORT = 5174;
const FUNCTIONS_PORT = 9999;

const API_PREFIX = '/api/';
const FUNCTION_ROUTES = new Map([
  ['/api/integrations/dropbox/connect', '/.netlify/functions/dropbox-connect'],
  ['/api/integrations/dropbox/callback', '/.netlify/functions/dropbox-callback'],
  ['/api/integrations/dropbox/disconnect', '/.netlify/functions/dropbox-disconnect'],
  ['/api/bands/song-part-storage/dropbox/setup', '/.netlify/functions/band-song-part-storage-setup'],
  ['/api/bands/song-part-storage/dropbox/health', '/.netlify/functions/band-song-part-storage-health'],
]);

function startProcess(command, args, label) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
    shell: process.platform === 'win32',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`[dev] ${label} stopped (${signal})`);
    } else if (code && code !== 0) {
      console.error(`[dev] ${label} exited with code ${code}`);
    }
    shutdown(code ?? 0);
  });

  return child;
}

const children = [];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

children.push(
  startProcess('npm', ['run', 'dev', '--workspace=@bandie/web', '--', '--port', String(VITE_PORT)], 'vite'),
  startProcess(
    'npx',
    ['netlify', 'functions:serve', '--filter', '@bandie/web', '--port', String(FUNCTIONS_PORT)],
    'functions',
  ),
);

function waitForPort(port, attempts = 120) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;

    const check = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        remaining -= 1;
        if (remaining <= 0) {
          reject(new Error(`Timed out waiting for port ${port}`));
          return;
        }
        setTimeout(check, 250);
      });
    };

    check();
  });
}

async function startProxy() {
  await Promise.all([waitForPort(VITE_PORT), waitForPort(FUNCTIONS_PORT)]);

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const functionPath = FUNCTION_ROUTES.get(url.pathname);

    if (functionPath && req.method) {
      const proxyReq = httpRequest(
        {
          host: '127.0.0.1',
          port: FUNCTIONS_PORT,
          path: `${functionPath}${url.search}`,
          method: req.method,
          headers: req.headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on('error', (error) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      });

      req.pipe(proxyReq);
      return;
    }

    if (url.pathname.startsWith(API_PREFIX)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API route not found.' }));
      return;
    }

    const proxyReq = httpRequest(
      {
        host: '127.0.0.1',
        port: VITE_PORT,
        path: `${url.pathname}${url.search}`,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${VITE_PORT}`,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (error) => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Vite proxy error: ${error.message}`);
    });

    req.pipe(proxyReq);
  });

  server.listen(PROXY_PORT, '127.0.0.1', () => {
    console.log('');
    console.log(`  Bandie dev server ready: http://localhost:${PROXY_PORT}/`);
    console.log('  (Vite + API functions on one port)');
    console.log('');
  });
}

startProxy().catch((error) => {
  console.error('[dev] Failed to start:', error.message);
  shutdown(1);
});
