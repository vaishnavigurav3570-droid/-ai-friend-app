// ============================================
// Antigravity Backend — Express Server Entry Point
// ============================================

import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errors.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { rateLimit } from './middleware/rateLimit.js';
import { authRoutes } from './routes/auth.routes.js';
import { taskRoutes } from './routes/tasks.routes.js';
import { tokenRoutes } from './routes/tokens.routes.js';
import { vaultRoutes } from './routes/vault.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { habitRoutes } from './routes/habits.routes.js';
import { calendarRoutes } from './routes/calendar.routes.js';
import { voiceRoutes } from './routes/voice.routes.js';
import { shieldRoutes } from './routes/shield.routes.js';

const app = express();

// ---- Global Middleware ----
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://antigravity.app']
    : true,
  credentials: true,
}));
app.use(morgan('short', {
  stream: { write: (msg: string) => logger.info(msg.trim()) },
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit(200, 60_000)); // 200 req/min global

// ---- Health Check ----
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/tokens', authMiddleware, tokenRoutes);
app.use('/api/vault', authMiddleware, vaultRoutes);
app.use('/api/ai', authMiddleware, rateLimit(30, 60_000), aiRoutes);
app.use('/api/habits', authMiddleware, habitRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/voice', authMiddleware, voiceRoutes);
app.use('/api/shield', shieldRoutes); // No auth needed — local system operation

// ---- Static File Serving (React Frontend Integration) ----
const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));

// ---- SPA Router Fallback ----
app.get('*', (req, res, next) => {
  // If requesting an API route, defer to the 404 handler
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ---- Global Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Antigravity API running on port ${env.PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
});

// ---- Graceful Shutdown ----
function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
