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
    <nav className={cn('flex flex-wrap items-center gap-1.5 text-xs md:text-sm text-slate-500 font-sans', className)} aria-label="Breadcrumb">
      <Link
        to="/"
        className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {item.href ? (
            <Link to={item.href} className="font-medium text-slate-600 hover:text-teal-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
