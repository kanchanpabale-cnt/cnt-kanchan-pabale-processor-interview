import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { cardRouter } from './routes/card.routes';
import { transactionRouter } from './routes/transaction.routes';
import { reportRouter } from './routes/report.routes';
import { publicRouter } from './routes/public.routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { requestTiming } from './middleware/requestTiming';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  // Record per-request durations so /api/public/showcase-stats can report a real P95.
  app.use(requestTiming);

  app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

  app.use('/api/public', publicRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/cards', cardRouter);
  app.use('/api/transactions', transactionRouter);
  app.use('/api/reports', reportRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
