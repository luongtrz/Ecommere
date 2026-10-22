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
      aria-label="Pagination"
      className={cn(
        'flex items-center justify-center gap-1.5 md:gap-2 py-6 font-sans',
        className,
      )}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            onClick={() => onPageChange(1)}
            className="h-9 w-9 rounded-lg p-0 border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 tabular-nums"
          >
            1
          </Button>
          {startPage > 2 && (
            <span className="flex h-9 w-6 items-center justify-center text-xs font-sans text-slate-400 select-none">
              ...
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          onClick={() => onPageChange(page)}
          className={cn(
            'h-9 w-9 rounded-lg p-0 text-sm font-semibold tabular-nums transition-colors',
            currentPage === page
              ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
          )}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="flex h-9 w-6 items-center justify-center text-xs font-sans text-slate-400 select-none">
              ...
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => onPageChange(totalPages)}
            className="h-9 w-9 rounded-lg p-0 border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 tabular-nums"
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
        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 shadow-sm"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
