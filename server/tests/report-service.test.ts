import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    card: { count: vi.fn(), findMany: vi.fn() },
    transaction: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    ingestionBatch: { count: vi.fn() },
    $queryRawUnsafe: vi.fn(),
  },
}));

import { prisma } from '../src/lib/prisma';
import * as reports from '../src/services/report.service';

const pmock = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>> & {
  $queryRawUnsafe: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  Object.values(pmock).forEach((m) => {
    if (typeof m === 'function') return;
    Object.values(m).forEach((fn) => typeof fn === 'function' && fn.mockReset && fn.mockReset());
  });
  (pmock.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockReset();
});

describe('reports.summary', () => {
  it('aggregates counts and total volume', async () => {
    pmock.card.count.mockResolvedValue(5);
    pmock.transaction.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(9) // accepted
      .mockResolvedValueOnce(1); // rejected
    pmock.ingestionBatch.count.mockResolvedValue(2);
    pmock.transaction.aggregate.mockResolvedValue({ _sum: { amount: new Decimal('1234.5') } });
    const r = await reports.summary();
    expect(r.cards).toBe(5);
    expect(r.transactions).toBe(10);
    expect(r.accepted).toBe(9);
    expect(r.rejected).toBe(1);
    expect(r.batches).toBe(2);
    expect(r.totalVolume).toBe('1234.50');
  });

  it('returns 0.00 volume when no accepted amount', async () => {
    pmock.card.count.mockResolvedValue(0);
    pmock.transaction.count.mockResolvedValue(0);
    pmock.ingestionBatch.count.mockResolvedValue(0);
    pmock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const r = await reports.summary();
    expect(r.totalVolume).toBe('0.00');
  });
});

describe('reports.byCard', () => {
  it('joins grouped totals with card metadata', async () => {
    pmock.transaction.groupBy.mockResolvedValue([
      { cardId: 'c1', _count: { _all: 3 }, _sum: { amount: new Decimal('300') } },
    ]);
    pmock.card.findMany.mockResolvedValue([
      {
        id: 'c1',
        cardNumber: '4111111111111111',
        last4: '1111',
        cardType: 'VISA',
        holderName: 'Jane',
      },
    ]);
    const r = await reports.byCard();
    expect(r[0].cardId).toBe('c1');
    expect(r[0].maskedNumber).toBe('**** **** **** 1111');
    expect(r[0].total).toBe('300.00');
    expect(r[0].count).toBe(3);
  });

  it('handles missing card metadata gracefully', async () => {
    pmock.transaction.groupBy.mockResolvedValue([
      { cardId: 'c1', _count: { _all: 0 }, _sum: { amount: null } },
    ]);
    pmock.card.findMany.mockResolvedValue([]);
    const r = await reports.byCard();
    expect(r[0].maskedNumber).toBeNull();
    expect(r[0].total).toBe('0.00');
  });
});

describe('reports.byCardType', () => {
  it('produces one row per card type with totals', async () => {
    pmock.transaction.aggregate
      .mockResolvedValueOnce({ _count: { _all: 2 }, _sum: { amount: new Decimal('100') } })
      .mockResolvedValueOnce({ _count: { _all: 3 }, _sum: { amount: new Decimal('200') } })
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amount: null } })
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amount: null } });
    const r = await reports.byCardType();
    expect(r).toHaveLength(4);
    expect(r.map((row) => row.cardType)).toEqual(['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER']);
    expect(r[0].total).toBe('100.00');
    expect(r[2].total).toBe('0.00');
  });
});

describe('reports.byDay', () => {
  it('bucketizes raw SQL results into date strings', async () => {
    pmock.$queryRawUnsafe.mockResolvedValue([
      { day: new Date('2025-03-14T00:00:00Z'), count: BigInt(2), total: '123.45' },
    ]);
    const r = await reports.byDay();
    expect(r[0].date).toBe('2025-03-14');
    expect(r[0].count).toBe(2);
    expect(r[0].total).toBe('123.45');
  });
});

describe('reports.rejected', () => {
  it('returns paginated rejected transactions with masked PANs', async () => {
    pmock.transaction.count.mockResolvedValue(1);
    pmock.transaction.findMany.mockResolvedValue([
      {
        id: 't1',
        rawCardNumber: '4111111111111111',
        timestamp: new Date(),
        amount: new Decimal('0'),
        rejectionReason: 'INVALID_AMOUNT',
        createdAt: new Date(),
        batchId: null,
      },
    ]);
    const r = await reports.rejected(1, 25);
    expect(r.total).toBe(1);
    expect(r.items[0].maskedNumber).toBe('**** **** **** 1111');
    expect(r.items[0].rejectionReason).toBe('INVALID_AMOUNT');
  });
});
