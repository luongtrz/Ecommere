import { useParams, useSearchParams } from 'react-router-dom';
import { useCallback, useState, useEffect, useRef } from 'react';
import { SEO } from '@/lib/seo';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Pagination } from '@/components/common/Pagination';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAGINATION, PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import {
  Search,
  ShoppingBag,
  Grid3X3,
  List,
  Filter,
  X,
  Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { FilterSidebar } from '../components/FilterSidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const sortBy = searchParams.get('sort') || 'newest';
  const viewMode = searchParams.get('view') || 'grid';
  const searchQuery = searchParams.get('q') || '';

  // Track category changes to reset page to 1
  const prevCategorySlugRef = useRef(categorySlug);
  const isCategoryChanged = prevCategorySlugRef.current !== categorySlug;
  const currentPage = isCategoryChanged ? 1 : page;

  useEffect(() => {
    if (prevCategorySlugRef.current !== categorySlug) {
      prevCategorySlugRef.current = categorySlug;
      if (searchParams.get('page') && searchParams.get('page') !== '1') {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', '1');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [categorySlug, searchParams, setSearchParams]);

  // Debounced search: local state for input, debounce before updating URL
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Filter params
  const minPrice = searchParams.get('minPrice')
    ? parseInt(searchParams.get('minPrice')!)
    : undefined;
  const maxPrice = searchParams.get('maxPrice')
    ? parseInt(searchParams.get('maxPrice')!)
    : undefined;
  const scent = searchParams.get('scent') || undefined;
  const volumeMl = searchParams.get('volumeMl') || undefined;
  const brand = searchParams.get('brand') || undefined;

  const { data: category, isLoading: isCategoryLoading } = useCategoryBySlug(
    categorySlug!,
  );
  const { data: products, isLoading: isProductsLoading } = useProducts({
    page: currentPage,
    limit: PAGINATION.DEFAULT_LIMIT,
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

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
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
    },
    [searchParams, setSearchParams],
  );

  // Apply debounced search to URL params
  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      updateParams({ q: debouncedSearch || undefined, page: '1' });
    }
  }, [debouncedSearch, searchQuery, updateParams]);

  // Keep input in sync with URL changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const handleSortChange = (value: string) => {
    updateParams({ sort: value, page: '1' });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleViewToggle = (mode: string) => {
    updateParams({ view: mode });
  };

  const handleFilterChange = useCallback(
    (filters: Record<string, string | undefined>) => {
      updateParams({ ...filters, page: '1' });
    },
    [updateParams],
  );

  const handleAddToCart = (product: any, variant: any) => {
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

  const clearFilters = () => {
    setSearchParams({ view: viewMode });
  };

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
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

      <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container py-4 md:py-6">
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: category.name },
              ]}
              className="mb-3 text-xs"
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="uppercase tracking-wider text-[10px] font-semibold text-teal-600 mb-0.5">
                  Danh mục
                </p>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl md:text-3xl font-sans font-bold text-slate-900 tracking-tight">
                    {category.name}
                  </h1>
                  <span className="text-xs text-slate-500 font-sans tabular-nums font-normal">
                    {products?.total || 0} sản phẩm
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative flex-1 sm:w-60 min-w-[140px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-9 pl-9 pr-8 text-xs bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-all"
                  />
                  {searchInput && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:bg-slate-100 rounded-full p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-9 w-[145px] text-xs border border-slate-200 bg-white hover:bg-slate-50 font-medium text-slate-700 rounded-lg px-3 focus:ring-1 focus:ring-teal-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-md">
                    {PRODUCT_SORT_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs rounded-lg focus:bg-teal-50 focus:text-teal-700 cursor-pointer"
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
                    className={`h-7 w-7 p-0 rounded-md transition-all ${
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
                    className={`h-7 w-7 p-0 rounded-md transition-all ${
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
                      className="h-9 w-9 p-0 rounded-lg lg:hidden border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      aria-label="Mở bộ lọc"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[85vw] max-w-xs overflow-y-auto border-r border-slate-200 bg-white p-6"
                  >
                    <SheetHeader className="mb-4 text-left">
                      <SheetTitle className="font-sans font-bold text-lg text-slate-900">
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
        <div className="container py-8 md:py-12 min-h-[60vh]">
          <div className="flex gap-8">
            {/* Sidebar - Desktop only */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-y-auto max-h-[calc(100vh-8.5rem)]">
                {filterContent}
              </div>
            </aside>

            {/* Products */}
            <div className="flex-1 min-w-0">
              {isProductsLoading ? (
                <div className="py-24 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : products?.products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-16 text-center shadow-sm">
                  <EmptyState
                    title="Không tìm thấy sản phẩm"
                    description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
                    action={
                      <Button
                        variant="outline"
                        className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6"
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
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
                        : 'space-y-4'
                    }`}
                  >
                    {products?.products.map((product) =>
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
                          className="flex flex-col sm:flex-row gap-4 md:gap-6 bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <div className="w-full sm:w-32 md:w-36 aspect-square sm:aspect-auto sm:h-36 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={getImageUrl(product.images[0], {
                                width: 300,
                              })}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                              <p className="uppercase tracking-wider text-[10px] font-semibold text-teal-600 mb-1">
                                Thai Spray
                              </p>
                              <h3 className="font-sans font-semibold text-slate-900 truncate text-base md:text-lg mb-1">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-slate-700 tabular-nums">
                                    {product.rating?.toFixed(1) || '5.0'}
                                  </span>
                                </div>
                                <span>·</span>
                                <span className="tabular-nums">
                                  {product.reviewCount} đánh giá
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {product.variants
                                  .slice(0, 3)
                                  .map((v: any, i: number) => (
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
                              <span className="font-sans font-bold text-rose-600 text-base md:text-lg tabular-nums">
                                {formatCurrency(product.basePrice)}
                              </span>
                              <Button
                                size="sm"
                                className="h-9 rounded-lg px-4 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 transition-all duration-200 active:scale-95"
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

                  {products && products.totalPages > 1 && (
                    <div className="flex justify-center pt-8 border-t border-slate-200">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={products.totalPages}
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
