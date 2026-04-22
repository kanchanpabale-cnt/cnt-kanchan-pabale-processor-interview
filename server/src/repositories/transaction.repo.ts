import type { CardType, Prisma, TxnStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './types';

/* -------------------- filters / listing -------------------- */

export interface ListTransactionsFilter {
  page: number;
  pageSize: number;
  status?: TxnStatus;
  cardId?: string;
  cardType?: CardType;
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
}

function buildWhere(filter: ListTransactionsFilter): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.cardId) where.cardId = filter.cardId;
  if (filter.cardType) where.card = { cardType: filter.cardType };
  if (filter.from || filter.to) {
    where.timestamp = {};
    if (filter.from) where.timestamp.gte = new Date(filter.from);
    if (filter.to) where.timestamp.lte = new Date(filter.to);
  }
  if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
    where.amount = {};
    if (filter.minAmount !== undefined) where.amount.gte = filter.minAmount;
    if (filter.maxAmount !== undefined) where.amount.lte = filter.maxAmount;
  }
  return where;
}

export async function listPaginatedWithCard(
  filter: ListTransactionsFilter,
  db: Db = prisma,
) {
  const where = buildWhere(filter);
  const [total, items] = await Promise.all([
    db.transaction.count({ where }),
    db.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
      include: {
        card: { select: { id: true, last4: true, cardType: true, holderName: true } },
      },
    }),
  ]);
  return { total, items };
}

export async function listRejectedPaginated(page: number, pageSize: number, db: Db = prisma) {
  const where: Prisma.TransactionWhereInput = { status: 'REJECTED' };
  const [total, items] = await Promise.all([
    db.transaction.count({ where }),
    db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, items };
}

/* -------------------- counts + aggregates -------------------- */

export function countByStatus(status: TxnStatus | undefined, db: Db = prisma) {
  return db.transaction.count(status ? { where: { status } } : undefined);
}

export function sumAmountByStatus(status: TxnStatus, db: Db = prisma) {
  return db.transaction.aggregate({
    where: { status },
    _sum: { amount: true },
  });
}

export function aggregateByCardType(cardType: CardType, db: Db = prisma) {
  return db.transaction.aggregate({
    where: { status: 'ACCEPTED', card: { cardType } },
    _count: { _all: true },
    _sum: { amount: true },
  });
}

export function groupAcceptedByCard(db: Db = prisma) {
  return db.transaction.groupBy({
    by: ['cardId'],
    where: { status: 'ACCEPTED', cardId: { not: null } },
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });
}

export function groupRejectedByReason(db: Db = prisma) {
  return db.transaction.groupBy({
    by: ['rejectionReason'],
    where: { status: 'REJECTED' },
    _count: { _all: true },
    orderBy: { _count: { rejectionReason: 'desc' } },
  });
}

/**
 * Day-bucketed accepted volume. Uses raw SQL because Prisma `groupBy` can't
 * `date_trunc`. Locked to `ACCEPTED`; no user-supplied predicates enter the
 * string, so no injection surface.
 */
export function aggregateByDay(db: Db = prisma) {
  return db.$queryRawUnsafe<Array<{ day: Date; count: bigint; total: string }>>(
    `SELECT date_trunc('day', "timestamp") AS day,
            COUNT(*)::bigint AS count,
            COALESCE(SUM(amount), 0)::text AS total
       FROM "Transaction"
      WHERE status = 'ACCEPTED'
      GROUP BY 1
      ORDER BY 1 ASC`,
  );
}

/* -------------------- writes -------------------- */

export interface CreateAcceptedTransactionInput {
  cardId: string;
  rawCardNumber: string;
  timestamp: Date;
  amount: string;
}

export function createAccepted(input: CreateAcceptedTransactionInput, db: Db = prisma) {
  return db.transaction.create({
    data: { ...input, status: 'ACCEPTED' },
  });
}

export interface BulkInsertBatchInput {
  accepted: Array<{
    cardId: string;
    rawCardNumber: string;
    timestamp: Date;
    amount: string;
  }>;
  rejected: Array<{
    rawCardNumber: string;
    timestamp: Date;
    amount: string;
    rejectionReason: string;
  }>;
  batchId: string;
}

export async function bulkInsertBatch(input: BulkInsertBatchInput, db: Db = prisma) {
  if (input.accepted.length > 0) {
    await db.transaction.createMany({
      data: input.accepted.map((r) => ({
        cardId: r.cardId,
        rawCardNumber: r.rawCardNumber,
        timestamp: r.timestamp,
        amount: r.amount,
        status: 'ACCEPTED',
        batchId: input.batchId,
      })),
    });
  }
  if (input.rejected.length > 0) {
    await db.transaction.createMany({
      data: input.rejected.map((r) => ({
        cardId: null,
        rawCardNumber: r.rawCardNumber,
        timestamp: r.timestamp,
        amount: r.amount,
        status: 'REJECTED',
        rejectionReason: r.rejectionReason,
        batchId: input.batchId,
      })),
    });
  }
}

export interface CreateManyAcceptedInput {
  cardId: string;
  rawCardNumber: string;
  transactions: Array<{ amount: string; timestamp: Date }>;
}

export function createManyAccepted(input: CreateManyAcceptedInput, db: Db = prisma) {
  return db.transaction.createMany({
    data: input.transactions.map((t) => ({
      cardId: input.cardId,
      rawCardNumber: input.rawCardNumber,
      timestamp: t.timestamp,
      amount: t.amount,
      status: 'ACCEPTED',
    })),
  });
}
