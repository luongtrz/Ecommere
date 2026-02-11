import { useSearchParams } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { PAGINATION, PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Grid3X3, List, ShoppingBag, X, Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FilterSidebar } from '../components/FilterSidebar';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';
  const viewMode = searchParams.get('view') || 'grid';

  // Filter params
  const categorySlug = searchParams.get('category') || undefined;
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;
  const scent = searchParams.get('scent') || undefined;
  const volumeMl = searchParams.get('volumeMl') || undefined;
  const brand = searchParams.get('brand') || undefined;

  const { data, isLoading } = useProducts({
    page,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: sortBy as any,
    search: searchQuery || undefined,
    categorySlug,
    minPrice,
    maxPrice,
    scent,
    volumeMl,
    brand,
  });

  const { addItem } = useCart();

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    // Reset page khi thay doi filter
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

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const handleSortChange = (value: string) => {
    updateParams({ sort: value, page: '1' });
  };

  const handleSearchChange = (value: string) => {
    updateParams({ q: value || undefined, page: '1' });
  };

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

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    // Map categorySlug -> category param for URL
    const mapped: Record<string, string | undefined> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'categorySlug') {
        mapped['category'] = value;
      } else {
        mapped[key] = value;
      }
    });
    updateParams({ ...mapped, page: '1' });
  }, [updateParams]);

  const clearFilters = () => {
    setSearchParams({ view: viewMode });
  };

  const handleViewToggle = (mode: string) => {
    updateParams({ view: mode });
  };

  // Filter sidebar content (dung chung cho desktop va mobile)
  const filterContent = (
    <FilterSidebar
      currentFilters={{
        categorySlug,
        minPrice,
        maxPrice,
        scent,
        volumeMl,
        brand,
      }}
      onFilterChange={handleFilterChange}
    />
  );

  return (
    <>
      <SEO title="Sản phẩm" />

      <div className="min-h-screen bg-gray-50/50">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sản phẩm</h1>
                <p className="text-xs text-gray-500 hidden md:block">{data?.total || 0} kết quả tìm thấy</p>
              </div>

              {/* Compact Toolbar */}
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

                  {/* Desktop Filter Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`hidden lg:flex items-center gap-2 h-9 ${showFilters ? 'bg-secondary' : 'border-dashed'}`}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="text-xs font-medium">{showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}</span>
                  </Button>

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

        {/* Main Content with Sidebar */}
        <div className="container py-6 min-h-[60vh]">
          <div className="flex gap-6">
            {/* Sidebar - Desktop only */}
            {showFilters && (
              <aside className="hidden lg:block w-64 shrink-0 animate-in slide-in-from-left-2 duration-300 fade-in">
                <div className="sticky top-20 bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-y-auto max-h-[calc(100vh-6rem)]">
                  {filterContent}
                </div>
              </aside>
            )}

            {/* Products */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="py-20 flex justify-center"><LoadingSpinner /></div>
              ) : data?.products.length === 0 ? (
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
                    {data?.products.map((product) => (
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
                              {product.variants.slice(0, 3).map((v, i) => (
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

                  {data && data.totalPages > 1 && (
                    <div className="flex justify-center pt-8 border-t border-gray-100">
                      <Pagination
                        currentPage={page}
                        totalPages={data.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
