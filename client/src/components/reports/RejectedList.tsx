import { Badge } from '../../design-system/Badge';
import { Table, TBody, TD, TH, THead, TR } from '../../design-system/Table';
import { formatDateTime, formatMoney } from '../../lib/format';
import type { RejectedTransaction } from '../../types/api';

export function RejectedList({ items }: { items: RejectedTransaction[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Raw card</TH>
          <TH>Timestamp</TH>
          <TH className="text-right">Amount</TH>
          <TH>Reason</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((r) => (
          <TR key={r.id}>
            <TD className="font-mono">{r.maskedNumber}</TD>
            <TD className="text-ink-muted">{formatDateTime(r.timestamp)}</TD>
            <TD className="text-right font-mono">{formatMoney(r.amount)}</TD>
            <TD>
              <Badge tone="danger">{r.rejectionReason ?? 'UNKNOWN'}</Badge>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
