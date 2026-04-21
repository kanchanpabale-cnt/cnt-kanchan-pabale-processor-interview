import clsx from 'clsx';
import { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-[12px] border border-brand-100 bg-surface shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('border-b border-brand-100 px-5 py-4', className)}>{children}</div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>;
}
