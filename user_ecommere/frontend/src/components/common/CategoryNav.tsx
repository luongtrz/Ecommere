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
      <div className="bg-white border-b border-slate-100 hidden md:block">
        <div className="container">
          <div className="flex gap-6 py-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={navRef}
      className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 relative z-10 hidden md:block md:mx-auto md:max-w-7xl md:mt-2 md:rounded-2xl md:border md:border-slate-200/80 md:shadow-sm"
      onMouseLeave={() => setActiveCategory(null)}
    >
      <div className="container relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <ul
          ref={scrollContainerRef}
          className="flex items-center gap-7 overflow-x-auto scrollbar-hide py-3 scroll-smooth"
        >
          <li className="shrink-0">
            <Link
              to="/catalog"
              className={cn(
                'relative text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-teal-600 after:transition-transform after:duration-300',
                isActive('/catalog')
                  ? 'text-teal-700 after:scale-x-100'
                  : 'text-slate-600 hover:text-teal-700 after:scale-x-0 hover:after:scale-x-100',
              )}
              onMouseEnter={() => setActiveCategory(null)}
            >
              Tất cả
            </Link>
          </li>

          {rootCategories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                to={`/c/${category.slug}`}
                className={cn(
                  'relative text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-teal-600 after:transition-transform after:duration-300',
                  isActive(`/c/${category.slug}`) ||
                    activeCategory?.id === category.id
                    ? 'text-teal-700 after:scale-x-100'
                    : 'text-slate-600 hover:text-teal-700 after:scale-x-0 hover:after:scale-x-100',
                )}
                onMouseEnter={(e) => handleMouseEnter(category, e)}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Dropdown */}
      <div
        style={{ left: menuPosition }}
        className={cn(
          'absolute top-full border border-slate-200 bg-white rounded-2xl shadow-xl transition-all duration-150 min-w-[210px] z-10 p-1.5 mt-1',
          activeCategory
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-1 pointer-events-none',
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
                    className="block text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-3.5 py-2 transition-colors font-medium"
                  >
                    {sub.name}
                  </Link>
                ))}
                <div className="border-t border-dashed border-slate-100 mt-1 pt-1.5">
                  <Link
                    to={`/c/${activeCategory.slug}`}
                    className="block text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-xl px-3.5 py-2 transition-colors"
                  >
                    Xem tất cả
                  </Link>
                </div>
              </>
            ) : (
              <div className="px-3.5 py-2.5 text-xs text-slate-400">
                Chưa có danh mục con
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
