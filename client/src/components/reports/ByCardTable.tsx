import { Table, TBody, TD, TH, THead, TR } from '../../design-system/Table';
import { formatMoney } from '../../lib/format';
import type { ByCardRow } from '../../types/api';
import { CardTypeBadge } from '../cards/CardTypeBadge';

export function ByCardTable({ rows }: { rows: ByCardRow[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Card</TH>
          <TH>Type</TH>
          <TH>Holder</TH>
          <TH className="text-right">Transactions</TH>
          <TH className="text-right">Total</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR key={r.cardId ?? r.last4 ?? Math.random()}>
            <TD className="font-mono text-ink">{r.maskedNumber ?? '—'}</TD>
            <TD>
              <CardTypeBadge type={r.cardType} />
            </TD>
            <TD>{r.holderName ?? <span className="text-ink-muted">—</span>}</TD>
            <TD className="text-right">{r.count}</TD>
            <TD className="text-right font-mono">{formatMoney(r.total)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
