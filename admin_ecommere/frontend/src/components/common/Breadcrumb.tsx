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
    <nav
      className={cn(
        'flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium',
        className,
      )}
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="inline-flex items-center text-slate-500 hover:text-teal-600 transition-colors p-1 rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <Home className="h-4 w-4 shrink-0" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <ChevronRight
            className="h-3.5 w-3.5 text-slate-300 shrink-0"
            aria-hidden="true"
          />
          {item.href ? (
            <Link
              to={item.href}
              className="text-slate-500 hover:text-teal-600 transition-colors hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="font-semibold text-slate-900 tracking-tight"
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
