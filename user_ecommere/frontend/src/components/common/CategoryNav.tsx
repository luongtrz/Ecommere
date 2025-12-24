import { Link, useLocation } from 'react-router-dom';
import { useCategories } from '@/features/catalog/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CategoryNav() {
  const { data: categories, isLoading } = useCategories();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/catalog') {
      return location.pathname === '/catalog';
    }
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="bg-white border-b shadow-sm">
        <div className="container">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="container">
        <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
          <Link
            to="/catalog"
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              isActive('/catalog')
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            Tất cả sản phẩm
          </Link>
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/c/${category.slug}`}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                isActive(`/c/${category.slug}`)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
