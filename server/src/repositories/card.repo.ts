import type { CardType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './types';

export interface ListCardsFilter {
  page: number;
  pageSize: number;
  cardType?: CardType;
  q?: string;
}

function buildWhere(filter: ListCardsFilter): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = {};
  if (filter.cardType) where.cardType = filter.cardType;
  if (filter.q) {
    where.OR = [
      { last4: { contains: filter.q } },
      { holderName: { contains: filter.q, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function listPaginated(filter: ListCardsFilter, db: Db = prisma) {
  const where = buildWhere(filter);
  const [total, items] = await Promise.all([
    db.card.count({ where }),
    db.card.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
      include: { _count: { select: { transactions: true } } },
    }),
  ]);
  return { total, items };
}

export function findByIdWithCount(id: string, db: Db = prisma) {
  return db.card.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  });
}

export function findById(id: string, db: Db = prisma) {
  return db.card.findUnique({ where: { id } });
}

export function findByNumber(cardNumber: string, db: Db = prisma) {
  return db.card.findUnique({ where: { cardNumber } });
}

export function findManyByIds(
  ids: string[],
  db: Db = prisma,
) {
  return db.card.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      cardNumber: true,
      last4: true,
      cardType: true,
      holderName: true,
    },
  });
}

export interface CreateCardInput {
  cardNumber: string;
  last4: string;
  cardType: CardType;
  holderName?: string;
}

export function create(input: CreateCardInput, db: Db = prisma) {
  return db.card.create({
    data: {
      cardNumber: input.cardNumber,
      last4: input.last4,
      cardType: input.cardType,
      holderName: input.holderName,
    },
  });
}

export function update(
  id: string,
  data: { holderName?: string | null },
  db: Db = prisma,
) {
  return db.card.update({
    where: { id },
    data: {
      holderName: data.holderName ?? undefined,
    },
  });
}

export function deleteById(id: string, db: Db = prisma) {
  return db.card.delete({ where: { id } });
}

export interface UpsertCardInput {
  cardNumber: string;
  last4: string;
  cardType: CardType;
}

export async function upsertMany(inputs: UpsertCardInput[], db: Db = prisma) {
  // Sequential upserts — Prisma has no true batch upsert, but this runs inside
  // a single $transaction so latency is capped at one RTT per card.
  for (const c of inputs) {
    await db.card.upsert({
      where: { cardNumber: c.cardNumber },
      update: {},
      create: c,
    });
  }
}

export async function findIdsByNumbers(
  cardNumbers: string[],
  db: Db = prisma,
): Promise<Map<string, string>> {
  if (cardNumbers.length === 0) return new Map();
  const rows = await db.card.findMany({
    where: { cardNumber: { in: cardNumbers } },
    select: { id: true, cardNumber: true },
  });
  return new Map(rows.map((r) => [r.cardNumber, r.id]));
}

export function count(db: Db = prisma) {
  return db.card.count();
}
