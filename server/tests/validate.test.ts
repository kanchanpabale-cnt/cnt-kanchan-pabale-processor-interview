import { describe, it, expect } from 'vitest';
import { validateRow } from '../src/services/ingestion/validate';

describe('validateRow', () => {
  it('accepts a valid row', () => {
    const r = validateRow({
      cardNumber: '4267628872390355',
      timestamp: '2024-04-28T18:54:59.759901',
      amount: 399.06,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.cardType).toBe('VISA');
      expect(r.last4).toBe('0355');
    }
  });

  it('rejects unrecognized leading digit', () => {
    const r = validateRow({ cardNumber: '1234567890123456', timestamp: '2024-01-01', amount: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejectionReason).toBe('UNRECOGNIZED_TYPE');
  });

  it('rejects non-numeric PAN', () => {
    const r = validateRow({ cardNumber: 'abcd1234efgh5678', timestamp: '2024-01-01', amount: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejectionReason).toBe('NON_NUMERIC_PAN');
  });

  it('rejects invalid length', () => {
    const r = validateRow({ cardNumber: '4111', timestamp: '2024-01-01', amount: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejectionReason).toBe('INVALID_LENGTH');
  });

  it('rejects invalid timestamp', () => {
    const r = validateRow({ cardNumber: '4267628872390355', timestamp: 'not-a-date', amount: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejectionReason).toBe('INVALID_TIMESTAMP');
  });

  it('rejects invalid amount', () => {
    const r = validateRow({
      cardNumber: '4267628872390355',
      timestamp: '2024-01-01',
      amount: 'not-a-number',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejectionReason).toBe('INVALID_AMOUNT');
  });
});
