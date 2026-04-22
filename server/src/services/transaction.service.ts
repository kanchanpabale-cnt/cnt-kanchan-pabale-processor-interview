import type { Prisma } from '@prisma/client';
import { transactionRepo } from '../repositories';
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
  const { total, items } = await transactionRepo.listPaginatedWithCard(query);
  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    items: items.map(toPublicTransaction),
  };
}
