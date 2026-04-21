import clsx from 'clsx';
import { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className, children, ...rest },
  ref,
) {
  const selectId = id ?? `s_${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'block w-full rounded-[10px] border bg-white px-3 py-2 text-sm text-ink focus-ring',
          error ? 'border-danger' : 'border-brand-200 hover:border-brand-400',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});
