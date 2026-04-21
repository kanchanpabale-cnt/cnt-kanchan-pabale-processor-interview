import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { maskPan } from '../utils/maskPan';
import type { ListTransactionsQuery } from '../validators/transaction';

function toPublicTransaction<
  T extends {
    rawCardNumber: string;
    amount: Prisma.Decimal;
    card?: {
      id: string;
      last4: string;
      cardType: string;
      holderName: string | null;
    } | null;
  },
>(t: T) {
  const { rawCardNumber, amount, card, ...rest } = t;
  return {
    ...rest,
    amount: amount.toFixed(2),
    maskedNumber: maskPan(rawCardNumber),
    card: card
      ? {
          id: card.id,
          last4: card.last4,
          cardType: card.cardType,
          holderName: card.holderName,
        }
      : null,
  };
}

export async function listTransactions(query: ListTransactionsQuery) {
  const where: Prisma.TransactionWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.cardId) where.cardId = query.cardId;
  if (query.cardType) where.card = { cardType: query.cardType };
  if (query.from || query.to) {
    where.timestamp = {};
    if (query.from) where.timestamp.gte = new Date(query.from);
    if (query.to) where.timestamp.lte = new Date(query.to);
  }
  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    where.amount = {};
    if (query.minAmount !== undefined) where.amount.gte = new Prisma.Decimal(query.minAmount);
    if (query.maxAmount !== undefined) where.amount.lte = new Prisma.Decimal(query.maxAmount);
  }

  const [total, items] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        card: {
          select: { id: true, last4: true, cardType: true, holderName: true },
        },
      },
    }),
  ]);

  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    items: items.map(toPublicTransaction),
  };
}
