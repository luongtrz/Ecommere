import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SEO } from '@/lib/seo';
import { useProductSearch } from '../hooks/useProducts';
import type { Product, ProductFilters } from '../api/products.api';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { FilterSidebar } from '../components/FilterSidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, SlidersHorizontal, Package, Grid3X3, List, ShoppingBag } from 'lucide-react';
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

  const { data, isLoading, isFetching, isPlaceholderData } = useProductSearch(
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

  const hasNextPage = Boolean(
    data &&
    (data.hasNextPage ?? (data.page < data.totalPages)) &&
    productsToShow.length < data.total
  );

  const handleLoadMore = () => {
    if (!isFetching && hasNextPage && data && page < data.totalPages) {
      handlePageChange(page + 1);
    }
  };

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

  const handleFilterChange = (filters: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', '1');
    Object.entries(filters).forEach(([key, value]) => {
      const paramKey = key === 'categorySlug' ? 'category' : key;
      if (value === undefined || value === '') {
        nextParams.delete(paramKey);
      } else {
        nextParams.set(paramKey, value);
      }
    });
    setSearchParams(nextParams);
  };

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
        {/* Page Header */}
        <div className="border-b border-border bg-card">
          <div className="container py-8 md:py-10">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                <Link to="/catalog" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách
                </Link>
              </Button>
            </div>

            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                {query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm'}
              </h1>
              {query && (
                <p className="text-sm text-muted-foreground mt-2 tabular">
                  {data?.total || 0} kết quả tìm thấy
                </p>
              )}
            </div>

            {/* Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mt-6 pt-6 border-t border-border">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-10 text-sm bg-background border-border rounded-md"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Sắp xếp:</span>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[160px] h-10 rounded-md border-border bg-background text-sm font-normal text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border bg-popover">
                      {PRODUCT_SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Trigger Button Desktop */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:flex items-center gap-2 h-10 rounded-md border-border bg-background hover:bg-secondary text-foreground"
                  onClick={handleFilterClick}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Bộ lọc</span>
                </Button>

                {/* Filter Sheet Mobile */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden flex items-center gap-2 h-10 rounded-md border-border bg-background hover:bg-secondary text-foreground"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Bộ lọc</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto border-border bg-card">
                    <SheetHeader>
                      <SheetTitle className="text-foreground">Bộ lọc</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      {filterContent}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-border rounded-md p-0.5 bg-background">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewToggle('grid')}
                    className={`h-8 w-8 p-0 rounded-sm ${viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Chế độ lưới"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewToggle('list')}
                    className={`h-8 w-8 p-0 rounded-sm ${viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Chế độ danh sách"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="container py-8 md:py-12 min-h-[60vh]">
          {isInitialLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : data && data.total === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Search className="h-12 w-12 text-muted-foreground stroke-1" />}
                title="Không tìm thấy sản phẩm"
                description={`Không có sản phẩm nào khớp với từ khóa "${query}". Hãy thử tìm kiếm với từ khóa khác.`}
                action={
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="rounded-md">
                      <Link to="/catalog" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Xem tất cả sản phẩm
                      </Link>
                    </Button>
                    <Button variant="outline" className="rounded-md" onClick={clearSearch}>
                      Xóa tìm kiếm
                    </Button>
                  </div>
                }
              />

              {/* Search Suggestions */}
              <div className="mt-12 max-w-2xl mx-auto text-center">
                <h3 className="text-sm font-semibold text-foreground mb-4">Gợi ý tìm kiếm:</h3>
                <div className="flex flex-wrap items-center justify-center gap-2">
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
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-foreground hover:border-foreground/30 hover:bg-secondary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-8">
              {/* Sidebar - Desktop only */}
              {showFilters && (
                <aside className="hidden lg:block w-64 shrink-0">
                  <div className="sticky top-24 bg-card rounded-lg border border-border p-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {filterContent}
                  </div>
                </aside>
              )}

              {/* Products Column */}
              <div className="flex-1 min-w-0">
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      Kết quả tìm kiếm
                    </h2>
                    <span className="text-sm text-muted-foreground tabular">
                      ({data?.total || 0} sản phẩm)
                    </span>
                  </div>
                </div>

                {/* Product Grid / List */}
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8'
                    : 'space-y-4'
                }>
                  {productsToShow.map((product) => (
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
                                  <span className="text-accent text-sm">★</span>
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
                              <div className="text-lg sm:text-xl font-semibold text-foreground tabular">
                                {formatCurrency(product.basePrice)}
                              </div>
                              <Button
                                size="sm"
                                className="rounded-md"
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
                  ))}
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
