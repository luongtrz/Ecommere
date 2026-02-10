import { Link, useLocation } from 'react-router-dom';
import { useCategories } from '@/features/catalog/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getImageUrl } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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
    <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm relative z-30 hidden md:block">
      <div className="container">
        <ul className="flex items-center gap-8">
          <li className="py-4">
            <Link
              to="/catalog"
              className={cn(
                "text-sm font-semibold transition-colors hover:text-blue-600 uppercase tracking-wide",
                isActive('/catalog') ? "text-blue-600" : "text-gray-600"
              )}
            >
              Tất cả sản phẩm
            </Link>
          </li>

          {/* Mega Menu Items */}
          {categories?.map((category) => (
            <li key={category.id} className="group py-4">
              <Link
                to={`/c/${category.slug}`}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-blue-600 uppercase tracking-wide flex items-center gap-1",
                  isActive(`/c/${category.slug}`) ? "text-blue-600" : "text-gray-600"
                )}
              >
                {category.name}
              </Link>

              {/* Mega Menu Dropdown */}
              <div className="absolute left-0 top-full w-full bg-white border-t border-gray-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover:translate-y-0">
                <div className="container py-8">
                  <div className="grid grid-cols-12 gap-8">
                    {/* Left: Subcategories (Mocked if empty) */}
                    <div className="col-span-3 border-r border-gray-100 pr-8">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-blue-600 rounded-full" />
                        Danh mục con
                      </h3>
                      <ul className="space-y-3">
                        {/* Mock subcategories as they might not exist in API yet */}
                        {['Hàng mới về', 'Bán chạy nhất', 'Giảm giá sốc', 'Combo tiết kiệm'].map((sub, idx) => (
                          <li key={idx}>
                            <Link to={`/c/${category.slug}`} className="text-gray-500 hover:text-blue-600 hover:pl-2 transition-all block text-sm">
                              {sub}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant="link" className="px-0 mt-4 text-blue-600">
                        <Link to={`/c/${category.slug}`}>
                          Xem tất cả <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    {/* Middle: Featured Description */}
                    <div className="col-span-4 pr-8">
                      <h3 className="font-bold text-gray-900 mb-4">Giới thiệu</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        Khám phá bộ sưu tập {category.name} đẳng cấp từ Thai Spray.
                        Hương thơm độc quyền, thiết kế sang trọng, mang lại trải nghiệm tuyệt vời cho không gian của bạn.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="font-bold text-blue-600 text-lg">100%</div>
                          <div className="text-xs text-gray-500">Chính hãng</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="font-bold text-blue-600 text-lg">24h</div>
                          <div className="text-xs text-gray-500">Giao hàng</div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Featured Image */}
                    <div className="col-span-5 relative overflow-hidden rounded-xl bg-gray-100 aspect-[2/1] group/image">
                      {category.description && category.description.startsWith('http') ? (
                        <img
                          src={getImageUrl(category.description)}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-300">
                          <span className="text-6xl font-black opacity-20 uppercase">{category.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                        <div className="text-white">
                          <div className="font-bold text-xl mb-1">{category.name} Collection</div>
                          <div className="text-sm opacity-90">Khám phá ngay</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Need to import Button
import { Button } from '@/components/ui/button';
