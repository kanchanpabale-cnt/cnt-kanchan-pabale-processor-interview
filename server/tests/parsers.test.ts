import { describe, it, expect } from 'vitest';
import { parseCsv } from '../src/services/ingestion/csv.parser';
import { parseJson } from '../src/services/ingestion/json.parser';
import { parseXml } from '../src/services/ingestion/xml.parser';

const csv = `cardNumber,timestamp,amount
4267628872390355,2024-04-28T18:54:59,399.06
5553959204036891,2024-10-14T06:03:11,-625.65
`;

const json = JSON.stringify([
  { cardNumber: '4267628872390355', timestamp: '2024-04-28T18:54:59', amount: 399.06 },
  { cardNumber: '5553959204036891', timestamp: '2024-10-14T06:03:11', amount: -625.65 },
]);

const xml = `<?xml version="1.0" ?>
<transactions>
  <transaction><cardNumber>4267628872390355</cardNumber><timestamp>2024-04-28T18:54:59</timestamp><amount>399.06</amount></transaction>
  <transaction><cardNumber>5553959204036891</cardNumber><timestamp>2024-10-14T06:03:11</timestamp><amount>-625.65</amount></transaction>
</transactions>`;

describe('parsers produce identical row shapes', () => {
  it('csv', () => {
    const rows = parseCsv(Buffer.from(csv));
    expect(rows).toHaveLength(2);
    expect(rows[0].cardNumber).toBe('4267628872390355');
  });
  it('json', () => {
    const rows = parseJson(Buffer.from(json));
    expect(rows).toHaveLength(2);
    expect(rows[1].amount).toBe(-625.65);
  });
  it('xml', () => {
    const rows = parseXml(Buffer.from(xml));
    expect(rows).toHaveLength(2);
    expect(rows[0].cardNumber).toBe('4267628872390355');
  });
});
