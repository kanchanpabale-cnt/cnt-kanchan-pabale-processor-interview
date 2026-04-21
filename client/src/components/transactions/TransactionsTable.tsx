import { Badge } from '../../design-system/Badge';
import { Table, TBody, TD, TH, THead, TR } from '../../design-system/Table';
import { formatDateTime, formatMoney } from '../../lib/format';
import type { Transaction } from '../../types/api';
import { CardTypeBadge } from '../cards/CardTypeBadge';

export function TransactionsTable({ items }: { items: Transaction[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Card</TH>
          <TH>Type</TH>
          <TH>Timestamp</TH>
          <TH className="text-right">Amount</TH>
          <TH>Status</TH>
          <TH>Name</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((t) => {
          const isNegative = Number(t.amount) < 0;
          return (
            <TR key={t.id}>
              <TD className="font-mono text-ink">{t.maskedNumber}</TD>
              <TD>
                <CardTypeBadge type={t.card?.cardType ?? null} />
              </TD>
              <TD className="text-ink-muted">{formatDateTime(t.timestamp)}</TD>
              <TD
                className={`text-right font-mono ${isNegative ? 'font-semibold text-danger' : ''}`}
              >
                {formatMoney(t.amount)}
              </TD>
              <TD>
                <Badge tone={t.status === 'ACCEPTED' ? 'success' : 'danger'}>{t.status}</Badge>
              </TD>
              <TD className={t.card?.holderName ? 'text-ink' : 'text-ink-muted'}>
                {t.card?.holderName ?? '—'}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
