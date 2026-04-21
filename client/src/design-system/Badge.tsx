import clsx from 'clsx';
import { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'danger' | 'amex' | 'visa' | 'mastercard' | 'discover';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-brand-50 text-ink',
  brand: 'bg-brand-100 text-brand-900',
  accent: 'bg-accent-400/20 text-accent-600',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  amex: 'bg-blue-100 text-blue-900',
  visa: 'bg-indigo-100 text-indigo-900',
  mastercard: 'bg-orange-100 text-orange-900',
  discover: 'bg-amber-100 text-amber-900',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
