import { api } from '../lib/axios';
import type { CardType, IngestionBatch, Paginated, Transaction } from '../types/api';

export interface ListTransactionsQuery {
  page?: number;
  pageSize?: number;
  status?: 'ACCEPTED' | 'REJECTED';
  cardId?: string;
  cardType?: CardType;
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
}

export async function listTransactions(
  query: ListTransactionsQuery = {},
): Promise<Paginated<Transaction>> {
  const { data } = await api.get<Paginated<Transaction>>('/transactions', { params: query });
  return data;
}

export async function uploadTransactions(file: File): Promise<IngestionBatch> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<IngestionBatch>('/transactions/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
