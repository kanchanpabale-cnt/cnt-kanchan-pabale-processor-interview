import { cardTypeLabel } from '../../lib/format';
import type { CardType } from '../../types/api';
import { CardBrandIcon } from './CardBrandIcon';

export function CardTypeBadge({
  type,
  compact = false,
}: {
  type: CardType | null;
  compact?: boolean;
}) {
  if (!type) {
    return <span className="text-xs text-ink-muted">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-2 py-0.5 text-xs font-medium text-ink">
      <CardBrandIcon type={type} />
      {!compact && <span>{cardTypeLabel(type)}</span>}
    </span>
  );
}
