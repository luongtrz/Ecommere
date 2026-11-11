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
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
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
      <div className="border-b border-border bg-card">
        <div className="container">
          <div className="flex gap-6 py-2.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={navRef}
      className="relative z-10 border-b border-border bg-card"
      onMouseLeave={() => setActiveCategory(null)}
    >
      <div className="container relative">
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {showRightArrow && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <ul
          ref={scrollContainerRef}
          className="scrollbar-hide flex items-center gap-6 overflow-x-auto py-2.5 scroll-smooth"
        >
          <li className="shrink-0">
            <Link
              to="/catalog"
              className={cn(
                'relative block whitespace-nowrap py-1 text-sm font-medium transition-colors',
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
            const active = isActive(`/c/${category.slug}`) || activeCategory?.id === category.id;
            return (
              <li key={category.id} className="shrink-0">
                <Link
                  to={`/c/${category.slug}`}
                  className={cn(
                    'relative block whitespace-nowrap py-1 text-sm font-medium transition-colors',
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

      {/* Dropdown */}
      <div
        style={{ left: menuPosition }}
        className={cn(
          'absolute top-full z-20 mt-1 min-w-[210px] rounded-md border border-border bg-popover p-1 shadow-md transition-opacity duration-150',
          activeCategory
            ? 'visible opacity-100'
            : 'pointer-events-none invisible opacity-0',
        )}
      >
        {activeCategory && (
          <div className="flex flex-col gap-0.5">
            {subCategories.length > 0 ? (
              <>
                {subCategories.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/c/${sub.slug}`}
                    className="block rounded-sm px-3 py-2 text-sm font-medium text-popover-foreground transition-colors hover:bg-muted"
                  >
                    {sub.name}
                  </Link>
                ))}
                <div className="mt-1 border-t border-border pt-1">
                  <Link
                    to={`/c/${activeCategory.slug}`}
                    className="block rounded-sm px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted"
                  >
                    Xem tất cả
                  </Link>
                </div>
              </>
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Chưa có danh mục con
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
