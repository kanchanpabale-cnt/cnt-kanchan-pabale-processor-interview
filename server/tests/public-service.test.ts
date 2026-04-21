import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    transaction: { count: vi.fn(), aggregate: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma';
import { showcaseStats } from '../src/services/public.service';
import {
  __resetTiming,
  recordDuration,
  getP95LatencyMs,
  getSampleCount,
} from '../src/middleware/requestTiming';

const pmock = prisma as unknown as {
  transaction: { count: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  pmock.transaction.count.mockReset();
  pmock.transaction.aggregate.mockReset();
  __resetTiming();
});

describe('showcaseStats', () => {
  it('returns zero volume and null approval rate when the DB is empty', async () => {
    pmock.transaction.count.mockResolvedValue(0);
    pmock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const r = await showcaseStats();
    expect(r.authorizedVolume).toBe('0.00');
    expect(r.approvalRate).toBeNull();
    expect(r.transactionCount).toBe(0);
  });

  it('computes approval rate and volume from counts + sum', async () => {
    pmock.transaction.count
      .mockResolvedValueOnce(98) // accepted
      .mockResolvedValueOnce(2); // rejected
    pmock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: new Decimal('4820000') },
    });
    const r = await showcaseStats();
    expect(r.authorizedVolume).toBe('4820000.00');
    expect(r.approvalRate).toBeCloseTo(98, 5);
    expect(r.transactionCount).toBe(100);
  });

  it('reports null P95 until enough samples are collected', async () => {
    pmock.transaction.count.mockResolvedValue(0);
    pmock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
    recordDuration(10);
    recordDuration(20);
    const r = await showcaseStats();
    expect(r.p95LatencyMs).toBeNull();
  });

  it('reports a P95 once the sample threshold is reached', async () => {
    pmock.transaction.count.mockResolvedValue(0);
    pmock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
    for (let i = 1; i <= 20; i++) recordDuration(i * 10); // 10..200ms
    const r = await showcaseStats();
    expect(r.p95LatencyMs).not.toBeNull();
    expect(r.p95LatencyMs!).toBeGreaterThanOrEqual(100);
  });
});

describe('requestTiming ring buffer', () => {
  it('caps at the fixed window size', () => {
    for (let i = 0; i < 750; i++) recordDuration(i);
    expect(getSampleCount()).toBe(500);
    // Oldest samples evicted: P95 is still computed from the latest window.
    expect(getP95LatencyMs()).not.toBeNull();
  });
});
