export function formatMoney(value: string | number, currency = 'USD'): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Short "$4.82M" / "$125.0K" / "$950.00" form for KPI tiles where column width matters.
 * Returns "—" for non-finite input.
 */
export function formatCompactMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatPercent(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return `${v.toFixed(digits)}%`;
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function cardTypeLabel(t: string): string {
  switch (t) {
    case 'AMEX':
      return 'American Express';
    case 'VISA':
      return 'Visa';
    case 'MASTERCARD':
      return 'MasterCard';
    case 'DISCOVER':
      return 'Discover';
    default:
      return t;
  }
}
