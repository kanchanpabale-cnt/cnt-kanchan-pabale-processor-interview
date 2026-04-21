import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    card: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
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
      },
      transaction: {
        create: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    })),
  },
}));

import { prisma } from '../src/lib/prisma';
import * as cardService from '../src/services/card.service';
import { HttpError } from '../src/middleware/error';

const prismaMock = prisma as unknown as {
  card: Record<string, ReturnType<typeof vi.fn>>;
};

beforeEach(() => {
  Object.values(prismaMock.card).forEach((m) => m.mockReset());
});

describe('card.service.listCards', () => {
  it('returns paginated card list', async () => {
    prismaMock.card.count.mockResolvedValue(1);
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: 'c1',
        cardNumber: '4111111111111111',
        last4: '1111',
        cardType: 'VISA',
        holderName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 3 },
      },
    ]);
    const r = await cardService.listCards({ page: 1, pageSize: 20 });
    expect(r.total).toBe(1);
    expect(r.items[0].maskedNumber).toBe('**** **** **** 1111');
    expect(r.items[0].transactionCount).toBe(3);
    // PAN never leaks
    expect(JSON.stringify(r)).not.toContain('4111111111111111');
  });

  it('filters by search query (last4, holderName)', async () => {
    prismaMock.card.count.mockResolvedValue(0);
    prismaMock.card.findMany.mockResolvedValue([]);
    await cardService.listCards({ page: 1, pageSize: 20, q: 'jane' });
    const call = prismaMock.card.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toHaveLength(2);
  });

  it('filters by cardType', async () => {
    prismaMock.card.count.mockResolvedValue(0);
    prismaMock.card.findMany.mockResolvedValue([]);
    await cardService.listCards({ page: 1, pageSize: 20, cardType: 'AMEX' });
    const call = prismaMock.card.findMany.mock.calls[0][0];
    expect(call.where.cardType).toBe('AMEX');
  });
});

describe('card.service.getCard', () => {
  it('throws 404 when not found', async () => {
    prismaMock.card.findUnique.mockResolvedValue(null);
    await expect(cardService.getCard('missing')).rejects.toBeInstanceOf(HttpError);
    await expect(cardService.getCard('missing')).rejects.toMatchObject({ status: 404 });
  });

  it('returns masked card on hit', async () => {
    prismaMock.card.findUnique.mockResolvedValue({
      id: 'c1',
      cardNumber: '4111111111111111',
      last4: '1111',
      cardType: 'VISA',
      holderName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { transactions: 2 },
    });
    const r = await cardService.getCard('c1');
    expect(r.maskedNumber).toBe('**** **** **** 1111');
    expect(r.transactionCount).toBe(2);
  });
});

describe('card.service.createCard', () => {
  it('rejects unknown card type (leading digit other than 3-6)', async () => {
    await expect(
      cardService.createCard({
        cardNumber: '1111111111111111',
        transactions: [{ amount: '10', timestamp: new Date().toISOString() }],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects when card already exists', async () => {
    prismaMock.card.findUnique.mockResolvedValue({ id: 'c0' });
    await expect(
      cardService.createCard({
        cardNumber: '4111111111111111',
        transactions: [{ amount: '10', timestamp: new Date().toISOString() }],
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('card.service.deleteCard', () => {
  it('404s when missing', async () => {
    prismaMock.card.findUnique.mockResolvedValue(null);
    await expect(cardService.deleteCard('x')).rejects.toMatchObject({ status: 404 });
  });
  it('calls delete when present', async () => {
    prismaMock.card.findUnique.mockResolvedValue({ id: 'c1' });
    prismaMock.card.delete.mockResolvedValue({});
    await cardService.deleteCard('c1');
    expect(prismaMock.card.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
