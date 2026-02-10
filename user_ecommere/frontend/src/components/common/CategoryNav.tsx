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

  // Filter root categories (no parentId)
  const rootCategories = categories?.filter(c => !c.parentId) || [];

  // Get subcategories for active category
  const subCategories = activeCategory
    ? categories?.filter(c => c.parentId === activeCategory.id) || []
    : [];

  const isActive = (path: string) => {
    if (path === '/catalog') {
      return location.pathname === '/catalog';
    }
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
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
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
      <div className="bg-white/60 backdrop-blur-lg border-b border-gray-100 hidden md:block">
        <div className="container">
          <div className="flex gap-8 py-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={navRef}
      className="bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm relative z-20 hidden md:block"
      onMouseLeave={() => setActiveCategory(null)}
    >
      <div className="container relative px-8">
        {/* Scroll Arrows */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <ul
          ref={scrollContainerRef}
          className="flex items-center gap-8 overflow-x-auto scrollbar-hide py-4 scroll-smooth"
        >
          <li className="shrink-0">
            <Link
              to="/catalog"
              className={cn(
                "text-sm font-semibold transition-colors hover:text-blue-600 uppercase tracking-wide whitespace-nowrap",
                isActive('/catalog') ? "text-blue-600" : "text-gray-600"
              )}
              onMouseEnter={() => setActiveCategory(null)}
            >
              Tất cả sản phẩm
            </Link>
          </li>

          {/* Root Categories */}
          {rootCategories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                to={`/c/${category.slug}`}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-blue-600 uppercase tracking-wide flex items-center gap-1 whitespace-nowrap",
                  isActive(`/c/${category.slug}`) || activeCategory?.id === category.id ? "text-blue-600" : "text-gray-600"
                )}
                onMouseEnter={(e) => handleMouseEnter(category, e)}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Simplified Dropdown Panel */}
      <div
        style={{ left: menuPosition }}
        className={cn(
          "absolute top-full bg-white border border-gray-100 shadow-xl rounded-b-xl rounded-r-xl transition-all duration-200 min-w-[240px] z-10",
          activeCategory
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2 pointer-events-none"
        )}
      >
        {activeCategory && (
          <div className="py-2">
            {subCategories.length > 0 ? (
              <div className="flex flex-col">
                {subCategories.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/c/${sub.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
                <div className="border-t border-gray-50 mt-1 pt-1">
                  <Link
                    to={`/c/${activeCategory.slug}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 flex items-center gap-1 hover:bg-gray-50"
                  >
                    Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                Chưa có danh mục con
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
