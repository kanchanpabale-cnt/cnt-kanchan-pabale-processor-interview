/**
 * Card PAN formatting helpers.
 *
 * Grouping rules:
 *   - Amex (leading 3): 15 digits → groups of 5 (5-5-5)
 *   - Visa/MC/Discover (leading 4/5/6): 16 digits → groups of 4 (4-4-4-4)
 *
 * The group size is decided by the leading digit so the formatting is stable
 * while the user is still typing.
 */
export function expectedLength(digits: string): 15 | 16 {
  return digits.startsWith('3') ? 15 : 16;
}

export function groupSizeFor(digits: string): 4 | 5 {
  return digits.startsWith('3') ? 5 : 4;
}

/** Strip everything that isn't a digit. */
export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Format a digit-only string into space-separated groups per the leading-digit rule. */
export function formatPan(value: string): string {
  const digits = stripNonDigits(value).slice(0, expectedLength(stripNonDigits(value)));
  const groupSize = groupSizeFor(digits);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += groupSize) {
    groups.push(digits.slice(i, i + groupSize));
  }
  return groups.join(' ');
}
