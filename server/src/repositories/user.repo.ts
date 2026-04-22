import { prisma } from '../lib/prisma';
import type { Db } from './types';

/**
 * Looks up a user by email including the `passwordHash` field — used only by
 * the auth flow. Never expose this return shape to API responses.
 */
export function findByEmailWithHash(email: string, db: Db = prisma) {
  return db.user.findUnique({ where: { email } });
}

/**
 * Returns the public-safe profile fields for a user. Intentionally omits
 * `passwordHash` via `select`, so callers can't accidentally leak it.
 */
export function findProfileById(id: string, db: Db = prisma) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}
