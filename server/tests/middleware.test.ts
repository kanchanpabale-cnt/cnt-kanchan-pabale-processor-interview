import { describe, it, expect, vi } from 'vitest';
import { ZodError, z } from 'zod';
import type { Request, Response } from 'express';
import { HttpError, errorHandler, notFoundHandler } from '../src/middleware/error';
import { requireAuth, requireRole } from '../src/middleware/auth';
import { signToken } from '../src/lib/jwt';

function mockRes() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const send = vi.fn().mockReturnThis();
  return { status, json, send } as unknown as Response;
}

describe('error middleware', () => {
  it('returns 400 for ZodError with field details', () => {
    const schema = z.object({ email: z.string().email() });
    let zerr: ZodError | null = null;
    try {
      schema.parse({ email: 'nope' });
    } catch (e) {
      zerr = e as ZodError;
    }
    const res = mockRes();
    errorHandler(zerr, {} as Request, res, vi.fn());
    expect((res.status as unknown as jest.Mock).mock.calls[0][0]).toBe(400);
  });

  it('returns HttpError status + code', () => {
    const res = mockRes();
    const err = new HttpError(403, 'Nope', 'Forbidden');
    errorHandler(err, {} as Request, res, vi.fn());
    expect((res.status as unknown as jest.Mock).mock.calls[0][0]).toBe(403);
  });

  it('returns 500 for unknown errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), {} as Request, res, vi.fn());
    expect((res.status as unknown as jest.Mock).mock.calls[0][0]).toBe(500);
  });

  it('notFoundHandler returns 404', () => {
    const res = mockRes();
    notFoundHandler({} as Request, res);
    expect((res.status as unknown as jest.Mock).mock.calls[0][0]).toBe(404);
  });
});

describe('auth middleware', () => {
  it('requireAuth rejects missing Authorization', () => {
    const next = vi.fn();
    requireAuth({ headers: {} } as Request, mockRes(), next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('requireAuth rejects malformed header', () => {
    const next = vi.fn();
    requireAuth(
      { headers: { authorization: 'Bogus' } } as unknown as Request,
      mockRes(),
      next,
    );
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('requireAuth rejects invalid token', () => {
    const next = vi.fn();
    requireAuth(
      { headers: { authorization: 'Bearer not-a-token' } } as unknown as Request,
      mockRes(),
      next,
    );
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('requireAuth attaches req.user for valid token', () => {
    const token = signToken({ sub: 'u1', email: 'a@b', role: 'ADMIN' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request & { user?: unknown };
    const next = vi.fn();
    requireAuth(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ sub: 'u1', role: 'ADMIN' });
  });

  it('requireRole returns 401 without user', () => {
    const next = vi.fn();
    requireRole('ADMIN')({} as Request, mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('requireRole returns 403 with wrong role', () => {
    const req = { user: { sub: 'u1', email: 'a@b', role: 'ANALYST' } } as unknown as Request;
    const next = vi.fn();
    requireRole('ADMIN')(req, mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });

  it('requireRole passes with matching role', () => {
    const req = { user: { sub: 'u1', email: 'a@b', role: 'ADMIN' } } as unknown as Request;
    const next = vi.fn();
    requireRole('ADMIN')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
