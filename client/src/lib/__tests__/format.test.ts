import {
  cardTypeLabel,
  formatDate,
  formatDateTime,
  formatMoney,
} from '../format';

describe('format helpers', () => {
  describe('formatMoney', () => {
    it('formats numbers as USD currency', () => {
      expect(formatMoney(0)).toBe('$0.00');
      expect(formatMoney(1234.5)).toBe('$1,234.50');
      expect(formatMoney(-50)).toBe('-$50.00');
    });
    it('accepts numeric strings', () => {
      expect(formatMoney('99.99')).toBe('$99.99');
    });
    it('respects the currency override', () => {
      expect(formatMoney(10, 'EUR')).toBe('€10.00');
    });
  });

  describe('formatDate', () => {
    it('returns a Mon DD, YYYY string', () => {
      expect(formatDate('2025-03-14T12:00:00Z')).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 2025$/);
    });
  });

  describe('formatDateTime', () => {
    it('includes month, day, year, and time', () => {
      const out = formatDateTime('2025-03-14T12:00:00Z');
      expect(out).toMatch(/2025/);
      expect(out).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('cardTypeLabel', () => {
    it('maps each enum to a human label', () => {
      expect(cardTypeLabel('AMEX')).toBe('American Express');
      expect(cardTypeLabel('VISA')).toBe('Visa');
      expect(cardTypeLabel('MASTERCARD')).toBe('MasterCard');
      expect(cardTypeLabel('DISCOVER')).toBe('Discover');
    });
    it('passes through unknown values', () => {
      expect(cardTypeLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
