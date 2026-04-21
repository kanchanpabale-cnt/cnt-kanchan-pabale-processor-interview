import type { RawRow } from './validate';

export function parseJson(buffer: Buffer): RawRow[] {
  const parsed = JSON.parse(buffer.toString('utf8')) as unknown;
  const records = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { transactions?: unknown }).transactions)
      ? (parsed as { transactions: unknown[] }).transactions
      : [];
  return records.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      cardNumber: row.cardNumber ?? row.card_number,
      timestamp: row.timestamp,
      amount: row.amount,
    };
  });
}
