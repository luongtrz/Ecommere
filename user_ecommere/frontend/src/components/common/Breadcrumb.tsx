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
    <nav className={cn('flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground', className)} aria-label="Breadcrumb">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Trang chủ">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link to={item.href} className="text-muted-foreground hover:text-foreground hover:underline transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground" aria-current="page">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
