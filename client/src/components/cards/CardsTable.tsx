import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../design-system/Button';
import { Table, TBody, TD, TH, THead, TR } from '../../design-system/Table';
import { formatDate } from '../../lib/format';
import type { Card } from '../../types/api';
import { CardTypeBadge } from './CardTypeBadge';

interface Props {
  cards: Card[];
  canMutate: boolean;
  onDelete: (id: string) => void;
}

export function CardsTable({ cards, canMutate, onDelete }: Props) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Card</TH>
          <TH>Type</TH>
          <TH>Holder</TH>
          <TH className="text-right">Transactions</TH>
          <TH>Created</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {cards.map((c) => (
          <TR key={c.id}>
            <TD className="font-mono text-ink">{c.maskedNumber}</TD>
            <TD>
              <CardTypeBadge type={c.cardType} />
            </TD>
            <TD>{c.holderName ?? <span className="text-ink-muted">—</span>}</TD>
            <TD className="text-right">{c.transactionCount ?? 0}</TD>
            <TD className="text-ink-muted">{formatDate(c.createdAt)}</TD>
            <TD className="text-right">
              <div className="flex items-center justify-end gap-2">
                {canMutate && (
                  <>
                    <Link to={`/cards/${c.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(c.id)}
                      className="text-danger hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
