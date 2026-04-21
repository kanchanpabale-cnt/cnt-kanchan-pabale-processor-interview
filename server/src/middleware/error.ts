import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      details: err.flatten().fieldErrors,
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code ?? err.message, message: err.message });
  }
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({ error: 'InternalServerError' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'NotFound' });
}
