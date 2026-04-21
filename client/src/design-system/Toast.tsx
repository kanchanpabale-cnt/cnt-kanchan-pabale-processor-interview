import clsx from 'clsx';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useUiStore } from '../store/ui.store';

export type ToasterPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'top-center';

const positionClasses: Record<ToasterPosition, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
};

/**
 * Pure toast list — no positioning wrapper. Use this to embed the toasts
 * anywhere in the layout (e.g. above a heading). If you want the usual
 * fixed-corner popup behavior, use `<Toaster />` instead.
 */
export function ToastList({ className }: { className?: string } = {}) {
  const { toasts, dismissToast } = useUiStore();
  if (toasts.length === 0) return null;
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 rounded-[10px] px-4 py-3 text-sm shadow-pop backdrop-blur-md',
            t.kind === 'success' && 'bg-white/95 border-l-4 border-success',
            t.kind === 'error' && 'bg-white/95 border-l-4 border-danger',
            t.kind === 'info' && 'bg-white/95 border-l-4 border-brand-600',
          )}
          onClick={() => dismissToast(t.id)}
          role="status"
        >
          {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />}
          {t.kind === 'error' && <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />}
          {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />}
          <span className="text-ink">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Fixed-position toast container. Use for app-wide toasts anchored to a
 * screen corner. For inline placement within a specific layout, use
 * `<ToastList />` instead.
 */
export function Toaster({
  position = 'bottom-right',
}: { position?: ToasterPosition } = {}) {
  const { toasts, dismissToast } = useUiStore();
  return (
    <div
      className={clsx(
        'pointer-events-none fixed z-50 flex flex-col gap-2',
        positionClasses[position],
      )}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex min-w-[260px] items-start gap-3 rounded-[10px] px-4 py-3 text-sm shadow-pop',
            t.kind === 'success' && 'bg-white border-l-4 border-success',
            t.kind === 'error' && 'bg-white border-l-4 border-danger',
            t.kind === 'info' && 'bg-white border-l-4 border-brand-600',
          )}
          onClick={() => dismissToast(t.id)}
          role="status"
        >
          {t.kind === 'success' && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
          )}
          {t.kind === 'error' && (
            <XCircle className="mt-0.5 h-4 w-4 text-danger" />
          )}
          {t.kind === 'info' && (
            <Info className="mt-0.5 h-4 w-4 text-brand-600" />
          )}
          <span className="text-ink">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
