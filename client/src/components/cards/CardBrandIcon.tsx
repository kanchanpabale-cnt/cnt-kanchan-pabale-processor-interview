import type { CardType } from '../../types/api';

/**
 * Simplified payment-network marks. Not the licensed brand assets —
 * recognizable geometry and colors only, suitable for a demo UI.
 */
export function CardBrandIcon({
  type,
  className = 'h-4 w-7',
}: {
  type: CardType | null;
  className?: string;
}) {
  if (!type) return null;
  switch (type) {
    case 'AMEX':
      return (
        <svg viewBox="0 0 28 18" className={className} aria-hidden>
          <rect width="28" height="18" rx="2.5" fill="#006FCF" />
          <text
            x="14"
            y="12"
            textAnchor="middle"
            fontSize="6.6"
            fontWeight="900"
            fontFamily="Inter, system-ui, sans-serif"
            fill="white"
            letterSpacing="0.5"
          >
            AMEX
          </text>
        </svg>
      );
    case 'VISA':
      return (
        <svg viewBox="0 0 28 18" className={className} aria-hidden>
          <rect width="28" height="18" rx="2.5" fill="white" stroke="#E5E7EB" strokeWidth="0.6" />
          <text
            x="14"
            y="12.5"
            textAnchor="middle"
            fontSize="8"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="Inter, system-ui, sans-serif"
            fill="#1A1F71"
            letterSpacing="0.4"
          >
            VISA
          </text>
        </svg>
      );
    case 'MASTERCARD':
      return (
        <svg viewBox="0 0 28 18" className={className} aria-hidden>
          <rect width="28" height="18" rx="2.5" fill="white" stroke="#E5E7EB" strokeWidth="0.6" />
          <circle cx="11" cy="9" r="5" fill="#EB001B" />
          <circle cx="17" cy="9" r="5" fill="#F79E1B" />
          <path
            d="M14 5.2 a5 5 0 0 1 0 7.6 a5 5 0 0 1 0 -7.6 z"
            fill="#FF5F00"
          />
        </svg>
      );
    case 'DISCOVER':
      return (
        <svg viewBox="0 0 28 18" className={className} aria-hidden>
          <rect width="28" height="18" rx="2.5" fill="white" stroke="#E5E7EB" strokeWidth="0.6" />
          <text
            x="10.5"
            y="12"
            textAnchor="middle"
            fontSize="5.2"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            fill="#0F172A"
            letterSpacing="0.2"
          >
            DISC
          </text>
          <circle cx="21" cy="9" r="3.6" fill="#F58220" />
        </svg>
      );
  }
}
