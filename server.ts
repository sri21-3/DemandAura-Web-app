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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUpstreamWithRetry(
  targetUrl: string,
  fetchOptions: RequestInit,
  maxAttempts = 3
): Promise<{ status: number; bodyText: string; isJson: boolean }> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    try {
      const upstreamRes = await fetch(targetUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rawBody = await upstreamRes.text();
      const trimmed = rawBody.trim();

      // Detect if Render returned an HTML cold-start interstitial or gateway error page
      const looksLikeHtml =
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<!doctype') ||
        trimmed.startsWith('<html');

      let parsedOk = false;
      if (!looksLikeHtml && trimmed.length > 0) {
        try {
          JSON.parse(trimmed);
          parsedOk = true;
        } catch {
          parsedOk = false;
        }
      }

      if (
        (upstreamRes.status === 502 ||
          upstreamRes.status === 503 ||
          upstreamRes.status === 504 ||
          !parsedOk) &&
        attempt < maxAttempts
      ) {
        await delay(1500 * attempt);
        continue;
      }

      return {
        status: upstreamRes.status,
        bodyText: rawBody,
        isJson: parsedOk,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < maxAttempts) {
        await delay(1500 * attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Upstream request failed after retries');
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

    try {
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          Accept: 'application/json',
          ...(req.method !== 'GET' && req.method !== 'HEAD'
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const result = await fetchUpstreamWithRetry(targetUrl, fetchOptions, 3);

      if (!result.isJson) {
        res.status(503).json({
          detail:
            'DemandAura backend on Render is waking up from cold start. Please retry in a few seconds.',
        });
        return;
      }

      res.status(result.status);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(result.bodyText);
    } catch (error: unknown) {
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
