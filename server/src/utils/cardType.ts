import type { CardType } from '@prisma/client';

const LEADING_DIGIT_MAP: Record<string, CardType> = {
  '3': 'AMEX',
  '4': 'VISA',
  '5': 'MASTERCARD',
  '6': 'DISCOVER',
};

export function detectCardType(cardNumber: string): CardType | null {
  if (!cardNumber || cardNumber.length === 0) return null;
  return LEADING_DIGIT_MAP[cardNumber[0]] ?? null;
}

export function isSupportedCardType(cardNumber: string): boolean {
  return detectCardType(cardNumber) !== null;
}
