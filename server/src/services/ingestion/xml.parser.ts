import { XMLParser } from 'fast-xml-parser';
import type { RawRow } from './validate';

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

export function parseXml(buffer: Buffer): RawRow[] {
  const parsed = parser.parse(buffer.toString('utf8')) as Record<string, unknown>;
  const root = parsed.transactions as { transaction?: unknown } | undefined;
  if (!root || !root.transaction) return [];
  const list = Array.isArray(root.transaction) ? root.transaction : [root.transaction];
  return list.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      cardNumber: row.cardNumber,
      timestamp: row.timestamp,
      amount: row.amount,
    };
  });
}
