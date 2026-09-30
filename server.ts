import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawServerEnvUrl = (process.env.VITE_API_BASE_URL || '').trim();
const DEFAULT_UPSTREAM_BASE = (
  !rawServerEnvUrl || rawServerEnvUrl.includes('nexusdemand.onrender.com')
    ? 'https://demandaura.onrender.com'
    : rawServerEnvUrl
).replace(/\/+$/, '');

function resolveUpstreamBase(req: Request): string {
  const headerBase = req.headers['x-upstream-api-base'];
  if (
    typeof headerBase === 'string' &&
    headerBase.startsWith('https://') &&
    !headerBase.includes('nexusdemand.onrender.com')
  ) {
    return headerBase.replace(/\/+$/, '');
  }
  return DEFAULT_UPSTREAM_BASE;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Lightweight healthcheck endpoint for container readiness probes
  app.get('/api/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Proxy gateway to the deployed FastAPI backend on Render (https://demandaura.onrender.com)
  app.use('/api/ml', async (req: Request, res: Response) => {
    const upstreamBase = resolveUpstreamBase(req);
    const subPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
    const targetUrl = `${upstreamBase}${subPath}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          Accept: 'application/json',
          ...(req.method !== 'GET' && req.method !== 'HEAD'
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
        signal: controller.signal,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const upstreamRes = await fetch(targetUrl, fetchOptions);
      clearTimeout(timeoutId);

      const contentType = upstreamRes.headers.get('content-type') || '';
      const rawBody = await upstreamRes.text();

      res.status(upstreamRes.status);
      if (contentType.includes('application/json')) {
        res.setHeader('Content-Type', 'application/json');
        res.send(rawBody);
      } else {
        res.send(rawBody);
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const message =
        error instanceof Error ? error.message : 'Upstream request failed';
      res.status(502).json({
        detail: `Failed to reach DemandAura backend (${upstreamBase}): ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
