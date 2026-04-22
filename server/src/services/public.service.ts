import { getP95LatencyMs } from '../middleware/requestTiming';
import { transactionRepo } from '../repositories';

export interface ShowcaseStats {
  authorizedVolume: string;
  approvalRate: number | null;
  p95LatencyMs: number | null;
  transactionCount: number;
}

/**
 * Public (unauthenticated) snapshot used by the login showcase.
 * Intentionally coarse — only aggregate counts and a latency percentile,
 * no PAN / user / amount detail.
 */
export async function showcaseStats(): Promise<ShowcaseStats> {
  const [accepted, rejected, agg] = await Promise.all([
    transactionRepo.countByStatus('ACCEPTED'),
    transactionRepo.countByStatus('REJECTED'),
    transactionRepo.sumAmountByStatus('ACCEPTED'),
  ]);

  const total = accepted + rejected;
  const approvalRate = total === 0 ? null : (accepted / total) * 100;
  const authorizedVolume = agg._sum.amount?.toFixed(2) ?? '0.00';

  return {
    authorizedVolume,
    approvalRate,
    p95LatencyMs: getP95LatencyMs(),
    transactionCount: total,
  };
}
