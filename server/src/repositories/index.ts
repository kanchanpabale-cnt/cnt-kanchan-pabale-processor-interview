// Barrel — import `from '../repositories'` and reach each repo through its
// namespace (e.g. `userRepo.findByEmailWithHash(...)`). Keeps call sites
// self-describing without forcing a new import for every entity.
export * as userRepo from './user.repo';
export * as cardRepo from './card.repo';
export * as transactionRepo from './transaction.repo';
export * as ingestionBatchRepo from './ingestion-batch.repo';
export type { Db } from './types';
