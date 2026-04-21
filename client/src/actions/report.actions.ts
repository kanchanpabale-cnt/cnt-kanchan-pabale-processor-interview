import { api } from '../lib/axios';
import type {
  ByCardRow,
  ByCardTypeRow,
  ByDayRow,
  Paginated,
  RejectedReasonRow,
  RejectedTransaction,
  Summary,
} from '../types/api';

export async function fetchSummary(): Promise<Summary> {
  const { data } = await api.get<Summary>('/reports/summary');
  return data;
}
export async function fetchByCard(): Promise<ByCardRow[]> {
  const { data } = await api.get<ByCardRow[]>('/reports/by-card');
  return data;
}
export async function fetchByCardType(): Promise<ByCardTypeRow[]> {
  const { data } = await api.get<ByCardTypeRow[]>('/reports/by-card-type');
  return data;
}
export async function fetchByDay(): Promise<ByDayRow[]> {
  const { data } = await api.get<ByDayRow[]>('/reports/by-day');
  return data;
}
export async function fetchRejectedByReason(): Promise<RejectedReasonRow[]> {
  const { data } = await api.get<RejectedReasonRow[]>('/reports/rejected-by-reason');
  return data;
}

export async function fetchRejected(
  page = 1,
  pageSize = 25,
): Promise<Paginated<RejectedTransaction>> {
  const { data } = await api.get<Paginated<RejectedTransaction>>('/reports/rejected', {
    params: { page, pageSize },
  });
  return data;
}
