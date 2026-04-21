import { NextFunction, Request, Response } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { HttpError } from './error';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing or malformed Authorization header', 'Unauthorized'));
  }
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired token', 'Unauthorized'));
  }
}

export function requireRole(...roles: Array<'ADMIN' | 'ANALYST'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated', 'Unauthorized'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Insufficient permissions', 'Forbidden'));
    }
    return next();
  };
}
