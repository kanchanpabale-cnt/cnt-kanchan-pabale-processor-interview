import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/error';
import { detectCardType } from '../utils/cardType';
import { maskPan } from '../utils/maskPan';
import type { CreateCardInput, ListCardsQuery, UpdateCardInput } from '../validators/card';

function toPublicCard<T extends { cardNumber: string; last4: string }>(card: T) {
  const { cardNumber: _cardNumber, ...rest } = card;
  return { ...rest, maskedNumber: maskPan(card.cardNumber) };
}

export async function listCards(query: ListCardsQuery) {
  const where: Prisma.CardWhereInput = {};
  if (query.cardType) where.cardType = query.cardType;
  if (query.q) {
    where.OR = [
      { last4: { contains: query.q } },
      { holderName: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.card.count({ where }),
    prisma.card.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { transactions: true } } },
    }),
  ]);

  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    items: items.map(({ _count, ...rest }) => ({
      ...toPublicCard(rest),
      transactionCount: _count.transactions,
    })),
  };
}

export async function getCard(id: string) {
  const card = await prisma.card.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  });
  if (!card) throw new HttpError(404, 'Card not found', 'NotFound');
  const { _count, ...rest } = card;
  return { ...toPublicCard(rest), transactionCount: _count.transactions };
}

export async function createCard(input: CreateCardInput) {
  const cardType = detectCardType(input.cardNumber);
  if (!cardType) throw new HttpError(400, 'Unsupported card type', 'ValidationError');

  const existing = await prisma.card.findUnique({ where: { cardNumber: input.cardNumber } });
  if (existing) throw new HttpError(409, 'Card already exists', 'Conflict');

  const card = await prisma.$transaction(async (tx) => {
    const created = await tx.card.create({
      data: {
        cardNumber: input.cardNumber,
        last4: input.cardNumber.slice(-4),
        cardType,
        holderName: input.holderName,
      },
    });
    await tx.transaction.createMany({
      data: input.transactions.map((t) => ({
        cardId: created.id,
        rawCardNumber: input.cardNumber,
        timestamp: new Date(t.timestamp),
        amount: new Prisma.Decimal(t.amount),
        status: 'ACCEPTED' as const,
      })),
    });
    return created;
  });

  return toPublicCard(card);
}

export async function updateCard(id: string, input: UpdateCardInput) {
  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) throw new HttpError(404, 'Card not found', 'NotFound');

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.card.update({
      where: { id },
      data: {
        holderName: input.holderName ?? undefined,
      },
    });
    // If amount+timestamp provided, append a new ACCEPTED transaction.
    if (input.amount !== undefined && input.timestamp !== undefined) {
      await tx.transaction.create({
        data: {
          cardId: u.id,
          rawCardNumber: card.cardNumber,
          timestamp: new Date(input.timestamp),
          amount: input.amount,
          status: 'ACCEPTED',
        },
      });
    }
    return u;
  });

  return toPublicCard(updated);
}

export async function deleteCard(id: string) {
  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) throw new HttpError(404, 'Card not found', 'NotFound');
  await prisma.card.delete({ where: { id } });
}
