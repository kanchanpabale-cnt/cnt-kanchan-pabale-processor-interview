import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

function buildPages(current: number, total: number, siblings: number): PageItem[] {
  // If there are few enough pages, render them all.
  const maxVisible = siblings * 2 + 5; // first + last + current + siblings*2 + 2 ellipses
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblings, 2);
  const rightSibling = Math.min(current + siblings, total - 1);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const pages: PageItem[] = [1];
  if (showLeftEllipsis) pages.push('ellipsis-left');
  for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);
  if (showRightEllipsis) pages.push('ellipsis-right');
  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: Props) {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages, siblingCount);

  const go = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  const iconBtn =
    'inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-brand-200 bg-white text-brand-900 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 focus-ring';

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="First page"
        disabled={page <= 1}
        onClick={() => go(1)}
        className={iconBtn}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={iconBtn}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p) =>
          typeof p === 'number' ? (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? 'page' : undefined}
              className={clsx(
                'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-[10px] px-2 text-sm font-medium transition focus-ring',
                p === page
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'border border-brand-200 bg-white text-brand-900 hover:bg-brand-50',
              )}
            >
              {p}
            </button>
          ) : (
            <span
              key={p}
              aria-hidden
              className="inline-flex h-9 w-7 items-center justify-center text-sm text-ink-muted"
            >
              …
            </span>
          ),
        )}
      </div>

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
        className={iconBtn}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Last page"
        disabled={page >= totalPages}
        onClick={() => go(totalPages)}
        className={iconBtn}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
