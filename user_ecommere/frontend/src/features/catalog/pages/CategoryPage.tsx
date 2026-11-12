import { useParams, useSearchParams } from 'react-router-dom';
import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { SEO } from '@/lib/seo';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Pagination } from '@/components/common/Pagination';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAGINATION, PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { Search, ShoppingBag, Grid3X3, List, Filter, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { FilterSidebar } from '../components/FilterSidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;
  const scent = searchParams.get('scent') || undefined;
  const volumeMl = searchParams.get('volumeMl') || undefined;
  const brand = searchParams.get('brand') || undefined;

  const { data: category, isLoading: isCategoryLoading } = useCategoryBySlug(categorySlug!);
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

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    updateParams({ ...filters, page: '1' });
  }, [updateParams]);

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

  const clearFilters = useCallback(() => {
    setSearchInput('');
    const newParams: Record<string, string> = {};
    const currentView = searchParams.get('view');
    if (currentView) {
      newParams.view = currentView;
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Active filter chips (excluding categorySlug since we are on CategoryPage)
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (searchQuery) {
      chips.push({
        id: 'q',
        label: `Tìm kiếm: "${searchQuery}"`,
        onRemove: () => {
          setSearchInput('');
          updateParams({ q: undefined, page: '1' });
        },
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      let priceLabel = '';
      if (minPrice !== undefined && maxPrice !== undefined) {
        priceLabel = `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
      } else if (minPrice !== undefined) {
        priceLabel = `Từ ${formatCurrency(minPrice)}`;
      } else if (maxPrice !== undefined) {
        priceLabel = `Đến ${formatCurrency(maxPrice)}`;
      }
      chips.push({
        id: 'price',
        label: priceLabel,
        onRemove: () => handleFilterChange({ minPrice: undefined, maxPrice: undefined }),
      });
    }

    if (scent) {
      scent.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
        chips.push({
          id: `scent-${s}`,
          label: s,
          onRemove: () => {
            const next = scent.split(',').map((x) => x.trim()).filter((x) => x && x !== s);
            updateParams({ scent: next.length > 0 ? next.join(',') : undefined, page: '1' });
          },
        });
      });
    }

    if (volumeMl) {
      volumeMl.split(',').map((v) => v.trim()).filter(Boolean).forEach((v) => {
        chips.push({
          id: `volume-${v}`,
          label: `${v}ml`,
          onRemove: () => {
            const next = volumeMl.split(',').map((x) => x.trim()).filter((x) => x && x !== v);
            updateParams({ volumeMl: next.length > 0 ? next.join(',') : undefined, page: '1' });
          },
        });
      });
    }

    if (brand) {
      brand.split(',').map((b) => b.trim()).filter(Boolean).forEach((b) => {
        chips.push({
          id: `brand-${b}`,
          label: b,
          onRemove: () => {
            const next = brand.split(',').map((x) => x.trim()).filter((x) => x && x !== b);
            updateParams({ brand: next.length > 0 ? next.join(',') : undefined, page: '1' });
          },
        });
      });
    }

    return chips;
  }, [searchQuery, minPrice, maxPrice, scent, volumeMl, brand, handleFilterChange, updateParams]);

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container section-y">
          <div className="border-b border-border pb-6 mb-8 md:mb-10">
            <div className="h-4 w-36 bg-muted rounded-sm animate-pulse mb-4" />
            <div className="h-9 w-64 bg-muted rounded-sm animate-pulse mb-2" />
            <div className="h-4 w-40 bg-muted rounded-sm animate-pulse" />
          </div>
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 items-start">
            <aside className="hidden lg:block">
              <div className="surface p-5 h-80 bg-muted/40 animate-pulse" />
            </aside>
            <div className="min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6" role="status" aria-label="Đang tải danh mục">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="aspect-[4/5] w-full bg-muted rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded-sm animate-pulse" />
                      <div className="h-3.5 w-1/3 bg-muted rounded-sm animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-[60vh] bg-background flex items-center justify-center p-4">
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

      <div className="min-h-screen bg-background">
        <div className="container section-y">
          {/* Page Header */}
          <header className="border-b border-border pb-6 mb-8 md:mb-10">
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: category.name },
              ]}
              className="mb-4"
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-[65ch]">
                    {category.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1 max-w-[65ch]">
                  <span className="tabular">{products?.total || 0}</span> sản phẩm
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                {/* Search */}
                <div className="relative hidden sm:block sm:w-60 md:w-56 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-10 pl-9 pr-8 text-sm rounded-md bg-background"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile Filter Trigger */}
                  <div className="lg:hidden flex-1 sm:flex-initial">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="default" className="lg:hidden h-11 w-full sm:w-auto gap-2 rounded-md">
                          <Filter className="h-4 w-4" />
                          <span>Lọc</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80 overflow-y-auto bg-card border-r border-border p-6">
                        <SheetHeader className="mb-4">
                          <SheetTitle className="text-foreground text-xl sm:text-2xl font-semibold leading-snug">Bộ lọc</SheetTitle>
                        </SheetHeader>
                        <div>
                          {filterContent}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Sort */}
                  <div className="flex-1 sm:flex-initial">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="h-11 sm:h-10 w-full sm:w-[150px] md:w-[160px] text-sm rounded-md bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover rounded-md shadow-md border-border">
                        {PRODUCT_SORT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-sm">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center border border-border rounded-md p-0.5 bg-muted">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewToggle('grid')}
                      className={`h-8 w-8 p-0 rounded-sm ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      aria-label="Xem dạng lưới"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewToggle('list')}
                      className={`h-8 w-8 p-0 rounded-sm ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      aria-label="Xem dạng danh sách"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Layout: two columns desktop */}
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 items-start">
            {/* Sidebar - Desktop only */}
            <aside className="hidden lg:block">
              <div className="lg:sticky lg:top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="surface p-5">
                  {filterContent}
                </div>
              </div>
            </aside>

            {/* Products Column */}
            <div className="min-w-0">
              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6" aria-label="Bộ lọc đang áp dụng">
                  <span className="text-xs text-muted-foreground">Bộ lọc:</span>
                  {activeChips.map((chip) => (
                    <span
                      key={chip.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-sm text-foreground"
                    >
                      <span>{chip.label}</span>
                      <button
                        type="button"
                        onClick={chip.onRemove}
                        className="hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full p-0.5"
                        aria-label={`Xóa bộ lọc ${chip.label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    Xóa tất cả
                  </Button>
                </div>
              )}

              {/* Product list / states */}
              {isProductsLoading ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6" role="status" aria-label="Đang tải sản phẩm">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="space-y-3">
                        <div className="aspect-[4/5] w-full bg-muted rounded-lg animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-3/4 bg-muted rounded-sm animate-pulse" />
                          <div className="h-3.5 w-1/3 bg-muted rounded-sm animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4" role="status" aria-label="Đang tải sản phẩm">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="flex gap-4 p-4 border border-border bg-card rounded-lg">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-muted rounded-lg shrink-0 animate-pulse" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 w-1/2 bg-muted rounded-sm animate-pulse" />
                          <div className="h-3 w-1/4 bg-muted rounded-sm animate-pulse" />
                          <div className="h-4 w-1/3 bg-muted rounded-sm animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : products?.products.length === 0 ? (
                <EmptyState
                  title="Không tìm thấy sản phẩm"
                  description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
                  action={
                    <Button variant="outline" className="h-11 sm:h-10 rounded-md" onClick={clearFilters}>
                      Xóa bộ lọc
                    </Button>
                  }
                />
              ) : (
                <div>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6'
                        : 'space-y-4'
                    }
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
                          onAddToCart={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                        />
                      ) : (
                        <div
                          key={product.id}
                          className="flex gap-4 p-4 border border-border bg-card rounded-lg transition-colors hover:border-foreground/30"
                        >
                          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                            <img
                              src={getImageUrl(product.images[0], { width: 200 })}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-foreground line-clamp-2 text-base leading-snug">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <div className="flex items-center text-accent font-semibold">
                                  <span className="mr-0.5" aria-hidden="true">&#9733;</span>
                                  <span className="tabular">{product.rating?.toFixed(1)}</span>
                                </div>
                                <span>|</span>
                                <span>
                                  <span className="tabular">{product.reviewCount}</span> đánh giá
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {product.variants?.slice(0, 3).map((v: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs h-5 px-2 font-normal rounded-sm">
                                    {v.scent}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground text-base tabular">
                                {formatCurrency(product.basePrice)}
                              </span>
                              <Button
                                size="sm"
                                className="h-11 sm:h-9 rounded-md text-sm transition-colors"
                                onClick={() => product.variants?.[0] && handleAddToCart(product, product.variants[0])}
                              >
                                <ShoppingBag className="h-4 w-4 mr-1.5" /> Thêm vào giỏ
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {products && products.totalPages > 1 && (
                    <div className="mt-12 flex justify-center pt-8 border-t border-border">
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
