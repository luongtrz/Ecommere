import { useSearchParams } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { PAGINATION, PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Grid3X3,
  List,
  ShoppingBag,
  X,
  Filter,
  Star,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterSidebar } from '../components/FilterSidebar';

function parseNumericParam(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number,
): number;
function parseNumericParam(
  value: string | null,
  defaultValue: undefined,
  min?: number,
  max?: number,
): number | undefined;
function parseNumericParam(
  value: string | null,
  defaultValue: number | undefined,
  min?: number,
  max?: number,
): number | undefined {
  if (value === null || value === undefined || value.trim() === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  if (min !== undefined && parsed < min) {
    return defaultValue;
  }
  if (max !== undefined && parsed > max) {
    return defaultValue;
  }
  return parsed;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const page = parseNumericParam(searchParams.get('page'), 1, 1);
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';
  const viewMode = searchParams.get('view') || 'grid';

  // Debounced search: local state for input, debounce before updating URL
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Filter params
  const categorySlug = searchParams.get('category') || undefined;
  const minPrice = parseNumericParam(
    searchParams.get('minPrice'),
    undefined,
    0,
  );
  const maxPrice = parseNumericParam(
    searchParams.get('maxPrice'),
    undefined,
    0,
  );
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

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
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
    },
    [searchParams, setSearchParams],
  );

  // Apply debounced search to URL params
  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      updateParams({ q: debouncedSearch || undefined, page: '1' });
    }
  }, [debouncedSearch, searchQuery, updateParams]);

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const handleSortChange = (value: string) => {
    updateParams({ sort: value, page: '1' });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleAddToCart = (product: any, variant: any) => {
    if (!variant || variant.stock === 0) return;

    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      image: product.images[0],
      price: variant.salePrice ?? variant.price,
      scent: variant.scent,
      volumeMl: variant.volumeMl,
    });
  };

  const handleFilterChange = useCallback(
    (filters: Record<string, string | undefined>) => {
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
    },
    [updateParams],
  );

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

      <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-sm transition-all duration-200">
          <div className="container px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Heading & Eyebrow */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="uppercase tracking-wider text-[10px] font-bold text-teal-600 mb-0.5">
                    Bộ sưu tập
                  </p>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-sans font-bold text-slate-900 tracking-tight">
                      Sản phẩm
                    </h1>
                    <span className="text-xs text-slate-500 font-sans tabular-nums font-normal">
                      {data?.total || 0} kết quả tìm thấy
                    </span>
                  </div>
                </div>

                {/* Desktop Filter Toggle Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`hidden lg:flex items-center gap-2 h-9 rounded-lg px-4 border border-slate-200 text-xs font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 transition-all duration-200 ${
                    showFilters
                      ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>{showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}</span>
                </Button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative flex-1 sm:w-60 min-w-[130px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-9 pl-9 pr-8 text-xs bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:ring-offset-0 transition-all duration-200"
                  />
                  {searchInput && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:bg-slate-100 rounded-full p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-9 w-[135px] sm:w-[145px] text-xs border border-slate-200 bg-white hover:bg-slate-50 font-medium text-slate-700 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-md">
                    {PRODUCT_SORT_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs rounded-lg font-medium py-2 px-2.5 focus:bg-teal-50 focus:text-teal-700 cursor-pointer transition-colors duration-150"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewToggle('grid')}
                    aria-label="Xem lưới"
                    className={`h-7 w-7 p-0 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-sm text-teal-600 font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewToggle('list')}
                    aria-label="Xem danh sách"
                    className={`h-7 w-7 p-0 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      viewMode === 'list'
                        ? 'bg-white shadow-sm text-teal-600 font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Mobile Filter Trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg lg:hidden border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 transition-all duration-200"
                      aria-label="Mở bộ lọc"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[85vw] max-w-xs overflow-y-auto border-r border-slate-200 bg-white p-6 shadow-xl"
                  >
                    <SheetHeader className="mb-4 text-left">
                      <SheetTitle className="font-sans font-bold text-lg text-slate-900 tracking-tight">
                        Bộ lọc
                      </SheetTitle>
                    </SheetHeader>
                    <div className="py-2">{filterContent}</div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="container px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-[60vh]">
          <div className="flex gap-8">
            {/* Sidebar - Desktop only */}
            {showFilters && (
              <aside className="hidden lg:block w-64 shrink-0 animate-in slide-in-from-left-2 duration-300 fade-in">
                <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-y-auto max-h-[calc(100vh-8.5rem)]">
                  {filterContent}
                </div>
              </aside>
            )}

            {/* Products */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="py-24 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 shadow-sm">
                  <LoadingSpinner />
                </div>
              ) : data?.products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-16 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                  <EmptyState
                    title="Không tìm thấy sản phẩm"
                    description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
                    action={
                      <Button
                        variant="outline"
                        className="h-10 rounded-lg border-slate-200 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 text-slate-700 font-semibold px-6 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 transition-all duration-200"
                        onClick={clearFilters}
                      >
                        Xóa bộ lọc
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div
                    className={`${
                      viewMode === 'grid'
                        ? `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${!showFilters ? 'xl:grid-cols-5' : ''} gap-3 sm:gap-4 md:gap-6`
                        : 'space-y-4'
                    }`}
                  >
                    {data?.products.map((product) =>
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
                          variants={product.variants}
                          onAddToCart={() =>
                            product.variants[0] &&
                            handleAddToCart(product, product.variants[0])
                          }
                        />
                      ) : (
                        <div
                          key={product.id}
                          className="group flex flex-col sm:flex-row gap-4 md:gap-6 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <div className="relative w-full sm:w-32 md:w-36 aspect-square sm:aspect-auto sm:h-36 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={getImageUrl(product.images[0], {
                                width: 300,
                              })}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                              <p className="uppercase tracking-wider text-[10px] font-bold text-teal-600 mb-1">
                                Thai Spray
                              </p>
                              <h3 className="font-sans font-bold text-slate-900 tracking-tight truncate text-base md:text-lg mb-1 group-hover:text-teal-600 transition-colors duration-200">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-slate-700 tabular-nums font-semibold">
                                    {product.rating?.toFixed(1) || '5.0'}
                                  </span>
                                </div>
                                <span>·</span>
                                <span className="tabular-nums">
                                  {product.reviewCount} đánh giá
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {product.variants.slice(0, 3).map((v, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[10px] h-5 px-2 font-normal rounded-md border border-slate-200 bg-slate-100 text-slate-700"
                                  >
                                    {v.scent}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              <span className="font-sans font-bold text-rose-600 text-base md:text-lg tabular-nums tracking-tight">
                                {formatCurrency(product.basePrice)}
                              </span>
                              <Button
                                size="sm"
                                className="h-9 rounded-lg px-4 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 transition-all duration-200"
                                onClick={() =>
                                  product.variants[0] &&
                                  handleAddToCart(product, product.variants[0])
                                }
                              >
                                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />{' '}
                                Thêm vào giỏ
                              </Button>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {data && data.totalPages > 1 && (
                    <div className="flex justify-center pt-8 border-t border-slate-200">
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
