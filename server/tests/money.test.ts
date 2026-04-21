import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { formatMoney, sumDecimals, toDecimal } from '../src/utils/money';

describe('money helpers', () => {
  it('toDecimal accepts string, number, and Decimal', () => {
    expect(toDecimal('1.23').toFixed(2)).toBe('1.23');
    expect(toDecimal(5).toFixed(2)).toBe('5.00');
    expect(toDecimal(new Decimal(7)).toFixed(2)).toBe('7.00');
  });

  it('sumDecimals sums a mixed list with precision', () => {
    expect(sumDecimals(['0.1', '0.2', '0.3']).toFixed(2)).toBe('0.60');
    expect(sumDecimals([1, 2, 3]).toFixed(2)).toBe('6.00');
    expect(sumDecimals([]).toFixed(2)).toBe('0.00');
  });

  it('formatMoney produces 2-decimal strings', () => {
    expect(formatMoney('1.2')).toBe('1.20');
    expect(formatMoney(3)).toBe('3.00');
    expect(formatMoney(new Decimal(9.999))).toBe('10.00');
  });
});
