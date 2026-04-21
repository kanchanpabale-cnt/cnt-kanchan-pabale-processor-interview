import clsx from 'clsx';
import { HTMLAttributes, ReactNode } from 'react';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('overflow-x-auto rounded-[12px] border border-brand-100 bg-surface shadow-card', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-ink-muted">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-brand-100">{children}</tbody>;
}

export function TR({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx('hover:bg-brand-50/50', className)} {...rest}>
      {children}
    </tr>
  );
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={clsx('px-4 py-3 font-medium', className)}>{children}</th>;
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={clsx('px-4 py-3 align-middle', className)}>{children}</td>;
}
