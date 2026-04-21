import { parse } from 'csv-parse/sync';
import type { RawRow } from './validate';

export function parseCsv(buffer: Buffer): RawRow[] {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Array<Record<string, string>>;
  return records.map((r) => ({
    cardNumber: r.cardNumber ?? r.card_number,
    timestamp: r.timestamp,
    amount: r.amount,
  }));
}
