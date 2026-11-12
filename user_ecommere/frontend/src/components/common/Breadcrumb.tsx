import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // If the items passed in start with an item for Home ('/' or 'Trang chủ'),
  // skip it because Breadcrumb already renders the root Home icon link first.
  const filteredItems = items.filter((item, index) => {
    if (index === 0) {
      const isHomeHref = item.href === '/';
      const isHomeLabel = item.label?.trim().normalize('NFC').toLowerCase() === 'trang chủ';
      if (isHomeHref || isHomeLabel) {
        return false;
      }
    }
    return true;
  });

  return (
    <nav
      className={cn(
        'flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide py-1',
        className,
      )}
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="inline-flex items-center justify-center min-h-11 min-w-11 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Trang chủ"
      >
        <Home className="h-4 w-4" />
      </Link>
      {filteredItems.map((item, index) => (
        <div key={item.href ?? `${index}-${item.label}`} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link
              to={item.href}
              className="inline-flex items-center min-h-11 py-2 text-muted-foreground hover:text-foreground hover:underline transition-colors shrink-0"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="inline-flex items-center min-h-11 py-2 font-medium text-foreground truncate max-w-[180px] sm:max-w-none"
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
