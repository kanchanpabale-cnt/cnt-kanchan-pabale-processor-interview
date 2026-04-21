import { api } from '../lib/axios';

export interface ShowcaseStats {
  authorizedVolume: string;
  approvalRate: number | null;
  p95LatencyMs: number | null;
  transactionCount: number;
}

export async function fetchShowcaseStats(): Promise<ShowcaseStats> {
  const { data } = await api.get<ShowcaseStats>('/public/showcase-stats');
  return data;
}
