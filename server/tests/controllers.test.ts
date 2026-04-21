import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    card: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    ingestionBatch: { count: vi.fn() },
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        card: {
          create: vi.fn().mockResolvedValue({
            id: 'c1',
            cardNumber: '4111111111111111',
            last4: '1111',
            cardType: 'VISA',
            holderName: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          update: vi.fn().mockResolvedValue({
            id: 'c1',
            cardNumber: '4111111111111111',
            last4: '1111',
            cardType: 'VISA',
            holderName: 'Jane',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          upsert: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        transaction: {
          create: vi.fn(),
          createMany: vi.fn(),
        },
        // ingestion pipeline also upserts cards and reads them back
        cardUpsertStub: vi.fn(),
        ingestionBatch: {
          create: vi.fn().mockResolvedValue({
            id: 'b1',
            filename: 'x.csv',
            format: 'csv',
            totalRows: 0,
            acceptedRows: 0,
            rejectedRows: 0,
            uploadedById: 'u1',
            createdAt: new Date(),
          }),
        },
      }),
    ),
  },
}));

import { prisma } from '../src/lib/prisma';
import { buildApp } from '../src/app';
import { signToken } from '../src/lib/jwt';

const app = buildApp();
const pmock = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>> & {
  $queryRawUnsafe: ReturnType<typeof vi.fn>;
};
const adminToken = signToken({ sub: 'u1', email: 'a@b', role: 'ADMIN' });

beforeEach(() => {
  Object.values(pmock).forEach((m) => {
    if (typeof m === 'function') return;
    Object.values(m).forEach((fn) => typeof fn === 'function' && fn.mockReset && fn.mockReset());
  });
  (pmock.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockReset();
});

describe('card controller', () => {
  it('GET /api/cards/:id returns 404 for missing card', async () => {
    pmock.card.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/cards/missing')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/cards/:id returns masked card on success', async () => {
    pmock.card.findUnique.mockResolvedValue({
      id: 'c1',
      cardNumber: '4111111111111111',
      last4: '1111',
      cardType: 'VISA',
      holderName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { transactions: 2 },
    });
    const res = await request(app)
      .get('/api/cards/c1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.maskedNumber).toBe('**** **** **** 1111');
  });

  it('PUT /api/cards/:id 404s when missing', async () => {
    pmock.card.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/cards/missing')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ holderName: 'X' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/cards/:id updates holder', async () => {
    pmock.card.findUnique.mockResolvedValue({
      id: 'c1',
      cardNumber: '4111111111111111',
      last4: '1111',
      cardType: 'VISA',
    });
    const res = await request(app)
      .put('/api/cards/c1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ holderName: 'Jane' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/cards/:id 404s when missing', async () => {
    pmock.card.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/cards/missing')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('DELETE /api/cards/:id succeeds with 204', async () => {
    pmock.card.findUnique.mockResolvedValue({ id: 'c1' });
    pmock.card.delete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/cards/c1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});

describe('transaction controller', () => {
  it('GET /api/transactions returns a paginated list', async () => {
    pmock.transaction.count.mockResolvedValue(0);
    pmock.transaction.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('POST /api/transactions/upload 400 without file', async () => {
    const res = await request(app)
      .post('/api/transactions/upload')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('POST /api/transactions/upload 400 for unsupported extension', async () => {
    const res = await request(app)
      .post('/api/transactions/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('hello'), 'bad.txt');
    expect(res.status).toBe(400);
  });

  it('POST /api/transactions/upload ingests a CSV into a batch', async () => {
    const res = await request(app)
      .post('/api/transactions/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('cardNumber,timestamp,amount\n'), 'empty.csv');
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('b1');
  });
});

describe('report controller', () => {
  it('GET /api/reports/summary', async () => {
    pmock.card.count.mockResolvedValue(0);
    pmock.transaction.count.mockResolvedValue(0);
    pmock.ingestionBatch.count.mockResolvedValue(0);
    pmock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalVolume).toBe('0.00');
  });

  it('GET /api/reports/by-card', async () => {
    pmock.transaction.groupBy.mockResolvedValue([]);
    pmock.card.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/reports/by-card')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/reports/by-card-type', async () => {
    pmock.transaction.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { amount: null },
    });
    const res = await request(app)
      .get('/api/reports/by-card-type')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  it('GET /api/reports/by-day', async () => {
    (pmock.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await request(app)
      .get('/api/reports/by-day')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/reports/rejected', async () => {
    pmock.transaction.count.mockResolvedValue(0);
    pmock.transaction.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/reports/rejected')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('GET /api/reports/rejected rejects invalid page', async () => {
    const res = await request(app)
      .get('/api/reports/rejected?page=0')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});

describe('auth controller', () => {
  it('POST /api/auth/logout returns ok', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/auth/me returns the user profile', async () => {
    pmock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b',
      name: 'A',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b');
  });
});
