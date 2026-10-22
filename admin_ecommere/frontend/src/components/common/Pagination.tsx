import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = [];
  const showPages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  const endPage = Math.min(totalPages, startPage + showPages - 1);

  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Phân trang"
      className={cn(
        'flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 select-none py-2',
        className,
      )}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
        className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:border-slate-200 text-slate-600 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            className="h-8 min-w-[2rem] px-2.5 text-xs font-semibold tabular-nums rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            1
          </Button>
          {startPage > 2 && (
            <span className="px-1 text-xs text-slate-400 select-none">…</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
          aria-current={currentPage === page ? 'page' : undefined}
          className={cn(
            'h-8 min-w-[2rem] px-2.5 text-xs font-semibold tabular-nums rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-500',
            currentPage === page
              ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm border-transparent'
              : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50',
          )}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-1 text-xs text-slate-400 select-none">…</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="h-8 min-w-[2rem] px-2.5 text-xs font-semibold tabular-nums rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
        className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:border-slate-200 text-slate-600 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
