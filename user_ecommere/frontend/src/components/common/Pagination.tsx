import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const showPages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);

  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className={cn('flex items-center justify-center gap-2', className)} aria-label="Phân trang">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
        className="h-11 w-11 min-h-11 min-w-11"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Mobile page indicator: Trang X / Y */}
      <span className="text-sm font-medium text-foreground px-2 sm:hidden tabular select-none">
        Trang {currentPage} / {totalPages}
      </span>

      {/* Desktop numbered list */}
      <div className="hidden sm:flex items-center gap-2">
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              className="h-11 w-11 min-h-11 min-w-11 tabular"
            >
              1
            </Button>
            {startPage > 2 && <span className="px-1 text-xs text-muted-foreground select-none" aria-hidden="true">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-11 w-11 min-h-11 min-w-11 tabular"
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-xs text-muted-foreground select-none" aria-hidden="true">...</span>}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              className="h-11 w-11 min-h-11 min-w-11 tabular"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
        className="h-11 w-11 min-h-11 min-w-11"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
