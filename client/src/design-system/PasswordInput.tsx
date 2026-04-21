import clsx from 'clsx';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  rightLabel?: ReactNode;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, hint, rightLabel, id, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? `p_${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="space-y-1.5">
        {(label || rightLabel) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={inputId} className="block text-sm font-medium text-ink">
                {label}
              </label>
            )}
            {rightLabel && <div className="text-xs">{rightLabel}</div>}
          </div>
        )}
        <div
          className={clsx(
            'flex items-center rounded-[10px] border bg-white focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 focus-within:ring-offset-canvas',
            error ? 'border-danger' : 'border-brand-200 hover:border-brand-400',
            className,
          )}
        >
          <Lock className="ml-3 h-4 w-4 flex-shrink-0 text-ink-muted" aria-hidden />
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            aria-invalid={!!error}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="mr-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-ink-muted hover:text-brand-900 focus-ring"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{visible ? 'Hide' : 'Show'}</span>
          </button>
        </div>
        {error ? (
          <p className="flex items-center gap-1 text-xs text-danger">
            <span aria-hidden>⚠</span> {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
