import clsx from 'clsx';

interface Props {
  className?: string;
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

const sizeMap = {
  sm: 'text-[22px]',
  md: 'text-[28px]',
  lg: 'text-[40px]',
};

/**
 * SIGNAPAY wordmark. Rendered as text (Inter 900) for crispness at any size
 * and to avoid bundling a binary logo. "SIGNA" is charcoal, "PAY" is the
 * brand blue (#0E4C90). In `dark` mode both halves render white so the mark
 * stays legible on the navy sidebar.
 */
export function Logo({ className, dark = false, size = 'md', showSubtitle = true }: Props) {
  const signaColor = dark ? '#FFFFFF' : '#3F3F3F';
  const payColor = dark ? '#FFFFFF' : '#0E4C90';
  return (
    <div className={clsx('inline-flex select-none flex-col items-start', className)}>
      <div
        className={clsx('flex items-baseline leading-none font-display', sizeMap[size])}
        aria-label="SignaPay"
        role="img"
      >
        <span style={{ color: signaColor, fontWeight: 900, letterSpacing: '-0.04em' }}>SIGNA</span>
        <span style={{ color: payColor, fontWeight: 900, letterSpacing: '-0.04em' }}>PAY</span>
      </div>
      {showSubtitle && (
        <span
          className={clsx(
            'mt-1 text-[10px] font-medium uppercase tracking-[0.18em]',
            dark ? 'text-white/60' : 'text-ink-muted',
          )}
        >
          Card Processor
        </span>
      )}
    </div>
  );
}
