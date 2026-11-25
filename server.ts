import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.js';
import verifySessionHandler from './api/verify-session.js';
import adminVerifyHandler from './api/admin/verify.js';
import validateMessageHandler from './api/messages/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Server-side API routes (mirrors Vercel /api/* functions)
  app.all('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/verify-session', (req, res) => void verifySessionHandler(req, res));
  app.all('/api/admin/verify', (req, res) => void adminVerifyHandler(req, res));
  app.all('/api/messages/validate', (req, res) => void validateMessageHandler(req, res));

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HIRA server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HIRA server:', err);
  process.exit(1);
});
