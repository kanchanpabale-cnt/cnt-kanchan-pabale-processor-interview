import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    transaction: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma';
import * as txService from '../src/services/transaction.service';

const pmock = prisma as unknown as {
  transaction: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  pmock.transaction.count.mockReset();
  pmock.transaction.findMany.mockReset();
});

describe('transactionService.listTransactions', () => {
  it('returns paginated list with masked PANs and amount serialization', async () => {
    pmock.transaction.count.mockResolvedValue(1);
    pmock.transaction.findMany.mockResolvedValue([
      {
        id: 't1',
        rawCardNumber: '4111111111111111',
        timestamp: new Date(),
        amount: new Decimal('123.456'),
        status: 'ACCEPTED',
        rejectionReason: null,
        batchId: null,
        card: { id: 'c1', last4: '1111', cardType: 'VISA' },
      },
    ]);
    const r = await txService.listTransactions({ page: 1, pageSize: 25 });
    expect(r.total).toBe(1);
    expect(r.items[0].maskedNumber).toBe('**** **** **** 1111');
    expect(r.items[0].amount).toBe('123.46');
    expect(JSON.stringify(r)).not.toContain('4111111111111111');
  });

  it('builds filter where clauses for every knob', async () => {
    pmock.transaction.count.mockResolvedValue(0);
    pmock.transaction.findMany.mockResolvedValue([]);
    await txService.listTransactions({
      page: 1,
      pageSize: 25,
      status: 'REJECTED',
      cardId: 'c1',
      from: '2025-01-01T00:00:00Z',
      to: '2025-02-01T00:00:00Z',
    });
    const call = pmock.transaction.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('REJECTED');
    expect(call.where.cardId).toBe('c1');
    expect(call.where.timestamp.gte).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(call.where.timestamp.lte).toEqual(new Date('2025-02-01T00:00:00Z'));
  });

  it('passes null card when transaction has none', async () => {
    pmock.transaction.count.mockResolvedValue(1);
    pmock.transaction.findMany.mockResolvedValue([
      {
        id: 't1',
        rawCardNumber: '4111111111111111',
        timestamp: new Date(),
        amount: new Decimal('1'),
        status: 'REJECTED',
        rejectionReason: 'INVALID_AMOUNT',
        batchId: null,
        card: null,
      },
    ]);
    const r = await txService.listTransactions({ page: 1, pageSize: 25 });
    expect(r.items[0].card).toBeNull();
  });
});
