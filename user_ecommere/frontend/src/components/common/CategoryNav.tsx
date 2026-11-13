import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCategories } from '@/features/catalog/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function CategoryNav() {
  const { data: categories, isLoading } = useCategories();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const rootCategories = categories?.filter((c) => !c.parentId) || [];
  const subCategories = activeCategory
    ? categories?.filter((c) => c.parentId === activeCategory.id) || []
    : [];

  const isActive = (path: string) => {
    if (path === '/catalog') return location.pathname === '/catalog';
    return location.pathname.startsWith(path);
  };

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  useEffect(() => {
    const current = scrollContainerRef.current;
    if (current) {
      current.addEventListener('scroll', checkScroll);
      return () => current.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  const handleMouseEnter = (category: any, e: React.MouseEvent) => {
    setActiveCategory(category);
    if (navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = e.currentTarget.getBoundingClientRect();
      setMenuPosition(itemRect.left - navRect.left);
    }
  };

  if (isLoading) {
    return (
      <div className="border-b border-border bg-background">
        <div className="container">
          <div className="flex h-11 items-center gap-6 py-0">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasSubCategories = Boolean(activeCategory && subCategories.length > 0);

  return (
    <div
      ref={navRef}
      className="relative z-10 border-b border-border bg-background"
      onMouseLeave={() => setActiveCategory(null)}
    >
      <div className="container relative">
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {showRightArrow && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Mobile scroll hint edge fades */}
        {showLeftArrow && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-[5] w-8 bg-gradient-to-r from-background to-transparent md:hidden"
            aria-hidden="true"
          />
        )}
        {showRightArrow && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-[5] w-8 bg-gradient-to-l from-background to-transparent md:hidden"
            aria-hidden="true"
          />
        )}

        <ul
          ref={scrollContainerRef}
          className="scrollbar-hide flex h-11 items-center gap-6 overflow-x-auto py-0 scroll-smooth"
        >
          <li className="shrink-0">
            <Link
              to="/catalog"
              className={cn(
                'relative flex h-11 items-center whitespace-nowrap px-1 text-sm font-medium transition-colors',
                'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-accent after:transition-transform after:duration-150',
                isActive('/catalog')
                  ? 'text-foreground font-semibold after:scale-x-100'
                  : 'text-muted-foreground hover:text-foreground after:scale-x-0 hover:after:scale-x-100',
              )}
              onMouseEnter={() => setActiveCategory(null)}
            >
              Tất cả
            </Link>
          </li>

          {rootCategories.map((category) => {
            const active =
              isActive(`/c/${category.slug}`) ||
              activeCategory?.id === category.id;
            return (
              <li key={category.id} className="shrink-0">
                <Link
                  to={`/c/${category.slug}`}
                  className={cn(
                    'relative flex h-11 items-center whitespace-nowrap px-1 text-sm font-medium transition-colors',
                    'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-accent after:transition-transform after:duration-150',
                    active
                      ? 'text-foreground font-semibold after:scale-x-100'
                      : 'text-muted-foreground hover:text-foreground after:scale-x-0 hover:after:scale-x-100',
                  )}
                  onMouseEnter={(e) => handleMouseEnter(category, e)}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dropdown mega menu (only shown when category has subcategories) */}
      {hasSubCategories && (
        <div
          style={{ left: menuPosition }}
          className="absolute top-full z-20 mt-1 min-w-[210px] rounded-md border border-border bg-popover p-1 shadow-md transition-opacity duration-150 visible opacity-100"
        >
          <div className="flex flex-col gap-0.5">
            {subCategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/c/${sub.slug}`}
                className="flex min-h-11 items-center rounded-sm px-3 py-2 text-sm font-medium text-popover-foreground transition-colors hover:bg-muted"
              >
                {sub.name}
              </Link>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <Link
                to={`/c/${activeCategory.slug}`}
                className="flex min-h-11 items-center rounded-sm px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted"
              >
                Xem tất cả
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
