import { api } from '../lib/axios';
import type { Card, Paginated } from '../types/api';

export interface ListCardsQuery {
  page?: number;
  pageSize?: number;
  cardType?: 'AMEX' | 'VISA' | 'MASTERCARD' | 'DISCOVER';
  q?: string;
}

export async function listCards(query: ListCardsQuery = {}): Promise<Paginated<Card>> {
  const { data } = await api.get<Paginated<Card>>('/cards', { params: query });
  return data;
}

export async function getCard(id: string): Promise<Card> {
  const { data } = await api.get<Card>(`/cards/${id}`);
  return data;
}

export interface TransactionEntryInput {
  amount: string;
  timestamp: string;
}

export async function createCard(body: {
  cardNumber: string;
  holderName?: string;
  transactions: TransactionEntryInput[];
}): Promise<Card> {
  const { data } = await api.post<Card>('/cards', body);
  return data;
}

export async function updateCard(
  id: string,
  body: {
    holderName?: string | null;
    amount?: string;
    timestamp?: string;
  },
): Promise<Card> {
  const { data } = await api.put<Card>(`/cards/${id}`, body);
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`/cards/${id}`);
}
