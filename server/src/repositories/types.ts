import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Anything repositories accept as a database client — either the root
 * PrismaClient or a transaction-scoped client produced by `prisma.$transaction`.
 *
 * Every repository function takes an optional `db: Db = prisma` argument so
 * services can compose multiple repo calls inside a single `$transaction`
 * without the repo needing to know whether it's being called at top level
 * or inside a transaction.
 */
export type Db = PrismaClient | Prisma.TransactionClient;
