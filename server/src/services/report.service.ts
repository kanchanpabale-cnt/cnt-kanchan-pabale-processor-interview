import { cardRepo, ingestionBatchRepo, transactionRepo } from '../repositories';
import { maskPan } from '../utils/maskPan';

export async function summary() {
  const [cardCount, txTotal, txAccepted, txRejected, batchCount, acceptedAgg] = await Promise.all([
    cardRepo.count(),
    transactionRepo.countByStatus(undefined),
    transactionRepo.countByStatus('ACCEPTED'),
    transactionRepo.countByStatus('REJECTED'),
    ingestionBatchRepo.count(),
    transactionRepo.sumAmountByStatus('ACCEPTED'),
  ]);

  return {
    cards: cardCount,
    transactions: txTotal,
    accepted: txAccepted,
    rejected: txRejected,
    batches: batchCount,
    totalVolume: acceptedAgg._sum.amount?.toFixed(2) ?? '0.00',
  };
}

export async function byCard() {
  const rows = await transactionRepo.groupAcceptedByCard();

  const cardIds = rows.map((r) => r.cardId).filter((id): id is string => !!id);
  const cards = await cardRepo.findManyByIds(cardIds);
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return rows.map((r) => {
    const c = r.cardId ? cardMap.get(r.cardId) : undefined;
    return {
      cardId: r.cardId,
      maskedNumber: c ? maskPan(c.cardNumber) : null,
      last4: c?.last4 ?? null,
      cardType: c?.cardType ?? null,
      holderName: c?.holderName ?? null,
      count: r._count._all,
      total: r._sum.amount?.toFixed(2) ?? '0.00',
    };
  });
}

export async function byCardType() {
  // Card type lives on Card, so aggregate per type via relation filter.
  const types = ['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER'] as const;
  return Promise.all(
    types.map(async (t) => {
      const agg = await transactionRepo.aggregateByCardType(t);
      return {
        cardType: t,
        count: agg._count._all,
        total: agg._sum.amount?.toFixed(2) ?? '0.00',
      };
    }),
  );
}

export async function byDay() {
  const rows = await transactionRepo.aggregateByDay();
  return rows.map((r) => ({
    date: r.day.toISOString().slice(0, 10),
    count: Number(r.count),
    total: r.total,
  }));
}

export async function rejectedByReason() {
  const rows = await transactionRepo.groupRejectedByReason();
  return rows.map((r) => ({
    reason: r.rejectionReason ?? 'UNKNOWN',
    count: r._count._all,
  }));
}

export async function rejected(page: number, pageSize: number) {
  const { total, items } = await transactionRepo.listRejectedPaginated(page, pageSize);
  return {
    total,
    page,
    pageSize,
    items: items.map((t) => ({
      id: t.id,
      maskedNumber: maskPan(t.rawCardNumber || '0000000000000000'),
      timestamp: t.timestamp,
      amount: t.amount.toFixed(2),
      rejectionReason: t.rejectionReason,
      createdAt: t.createdAt,
      batchId: t.batchId,
    })),
  };
}
