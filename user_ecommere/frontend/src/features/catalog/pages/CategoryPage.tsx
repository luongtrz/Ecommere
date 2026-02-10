import { useParams, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { SEO } from '@/lib/seo';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { Search, ShoppingBag, Grid3X3, List, Filter, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { FilterSidebar } from '../components/FilterSidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sort') || 'newest';
  const viewMode = searchParams.get('view') || 'grid';
  const searchQuery = searchParams.get('q') || '';

  // Filter params
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;
  const scent = searchParams.get('scent') || undefined;
  const volumeMl = searchParams.get('volumeMl') || undefined;
  const brand = searchParams.get('brand') || undefined;

  const { data: category, isLoading: isCategoryLoading } = useCategoryBySlug(categorySlug!);
  const { data: products, isLoading: isProductsLoading } = useProducts({
    categorySlug,
    sortBy: sortBy as any,
    search: searchQuery || undefined,
    minPrice,
    maxPrice,
    scent,
    volumeMl,
    brand,
  });
  const { addItem } = useCart();

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    if (!('page' in updates)) {
      newParams.set('page', '1');
    }
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSortChange = (value: string) => {
    updateParams({ sort: value, page: '1' });
  };

  const handleSearchChange = (value: string) => {
    updateParams({ q: value || undefined, page: '1' });
  };

  const handleViewToggle = (mode: string) => {
    updateParams({ view: mode });
  };

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    updateParams({ ...filters, page: '1' });
  }, [updateParams]);

  const handleAddToCart = (product: any, variant: any) => {
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      image: product.images[0],
      price: variant.salePrice || variant.price,
      scent: variant.scent,
      volumeMl: variant.volumeMl,
    });
  };

  const clearFilters = () => {
    setSearchParams({ view: viewMode });
  };

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <EmptyState
            title="Không tìm thấy danh mục"
            description="Danh mục không tồn tại"
          />
        </div>
      </div>
    );
  }

  // Filter sidebar content (ẩn category filter vì đang ở trong 1 danh mục)
  const filterContent = (
    <FilterSidebar
      currentFilters={{
        minPrice,
        maxPrice,
        scent,
        volumeMl,
        brand,
      }}
      onFilterChange={handleFilterChange}
      hideCategoryFilter={true}
    />
  );

  return (
    <>
      <SEO title={category.name} description={category.description} />

      <div className="min-h-screen bg-gray-50/50">
        {/* Compact Header - giống CatalogPage */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div className="container py-4">
            {/* Breadcrumb nhỏ */}
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: category.name },
              ]}
              className="mb-2"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{category.name}</h1>
                <p className="text-xs text-gray-500 hidden md:block">{products?.total || 0} sản phẩm</p>
              </div>

              {/* Compact Toolbar - giống CatalogPage */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-9 pl-9 text-sm bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-200 rounded-full p-0.5">
                      <X className="h-3 w-3 text-gray-500" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 border-l pl-2 ml-2 border-gray-200">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-9 w-[130px] text-xs border-0 bg-transparent hover:bg-gray-50 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewToggle('grid')}
                      className={`h-7 w-7 p-0 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewToggle('list')}
                      className={`h-7 w-7 p-0 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Mobile Filter Trigger */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0 lg:hidden">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Bộ lọc</SheetTitle>
                      </SheetHeader>
                      <div className="py-4">
                        {filterContent}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar - giống CatalogPage */}
        <div className="container py-6 min-h-[60vh]">
          <div className="flex gap-6">
            {/* Sidebar - Desktop only */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20 bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-y-auto max-h-[calc(100vh-6rem)]">
                {filterContent}
              </div>
            </aside>

            {/* Products */}
            <div className="flex-1 min-w-0">
              {isProductsLoading ? (
                <div className="py-20 flex justify-center"><LoadingSpinner /></div>
              ) : products?.products.length === 0 ? (
                <EmptyState
                  title="Không tìm thấy sản phẩm"
                  description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
                  action={<Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>}
                />
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className={`${viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                    : 'space-y-4'
                    }`}>
                    {products?.products.map((product) => (
                      viewMode === 'grid' ? (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          slug={product.slug}
                          images={product.images}
                          price={product.basePrice}
                          rating={product.rating}
                          reviewCount={product.reviewCount}
                          onAddToCart={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                        />
                      ) : (
                        <div key={product.id} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <div className="flex items-center text-amber-500">
                                <span className="mr-0.5">&#9733;</span> {product.rating?.toFixed(1)}
                              </div>
                              <span>|</span>
                              <span>{product.reviewCount} đánh giá</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {product.variants.slice(0, 3).map((v: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                  {v.scent}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="font-bold text-blue-600">{formatCurrency(product.basePrice)}</span>
                              <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => product.variants[0] && handleAddToCart(product, product.variants[0])}>
                                <ShoppingBag className="h-3 w-3 mr-1.5" /> Thêm
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
