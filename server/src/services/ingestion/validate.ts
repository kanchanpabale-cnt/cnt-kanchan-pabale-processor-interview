import { detectCardType } from '../../utils/cardType';

export type RawRow = {
  cardNumber?: unknown;
  timestamp?: unknown;
  amount?: unknown;
};

export type ValidatedRow =
  | {
      ok: true;
      cardNumber: string;
      last4: string;
      cardType: 'AMEX' | 'VISA' | 'MASTERCARD' | 'DISCOVER';
      timestamp: Date;
      amount: string;
    }
  | {
      ok: false;
      rawCardNumber: string;
      rejectionReason: string;
      timestamp: Date | null;
      amount: string | null;
    };

const DIGITS_ONLY = /^\d{13,19}$/;

export function validateRow(row: RawRow): ValidatedRow {
  const rawCardNumber = String(row.cardNumber ?? '').trim();
  const rawTimestamp = String(row.timestamp ?? '').trim();
  const rawAmount = row.amount;

  let parsedTimestamp: Date | null = null;
  if (rawTimestamp) {
    const d = new Date(rawTimestamp);
    if (!Number.isNaN(d.getTime())) parsedTimestamp = d;
  }

  let parsedAmount: string | null = null;
  if (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') {
    const n = Number(rawAmount);
    if (Number.isFinite(n)) parsedAmount = String(rawAmount);
  }

  if (!rawCardNumber) {
    return { ok: false, rawCardNumber, rejectionReason: 'MISSING_CARD_NUMBER', timestamp: parsedTimestamp, amount: parsedAmount };
  }
  if (!/^\d+$/.test(rawCardNumber)) {
    return { ok: false, rawCardNumber, rejectionReason: 'NON_NUMERIC_PAN', timestamp: parsedTimestamp, amount: parsedAmount };
  }
  if (!DIGITS_ONLY.test(rawCardNumber)) {
    return { ok: false, rawCardNumber, rejectionReason: 'INVALID_LENGTH', timestamp: parsedTimestamp, amount: parsedAmount };
  }
  const cardType = detectCardType(rawCardNumber);
  if (!cardType) {
    return { ok: false, rawCardNumber, rejectionReason: 'UNRECOGNIZED_TYPE', timestamp: parsedTimestamp, amount: parsedAmount };
  }
  if (!parsedTimestamp) {
    return { ok: false, rawCardNumber, rejectionReason: 'INVALID_TIMESTAMP', timestamp: null, amount: parsedAmount };
  }
  if (parsedAmount === null) {
    return { ok: false, rawCardNumber, rejectionReason: 'INVALID_AMOUNT', timestamp: parsedTimestamp, amount: null };
  }

  return {
    ok: true,
    cardNumber: rawCardNumber,
    last4: rawCardNumber.slice(-4),
    cardType,
    timestamp: parsedTimestamp,
    amount: parsedAmount,
  };
}
