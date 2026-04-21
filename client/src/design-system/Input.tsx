import clsx from 'clsx';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  const inputId = id ?? `i_${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'block w-full rounded-[10px] border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-ring',
          error ? 'border-danger' : 'border-brand-200 hover:border-brand-400',
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});
