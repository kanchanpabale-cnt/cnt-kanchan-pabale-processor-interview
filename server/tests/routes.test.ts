import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    card: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    transaction: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    ingestionBatch: { count: vi.fn() },
    $queryRawUnsafe: vi.fn(),
  },
}));

import { prisma } from '../src/lib/prisma';
import { buildApp } from '../src/app';
import { signToken } from '../src/lib/jwt';

const app = buildApp();
const pmock = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
const adminToken = signToken({ sub: 'u1', email: 'a@b', role: 'ADMIN' });

beforeEach(() => {
  Object.values(pmock).forEach((m) =>
    Object.values(m).forEach((fn) => typeof fn === 'function' && fn.mockReset && fn.mockReset()),
  );
});

describe('app bootstrap', () => {
  it('/health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('auth routes', () => {
  it('401 on /auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('400 on /auth/login with bad body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x', password: '' });
    expect(res.status).toBe(400);
  });

  it('401 on /auth/login with wrong creds', async () => {
    pmock.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pw' });
    expect(res.status).toBe(401);
  });
});

describe('card routes', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/cards');
    expect(res.status).toBe(401);
  });

  it('returns empty paginated list', async () => {
    pmock.card.count.mockResolvedValue(0);
    pmock.card.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/cards').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('403 when analyst tries to create a card', async () => {
    const analystToken = signToken({ sub: 'u2', email: 'an@b', role: 'ANALYST' });
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        cardNumber: '4111111111111111',
        transactions: [{ amount: '10', timestamp: '2025-01-01T00:00:00Z' }],
      });
    expect(res.status).toBe(403);
  });

  it('400 with ValidationError on bad PAN', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardNumber: '1111',
        transactions: [{ amount: '10', timestamp: '2025-01-01T00:00:00Z' }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
