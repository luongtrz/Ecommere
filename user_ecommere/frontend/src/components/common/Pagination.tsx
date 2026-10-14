import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = [];
  const showPages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5 md:gap-2 py-6', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-10 w-10 rounded-full border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            onClick={() => onPageChange(1)}
            className="h-10 w-10 rounded-full p-0 border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground tabular-nums"
          >
            1
          </Button>
          {startPage > 2 && <span className="flex h-10 w-6 items-center justify-center text-xs font-serif text-muted-foreground/60 select-none">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          onClick={() => onPageChange(page)}
          className={cn(
            'h-10 w-10 rounded-full p-0 tabular-nums transition-all duration-200',
            currentPage === page
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90'
              : 'border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="flex h-10 w-6 items-center justify-center text-xs font-serif text-muted-foreground/60 select-none">...</span>}
          <Button
            variant="outline"
            onClick={() => onPageChange(totalPages)}
            className="h-10 w-10 rounded-full p-0 border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground tabular-nums"
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
        className="h-10 w-10 rounded-full border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
