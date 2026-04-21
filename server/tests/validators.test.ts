import { describe, it, expect } from 'vitest';
import { loginSchema } from '../src/validators/auth';
import { createCardSchema, updateCardSchema, listCardsQuerySchema } from '../src/validators/card';
import { listTransactionsQuerySchema } from '../src/validators/transaction';
import { rejectedListQuerySchema } from '../src/validators/report';

describe('auth validator', () => {
  it('accepts valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'pw' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'x', password: 'pw' }).success).toBe(false);
  });
  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('card validators', () => {
  const goodTxn = { amount: '100', timestamp: '2025-01-01T00:00:00Z' };

  describe('createCardSchema', () => {
    it('accepts valid 16-digit Visa + transactions', () => {
      const r = createCardSchema.safeParse({
        cardNumber: '4111111111111111',
        transactions: [goodTxn],
      });
      expect(r.success).toBe(true);
    });
    it('accepts valid 15-digit Amex', () => {
      const r = createCardSchema.safeParse({
        cardNumber: '371449635398431',
        transactions: [goodTxn],
      });
      expect(r.success).toBe(true);
    });
    it('strips spaces from card number', () => {
      const r = createCardSchema.safeParse({
        cardNumber: '4111 1111 1111 1111',
        transactions: [goodTxn],
      });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.cardNumber).toBe('4111111111111111');
    });
    it('rejects wrong-length PAN', () => {
      expect(
        createCardSchema.safeParse({ cardNumber: '4111', transactions: [goodTxn] }).success,
      ).toBe(false);
    });
    it('rejects 16-digit starting with 3 (Amex mismatch)', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '3111111111111111',
          transactions: [goodTxn],
        }).success,
      ).toBe(false);
    });
    it('rejects non-digit characters', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '411a111111111111',
          transactions: [goodTxn],
        }).success,
      ).toBe(false);
    });
    it('rejects leading digit outside {3,4,5,6}', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '1111111111111111',
          transactions: [goodTxn],
        }).success,
      ).toBe(false);
    });
    it('requires at least one transaction', () => {
      expect(
        createCardSchema.safeParse({ cardNumber: '4111111111111111', transactions: [] }).success,
      ).toBe(false);
    });
    it('caps transactions at 50', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '4111111111111111',
          transactions: Array.from({ length: 51 }, () => goodTxn),
        }).success,
      ).toBe(false);
    });
    it('rejects zero amount', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '4111111111111111',
          transactions: [{ amount: '0', timestamp: '2025-01-01' }],
        }).success,
      ).toBe(false);
    });
    it('rejects amount >= 100k (magnitude)', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '4111111111111111',
          transactions: [{ amount: '100000', timestamp: '2025-01-01' }],
        }).success,
      ).toBe(false);
    });
    it('rejects invalid timestamp', () => {
      expect(
        createCardSchema.safeParse({
          cardNumber: '4111111111111111',
          transactions: [{ amount: '5', timestamp: 'not-a-date' }],
        }).success,
      ).toBe(false);
    });
    it('accepts empty holderName', () => {
      const r = createCardSchema.safeParse({
        cardNumber: '4111111111111111',
        holderName: '',
        transactions: [goodTxn],
      });
      expect(r.success).toBe(true);
    });
  });

  describe('updateCardSchema', () => {
    it('accepts holder only', () => {
      expect(updateCardSchema.safeParse({ holderName: 'Jane' }).success).toBe(true);
    });
    it('accepts amount + timestamp together', () => {
      expect(
        updateCardSchema.safeParse({
          amount: '50',
          timestamp: '2025-01-01T00:00:00Z',
        }).success,
      ).toBe(true);
    });
    it('rejects amount without timestamp', () => {
      expect(updateCardSchema.safeParse({ amount: '50' }).success).toBe(false);
    });
    it('rejects timestamp without amount', () => {
      expect(
        updateCardSchema.safeParse({ timestamp: '2025-01-01T00:00:00Z' }).success,
      ).toBe(false);
    });
    it('allows null holderName', () => {
      expect(updateCardSchema.safeParse({ holderName: null }).success).toBe(true);
    });
  });

  describe('listCardsQuerySchema', () => {
    it('fills in defaults from empty query', () => {
      const r = listCardsQuerySchema.parse({});
      expect(r.page).toBe(1);
      expect(r.pageSize).toBe(20);
    });
    it('coerces numeric strings', () => {
      const r = listCardsQuerySchema.parse({ page: '3', pageSize: '50' });
      expect(r.page).toBe(3);
      expect(r.pageSize).toBe(50);
    });
    it('rejects out-of-range pageSize', () => {
      expect(listCardsQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    });
    it('accepts known card types', () => {
      expect(listCardsQuerySchema.safeParse({ cardType: 'VISA' }).success).toBe(true);
      expect(listCardsQuerySchema.safeParse({ cardType: 'UNKNOWN' }).success).toBe(false);
    });
  });
});

describe('transaction validator', () => {
  it('fills defaults for empty query', () => {
    const r = listTransactionsQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(25);
  });
  it('accepts full filter set', () => {
    expect(
      listTransactionsQuerySchema.safeParse({
        status: 'ACCEPTED',
        cardId: 'c1',
        cardType: 'VISA',
        from: '2025-01-01T00:00:00Z',
        to: '2025-02-01T00:00:00Z',
        minAmount: '10',
        maxAmount: '100',
      }).success,
    ).toBe(true);
  });
  it('rejects bad status enum', () => {
    expect(listTransactionsQuerySchema.safeParse({ status: 'BOGUS' }).success).toBe(false);
  });
  it('rejects non-numeric min/max', () => {
    expect(listTransactionsQuerySchema.safeParse({ minAmount: 'abc' }).success).toBe(false);
  });
});

describe('report validator', () => {
  it('defaults', () => {
    const r = rejectedListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(25);
  });
  it('rejects pageSize above 100', () => {
    expect(rejectedListQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
  });
});
