import { prisma } from '../lib/prisma';
import type { Db } from './types';

export interface CreateIngestionBatchInput {
  filename: string;
  format: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  uploadedById: string;
}

export function create(input: CreateIngestionBatchInput, db: Db = prisma) {
  return db.ingestionBatch.create({ data: input });
}

export function count(db: Db = prisma) {
  return db.ingestionBatch.count();
}
