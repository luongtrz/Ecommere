import { useSearchParams, Link } from 'react-router-dom';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategoryTree } from '../hooks/useCategories';
import type { CategoryTreeNode } from '../api/categories.api';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductCard } from '@/components/common/ProductCard';
import { Breadcrumb } from '@/components/common/Breadcrumb';
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
  SlidersHorizontal,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { FilterSidebar } from '../components/FilterSidebar';

function findCategoryName(
  tree: CategoryTreeNode[] | undefined,
  slug: string | undefined,
): string | undefined {
  if (!tree || !slug) return undefined;
  for (const node of tree) {
    if (node.slug === slug) return node.name;
    if (node.children && node.children.length > 0) {
      const found = findCategoryName(node.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}

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

  const { data: categoryTree } = useCategoryTree();
  const activeCategoryName = useMemo(() => {
    return findCategoryName(categoryTree, categorySlug);
  }, [categoryTree, categorySlug]);

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

  // Keep input in sync with EXTERNAL URL changes (e.g. clearing a filter chip). Skip the echo of our
  // own debounced update, otherwise characters typed while that update was in flight get overwritten.
  // debouncedSearch is intentionally not a dependency: this must only run when the URL query changes.
  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setSearchInput(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const clearFilters = useCallback(() => {
    setSearchInput('');
    const newParams: Record<string, string> = {};
    if (viewMode && viewMode !== 'grid') {
      newParams.view = viewMode;
    }
    setSearchParams(newParams);
  }, [viewMode, setSearchParams]);

  const handleViewToggle = (mode: string) => {
    updateParams({ view: mode });
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> =
      [];

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

    if (categorySlug) {
      chips.push({
        id: 'category',
        label: `Danh mục: ${activeCategoryName || categorySlug}`,
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
        onRemove: () =>
          handleFilterChange({ minPrice: undefined, maxPrice: undefined }),
      });
    }

    if (scent) {
      scent
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => {
          chips.push({
            id: `scent-${s}`,
            label: s,
            onRemove: () => {
              const next = scent
                .split(',')
                .map((x) => x.trim())
                .filter((x) => x && x !== s);
              updateParams({
                scent: next.length > 0 ? next.join(',') : undefined,
                page: '1',
              });
            },
          });
        });
    }

    if (volumeMl) {
      volumeMl
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((v) => {
          chips.push({
            id: `volume-${v}`,
            label: `${v}ml`,
            onRemove: () => {
              const next = volumeMl
                .split(',')
                .map((x) => x.trim())
                .filter((x) => x && x !== v);
              updateParams({
                volumeMl: next.length > 0 ? next.join(',') : undefined,
                page: '1',
              });
            },
          });
        });
    }

    if (brand) {
      brand
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean)
        .forEach((b) => {
          chips.push({
            id: `brand-${b}`,
            label: b,
            onRemove: () => {
              const next = brand
                .split(',')
                .map((x) => x.trim())
                .filter((x) => x && x !== b);
              updateParams({
                brand: next.length > 0 ? next.join(',') : undefined,
                page: '1',
              });
            },
          });
        });
    }

    return chips;
  }, [
    searchQuery,
    categorySlug,
    activeCategoryName,
    minPrice,
    maxPrice,
    scent,
    volumeMl,
    brand,
    handleFilterChange,
    updateParams,
  ]);

  // Filter sidebar content
  const desktopFilterContent = (
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
      hideActiveFilters
    />
  );

  const mobileFilterContent = (
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
      hideHeader
      hideActiveFilters
    />
  );

  return (
    <>
      <SEO title="Sản phẩm" />

      <div className="min-h-screen bg-background">
        <div className="container section-y pb-24 md:pb-20">
          {/* Page Header */}
          <header className="border-b border-border pb-6 mb-8 md:mb-10">
            <Breadcrumb items={[{ label: 'Sản phẩm' }]} className="mb-4" />

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                  Sản phẩm
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-[65ch]">
                  <span className="tabular">{data?.total || 0}</span> kết quả
                  tìm thấy
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                {/* Search */}
                <div className="relative hidden md:block w-full sm:w-60 md:w-56 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm trong danh mục này..."
                    className="h-10 pl-9 pr-8 text-sm rounded-md bg-background"
                    aria-label="Tìm kiếm trong danh mục"
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
                  {/* Desktop Show/Hide Filter Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="hidden lg:inline-flex items-center gap-2 h-9 rounded-md text-sm"
                  >
                    <Filter className="h-4 w-4" />
                    <span>{showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}</span>
                  </Button>

                  {/* Mobile Filter Trigger */}
                  <div className="lg:hidden flex-1 sm:flex-initial">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="default"
                          className={`h-11 min-h-11 w-full sm:w-auto gap-2 rounded-md ${
                            activeChips.length > 0 ? 'border-primary/50' : ''
                          }`}
                        >
                          <Filter className="h-4 w-4" />
                          <span>Lọc</span>
                          {activeChips.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 h-5 px-1.5 text-xs font-semibold tabular"
                            >
                              {activeChips.length}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="left"
                        className="w-80 max-w-[85vw] flex flex-col h-full p-0 bg-card border-r border-border"
                      >
                        <SheetHeader className="px-6 py-4 border-b border-border text-left">
                          <div className="flex items-center gap-2 pr-8">
                            <SlidersHorizontal className="h-4 w-4 text-foreground" />
                            <SheetTitle className="font-semibold text-foreground text-base">
                              Bộ lọc
                            </SheetTitle>
                            {activeChips.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-xs rounded-sm font-normal tabular"
                              >
                                {activeChips.length}
                              </Badge>
                            )}
                          </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                          {mobileFilterContent}
                        </div>
                        <div className="p-4 border-t border-border bg-card flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={clearFilters}
                            disabled={activeChips.length === 0}
                            className="flex-1 min-h-11 rounded-md text-sm"
                          >
                            Xóa bộ lọc
                          </Button>
                          <SheetClose asChild>
                            <Button
                              type="button"
                              className="flex-1 min-h-11 rounded-md text-sm font-medium"
                            >
                              Xem kết quả
                            </Button>
                          </SheetClose>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Sort */}
                  <div className="flex-1 sm:flex-initial">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="h-11 min-h-11 sm:h-10 sm:min-h-10 w-full sm:w-[150px] md:w-[160px] text-sm rounded-md bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover rounded-md shadow-md border-border">
                        {PRODUCT_SORT_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-sm"
                          >
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

          {/* Main Layout: two columns desktop when showFilters is true, single column when false */}
          <div
            className={`items-start ${showFilters ? 'lg:grid lg:grid-cols-[260px_1fr] lg:gap-10' : ''}`}
          >
            {/* Sidebar - Desktop only */}
            {showFilters && (
              <aside className="hidden lg:block">
                <div className="lg:sticky lg:top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <div className="surface p-5">{desktopFilterContent}</div>
                </div>
              </aside>
            )}

            {/* Products Column */}
            <div className="min-w-0">
              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div
                  className="flex flex-wrap items-center gap-2 mb-6"
                  aria-label="Bộ lọc đang áp dụng"
                >
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
                    className="min-h-11 sm:min-h-8 h-9 sm:h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    Xóa tất cả
                  </Button>
                </div>
              )}

              {/* Product list / states */}
              {isLoading ? (
                viewMode === 'grid' ? (
                  <div
                    className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${
                      !showFilters ? 'xl:grid-cols-5' : ''
                    } gap-x-4 gap-y-8 md:gap-x-6`}
                    role="status"
                    aria-label="Đang tải sản phẩm"
                  >
                    {Array.from({ length: !showFilters ? 10 : 8 }).map(
                      (_, index) => (
                        <div key={index} className="space-y-3">
                          <div className="aspect-[4/5] w-full bg-muted rounded-lg animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-3/4 bg-muted rounded-sm animate-pulse" />
                            <div className="h-3.5 w-1/3 bg-muted rounded-sm animate-pulse" />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div
                    className="space-y-4"
                    role="status"
                    aria-label="Đang tải sản phẩm"
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 border border-border bg-card rounded-lg"
                      >
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
              ) : data?.products.length === 0 ? (
                <EmptyState
                  title="Không tìm thấy sản phẩm"
                  description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
                  action={
                    <Button
                      variant="outline"
                      className="rounded-md"
                      onClick={clearFilters}
                    >
                      Xóa bộ lọc
                    </Button>
                  }
                />
              ) : (
                <div>
                  <div
                    className={
                      viewMode === 'grid'
                        ? `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${
                            !showFilters ? 'xl:grid-cols-5' : ''
                          } gap-x-4 gap-y-8 md:gap-x-6`
                        : 'space-y-4'
                    }
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
                          className="flex gap-4 p-4 border border-border bg-card rounded-lg transition-colors hover:border-foreground/30"
                        >
                          <Link
                            to={`/p/${product.slug}`}
                            className="w-24 h-24 sm:w-28 sm:h-28 bg-muted rounded-lg overflow-hidden shrink-0 border border-border block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <img
                              src={getImageUrl(product.images[0], {
                                width: 200,
                              })}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 motion-reduce:transform-none hover:scale-105"
                            />
                          </Link>
                          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                              <Link
                                to={`/p/${product.slug}`}
                                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block mb-1"
                              >
                                <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2 hover:underline">
                                  {product.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <div className="flex items-center text-accent font-semibold">
                                  <span className="mr-0.5" aria-hidden="true">
                                    &#9733;
                                  </span>
                                  <span className="tabular">
                                    {product.rating?.toFixed(1)}
                                  </span>
                                </div>
                                <span>|</span>
                                <span>
                                  <span className="tabular">
                                    {product.reviewCount}
                                  </span>{' '}
                                  đánh giá
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {product.variants.slice(0, 3).map((v, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs h-5 px-2 font-normal rounded-sm"
                                  >
                                    {v.scent}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-foreground text-base tabular">
                                {formatCurrency(product.basePrice)}
                              </span>
                              <Button
                                size="sm"
                                className="h-11 sm:h-9 min-h-11 sm:min-h-9 rounded-md text-sm transition-colors"
                                onClick={() =>
                                  product.variants[0] &&
                                  handleAddToCart(product, product.variants[0])
                                }
                              >
                                <ShoppingBag className="h-4 w-4 mr-1.5" /> Thêm
                                vào giỏ
                              </Button>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {data && data.totalPages > 1 && (
                    <div className="mt-12 flex justify-center pt-8 border-t border-border">
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
