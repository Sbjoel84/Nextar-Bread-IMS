import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api';
import { dbManager } from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Request parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static assets from public
  app.use(express.static(path.resolve(__dirname, 'public')));

  // REST API Routes under /api/v1
  app.use('/api/v1', apiRouter);

  // Health-check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'Nextar Bread Bakery ERP',
      location: 'Kubwa, Abuja, Nigeria',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  if (!isProd) {
    // Development mode with Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    // Listens on all interfaces; 0.0.0.0 itself is not browsable, so print a usable local URL
    console.log(`[Nextar ERP] Server active on http://localhost:${PORT}`);
    console.log(`[Nextar ERP] API available at http://localhost:${PORT}/api/v1`);
  });
}

startServer().catch(err => {
  console.error('[Nextar ERP] Failed to launch server:', err);
  process.exit(1);
});
