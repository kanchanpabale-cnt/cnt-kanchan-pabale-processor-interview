import { describe, it, expect } from 'vitest';
import { detectCardType } from '../src/utils/cardType';

describe('detectCardType', () => {
  it('identifies each supported type by leading digit', () => {
    expect(detectCardType('3336208249795480')).toBe('AMEX');
    expect(detectCardType('4267628872390355')).toBe('VISA');
    expect(detectCardType('5553959204036891')).toBe('MASTERCARD');
    expect(detectCardType('6714744990978278')).toBe('DISCOVER');
  });

  it('rejects unknown leading digits', () => {
    expect(detectCardType('1234567890123456')).toBeNull();
    expect(detectCardType('7234567890123456')).toBeNull();
    expect(detectCardType('0000000000000000')).toBeNull();
    expect(detectCardType('')).toBeNull();
  });
});
