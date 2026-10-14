import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium', className)} aria-label="Breadcrumb">
      <Link
        to="/"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Home className="h-4 w-4 shrink-0" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-foreground tracking-tight" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
