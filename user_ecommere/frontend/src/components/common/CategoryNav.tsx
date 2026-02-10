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
      <div className="bg-white/60 backdrop-blur-lg border-b border-gray-100">
        <div className="container">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-lg border-b border-gray-100 shadow-sm">
      <div className="container">
        <div className="flex gap-1.5 py-3 overflow-x-auto scrollbar-hide">
          <Link
            to="/catalog"
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
              isActive('/catalog')
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-600 hover:text-primary hover:bg-blue-50"
            )}
          >
            Tat ca san pham
          </Link>
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/c/${category.slug}`}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
                isActive(`/c/${category.slug}`)
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 hover:text-primary hover:bg-blue-50"
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
