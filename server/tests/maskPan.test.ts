import { describe, it, expect } from 'vitest';
import { maskPan, getLast4 } from '../src/utils/maskPan';

describe('maskPan', () => {
  it('masks all but last 4', () => {
    expect(maskPan('4267628872390355')).toBe('**** **** **** 0355');
  });
  it('returns last 4', () => {
    expect(getLast4('4267628872390355')).toBe('0355');
  });
});
