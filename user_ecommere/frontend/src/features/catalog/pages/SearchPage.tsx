import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SEO } from '@/lib/seo';
import { useProductSearch } from '../hooks/useProducts';
import type { Product, ProductFilters } from '../api/products.api';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Pagination } from '@/components/common/Pagination';
import { FilterSidebar } from '../components/FilterSidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Package, Grid3X3, List, ShoppingBag, X } from 'lucide-react';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const viewMode = searchParams.get('view') || 'grid';
  const category = searchParams.get('category') || searchParams.get('categorySlug') || undefined;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const scent = searchParams.get('scent') || undefined;
  const volumeMl = searchParams.get('volumeMl') || undefined;
  const brand = searchParams.get('brand') || undefined;

  const [showFilters, setShowFilters] = useState(true);
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const searchFilters: ProductFilters = {
    sortBy: sortBy as any,
    ...(category ? { categorySlug: category } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(scent ? { scent } : {}),
    ...(volumeMl ? { volumeMl } : {}),
    ...(brand ? { brand } : {}),
  };

  const { data, isLoading, isPlaceholderData } = useProductSearch(
    query,
    searchFilters,
    page
  );
  const { addItem } = useCart();

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (debouncedSearch !== query) {
      const nextParams = new URLSearchParams(searchParams);
      if (debouncedSearch.trim()) {
        nextParams.set('q', debouncedSearch.trim());
      } else {
        nextParams.delete('q');
      }
      nextParams.set('page', '1');
      setSearchParams(nextParams);
    }
  }, [debouncedSearch, query, searchParams, setSearchParams]);

  useEffect(() => {
    if (!data || isPlaceholderData) return;
    setAllProducts(data.products);
  }, [data, isPlaceholderData]);

  const productsToShow =
    allProducts.length > 0
      ? allProducts
      : page === 1 && data && !isPlaceholderData
      ? data.products
      : (data?.products || []);

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', value);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleViewToggle = (mode: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', mode);
    setSearchParams(nextParams);
  };

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!('page' in updates)) {
      nextParams.set('page', '1');
    }
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', '1');
    Object.entries(filters).forEach(([key, value]) => {
      const paramKey = key === 'categorySlug' ? 'category' : key;
      if (value === undefined || value === '') {
        nextParams.delete(paramKey);
        if (key === 'categorySlug') nextParams.delete('categorySlug');
      } else {
        nextParams.set(paramKey, value);
      }
    });
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const handleFilterClick = () => {
    setShowFilters((prev) => !prev);
  };

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

  const clearSearch = () => {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const clearFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    nextParams.delete('categorySlug');
    nextParams.delete('minPrice');
    nextParams.delete('maxPrice');
    nextParams.delete('scent');
    nextParams.delete('volumeMl');
    nextParams.delete('brand');
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // Active filter chips (matching CategoryPage / CatalogPage pattern)
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (category) {
      chips.push({
        id: 'category',
        label: `Danh mục: ${category}`,
        onRemove: () => handleFilterChange({ categorySlug: undefined }),
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
  }, [category, minPrice, maxPrice, scent, volumeMl, brand, handleFilterChange, updateParams]);

  const isInitialLoading =
    (isLoading || isPlaceholderData) && productsToShow.length === 0 && !!query;

  const filterContent = (
    <FilterSidebar
      currentFilters={{
        categorySlug: category,
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
      <SEO title={`Tìm kiếm: ${query}`} />

      <div className="min-h-screen bg-background">
        <div className="container section-y">
          {/* Page Header */}
          <header className="border-b border-border pb-6 mb-8 md:mb-10">
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: 'Tìm kiếm' },
              ]}
              className="mb-4"
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                  {query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-[65ch]">
                  <span className="tabular">{data?.total || 0}</span> sản phẩm
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:w-60 md:w-56 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="h-11 sm:h-10 pl-9 pr-9 text-sm rounded-md bg-background border-border"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Hide sort, filter, view mode toggles when data?.total === 0 */}
                {(!data || data.total > 0) && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mobile Filter Trigger */}
                    <div className="lg:hidden flex-1 sm:flex-initial">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            size="default"
                            className="lg:hidden h-11 w-full sm:w-auto gap-2 rounded-md border-border bg-background hover:bg-secondary text-foreground"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Bộ lọc</span>
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

                    {/* Desktop Filter Toggle Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden lg:flex items-center gap-2 h-10 rounded-md border-border bg-background hover:bg-secondary text-foreground"
                      onClick={handleFilterClick}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Bộ lọc</span>
                    </Button>

                    {/* Sort */}
                    <div className="flex-1 sm:flex-initial">
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-11 sm:h-10 w-full sm:w-[150px] md:w-[160px] text-sm rounded-md bg-background border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover rounded-md shadow-md border-border">
                          {PRODUCT_SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-sm">
                              {option.label}
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
                        className={`h-8 w-8 p-0 rounded-sm ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        aria-label="Xem dạng lưới"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewToggle('list')}
                        className={`h-8 w-8 p-0 rounded-sm ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        aria-label="Xem dạng danh sách"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Results Section */}
          {isInitialLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : data && data.total === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Search className="h-12 w-12 text-muted-foreground stroke-1" />}
                title="Không tìm thấy sản phẩm"
                description={`Không có sản phẩm nào khớp với từ khóa "${query}". Hãy thử tìm kiếm với từ khóa khác.`}
                action={
                  <Button asChild className="h-11 sm:h-10 rounded-md">
                    <Link to="/catalog" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Xem tất cả sản phẩm
                    </Link>
                  </Button>
                }
              />

              {/* Search Suggestions */}
              <div className="mt-12 max-w-2xl mx-auto text-center">
                <h3 className="text-sm font-semibold text-foreground mb-4">Gợi ý tìm kiếm:</h3>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {[
                    'Nước hoa chanh',
                    'Nước hoa bạc hà',
                    'Nước hoa dâu',
                    'Nước hoa cam',
                    'Nước hoa vanilla',
                    'Nước hoa lavender',
                    'Nước hoa trà xanh',
                  ].map((suggestion, idx) => (
                    <button
                      key={`${suggestion}-${idx}`}
                      type="button"
                      onClick={() => setSearchInput(suggestion)}
                      className="min-h-11 px-4 py-2 flex items-center justify-center rounded-full border border-border bg-card text-sm text-foreground hover:border-foreground/30 hover:bg-secondary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 items-start">
              {/* Sidebar - Desktop only */}
              {showFilters && (
                <aside className="hidden lg:block">
                  <div className="lg:sticky lg:top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    <div className="surface p-5">
                      {filterContent}
                    </div>
                  </div>
                </aside>
              )}

              {/* Products Column */}
              <div className={showFilters ? 'min-w-0' : 'min-w-0 lg:col-span-2'}>
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

                {/* Product Grid / List */}
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6'
                      : 'space-y-4'
                  }
                >
                  {productsToShow.map((product) =>
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
                      <Card key={product.id} className="p-4 md:p-5 border border-border bg-card rounded-lg hover:border-foreground/30 transition-colors shadow-none">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-secondary rounded-lg overflow-hidden shrink-0 mx-auto sm:mx-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 leading-snug">
                                {product.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 text-foreground">
                                  <span className="text-accent text-sm" aria-hidden="true">&#9733;</span>
                                  <span className="font-medium tabular">
                                    {product.rating?.toFixed(1) || '0.0'}
                                  </span>
                                </div>
                                <span>·</span>
                                <span className="tabular">({product.reviewCount || 0} đánh giá)</span>
                                <span>·</span>
                                <Badge variant="outline" className="text-xs rounded-sm font-normal">
                                  {product.variants?.length || 0} biến thể
                                </Badge>
                              </div>
                              {product.description && (
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2 max-w-[65ch]">
                                  {product.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {product.variants?.slice(0, 3).map((variant: any, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs rounded-sm font-normal">
                                    {variant.scent} - {variant.volumeMl}ml
                                  </Badge>
                                ))}
                                {product.variants && product.variants.length > 3 && (
                                  <Badge variant="outline" className="text-xs rounded-sm font-normal">
                                    +{product.variants.length - 3} nữa
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                              <div className="text-base sm:text-lg font-semibold text-foreground tabular">
                                {formatCurrency(product.basePrice)}
                              </div>
                              <Button
                                size="sm"
                                className="h-11 sm:h-9 rounded-md text-sm transition-colors"
                                onClick={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                              >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Thêm vào giỏ
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  )}
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex justify-center pt-10 mt-8 border-t border-border">
                    <Pagination
                      currentPage={page}
                      totalPages={data.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
