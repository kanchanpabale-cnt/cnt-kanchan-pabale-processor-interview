import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/error';
import { cardRepo, transactionRepo } from '../repositories';
import { detectCardType } from '../utils/cardType';
import { maskPan } from '../utils/maskPan';
import type { CreateCardInput, ListCardsQuery, UpdateCardInput } from '../validators/card';

function toPublicCard<T extends { cardNumber: string; last4: string }>(card: T) {
  const { cardNumber: _cardNumber, ...rest } = card;
  return { ...rest, maskedNumber: maskPan(card.cardNumber) };
}

export async function listCards(query: ListCardsQuery) {
  const { total, items } = await cardRepo.listPaginated(query);
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
  const card = await cardRepo.findByIdWithCount(id);
  if (!card) throw new HttpError(404, 'Card not found', 'NotFound');
  const { _count, ...rest } = card;
  return { ...toPublicCard(rest), transactionCount: _count.transactions };
}

export async function createCard(input: CreateCardInput) {
  const cardType = detectCardType(input.cardNumber);
  if (!cardType) throw new HttpError(400, 'Unsupported card type', 'ValidationError');

  const existing = await cardRepo.findByNumber(input.cardNumber);
  if (existing) throw new HttpError(409, 'Card already exists', 'Conflict');

  const card = await prisma.$transaction(async (tx) => {
    const created = await cardRepo.create(
      {
        cardNumber: input.cardNumber,
        last4: input.cardNumber.slice(-4),
        cardType,
        holderName: input.holderName,
      },
      tx,
    );
    await transactionRepo.createManyAccepted(
      {
        cardId: created.id,
        rawCardNumber: input.cardNumber,
        transactions: input.transactions.map((t) => ({
          amount: t.amount,
          timestamp: new Date(t.timestamp),
        })),
      },
      tx,
    );
    return created;
  });

  return toPublicCard(card);
}

export async function updateCard(id: string, input: UpdateCardInput) {
  const card = await cardRepo.findById(id);
  if (!card) throw new HttpError(404, 'Card not found', 'NotFound');

  const updated = await prisma.$transaction(async (tx) => {
    const u = await cardRepo.update(id, { holderName: input.holderName ?? undefined }, tx);
    // If amount+timestamp provided, append a new ACCEPTED transaction.
    if (input.amount !== undefined && input.timestamp !== undefined) {
      await transactionRepo.createAccepted(
        {
          cardId: u.id,
          rawCardNumber: card.cardNumber,
          timestamp: new Date(input.timestamp),
          amount: input.amount,
        },
        tx,
      );
    }
    return u;
  });

  return toPublicCard(updated);
}

export async function deleteCard(id: string) {
  const card = await cardRepo.findById(id);
  if (!card) throw new HttpError(404, 'Card not found', 'NotFound');
  await cardRepo.deleteById(id);
}
