import { Decimal } from 'decimal.js';

export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function sumDecimals(values: Array<string | number | Decimal>): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(new Decimal(v)), new Decimal(0));
}

export function formatMoney(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(2);
}
