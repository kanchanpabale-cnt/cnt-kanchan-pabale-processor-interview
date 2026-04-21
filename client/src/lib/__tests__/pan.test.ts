import {
  expectedLength,
  formatPan,
  groupSizeFor,
  stripNonDigits,
} from '../pan';

describe('pan helpers', () => {
  describe('expectedLength', () => {
    it('returns 15 for Amex leading digit', () => {
      expect(expectedLength('3')).toBe(15);
      expect(expectedLength('371234567890123')).toBe(15);
    });
    it('returns 16 for any other leading digit (default)', () => {
      expect(expectedLength('')).toBe(16);
      expect(expectedLength('4')).toBe(16);
      expect(expectedLength('5')).toBe(16);
      expect(expectedLength('6')).toBe(16);
      expect(expectedLength('9')).toBe(16);
    });
  });

  describe('groupSizeFor', () => {
    it('returns 5 for Amex', () => {
      expect(groupSizeFor('3')).toBe(5);
    });
    it('returns 4 for the rest', () => {
      expect(groupSizeFor('4')).toBe(4);
      expect(groupSizeFor('')).toBe(4);
    });
  });

  describe('stripNonDigits', () => {
    it('removes all non-digit characters', () => {
      expect(stripNonDigits('4111 1111 1111 1111')).toBe('4111111111111111');
      expect(stripNonDigits('abc-12.3/45')).toBe('12345');
      expect(stripNonDigits('')).toBe('');
    });
  });

  describe('formatPan', () => {
    it('formats 16-digit Visa into 4-4-4-4 groups', () => {
      expect(formatPan('4111111111111111')).toBe('4111 1111 1111 1111');
    });

    it('formats 15-digit Amex into 5-5-5 groups', () => {
      expect(formatPan('371449635398431')).toBe('37144 96353 98431');
    });

    it('truncates overflow to the expected length', () => {
      // 16 digits typed + 3 extra — should drop the extras
      expect(formatPan('41111111111111119999')).toBe('4111 1111 1111 1111');
      // Amex + extras
      expect(formatPan('371449635398431000')).toBe('37144 96353 98431');
    });

    it('handles partial input mid-typing', () => {
      expect(formatPan('4111')).toBe('4111');
      expect(formatPan('41111')).toBe('4111 1');
      expect(formatPan('411111111')).toBe('4111 1111 1');
      expect(formatPan('37144')).toBe('37144');
      expect(formatPan('371449')).toBe('37144 9');
    });

    it('strips spaces in the input before formatting', () => {
      expect(formatPan('4111 1111')).toBe('4111 1111');
    });

    it('returns empty string for empty input', () => {
      expect(formatPan('')).toBe('');
    });
  });
});
