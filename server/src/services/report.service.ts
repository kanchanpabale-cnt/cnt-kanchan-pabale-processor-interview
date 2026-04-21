import { prisma } from '../lib/prisma';
import { maskPan } from '../utils/maskPan';

export async function summary() {
  const [cardCount, txTotal, txAccepted, txRejected, batchCount] = await Promise.all([
    prisma.card.count(),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: 'ACCEPTED' } }),
    prisma.transaction.count({ where: { status: 'REJECTED' } }),
    prisma.ingestionBatch.count(),
  ]);

  const acceptedAgg = await prisma.transaction.aggregate({
    where: { status: 'ACCEPTED' },
    _sum: { amount: true },
  });

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
  const rows = await prisma.transaction.groupBy({
    by: ['cardId'],
    where: { status: 'ACCEPTED', cardId: { not: null } },
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const cards = await prisma.card.findMany({
    where: { id: { in: rows.map((r) => r.cardId!).filter(Boolean) } },
    select: { id: true, cardNumber: true, last4: true, cardType: true, holderName: true },
  });
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return rows.map((r) => {
    const c = cardMap.get(r.cardId!);
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
      const agg = await prisma.transaction.aggregate({
        where: { status: 'ACCEPTED', card: { cardType: t } },
        _count: { _all: true },
        _sum: { amount: true },
      });
      return {
        cardType: t,
        count: agg._count._all,
        total: agg._sum.amount?.toFixed(2) ?? '0.00',
      };
    }),
  );
}

export async function byDay() {
  // Use raw SQL for date-bucketing — Prisma groupBy doesn't support date_trunc.
  const rows = await prisma.$queryRawUnsafe<
    Array<{ day: Date; count: bigint; total: string }>
  >(
    `SELECT date_trunc('day', "timestamp") AS day, COUNT(*)::bigint AS count, COALESCE(SUM(amount), 0)::text AS total
     FROM "Transaction"
     WHERE status = 'ACCEPTED'
     GROUP BY 1
     ORDER BY 1 ASC`,
  );
  return rows.map((r) => ({
    date: r.day.toISOString().slice(0, 10),
    count: Number(r.count),
    total: r.total,
  }));
}

export async function rejectedByReason() {
  const rows = await prisma.transaction.groupBy({
    by: ['rejectionReason'],
    where: { status: 'REJECTED' },
    _count: { _all: true },
    orderBy: { _count: { rejectionReason: 'desc' } },
  });
  return rows.map((r) => ({
    reason: r.rejectionReason ?? 'UNKNOWN',
    count: r._count._all,
  }));
}

export async function rejected(page: number, pageSize: number) {
  const [total, items] = await Promise.all([
    prisma.transaction.count({ where: { status: 'REJECTED' } }),
    prisma.transaction.findMany({
      where: { status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
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
