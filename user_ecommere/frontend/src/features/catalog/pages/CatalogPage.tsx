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

  // Debounced search: local state for input, debounce before updating URL
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 400);

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

      <div className="min-h-screen">
        {/* Compact Header */}
        <div className="border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="container py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Sản phẩm</h1>
                  <p className="text-xs text-muted-foreground hidden md:block">{data?.total || 0} kết quả tìm thấy</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`hidden lg:flex items-center gap-2 h-9 rounded-full ${showFilters ? 'bg-secondary border-white/80 hover:bg-secondary/80' : 'border-dashed border-white/80 bg-white/30'}`}
                >
                  <Filter className="h-4 w-4 text-foreground/80" />
                  <span className="text-xs font-semibold text-foreground">{showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}</span>
                </Button>
              </div>

              {/* Compact Toolbar */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-9 pl-9 text-sm bg-white/60 border-white/80 rounded-xl focus:bg-white transition-all"
                  />
                  {searchInput && (
                    <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-secondary rounded-full p-0.5">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 border-l pl-2 ml-2 border-white/40">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-9 w-[130px] text-xs border-0 bg-transparent hover:bg-secondary/40 font-semibold text-foreground rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/70 bg-white/95">
                      {PRODUCT_SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs rounded-lg">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="flex bg-secondary/55 rounded-xl p-0.5 border border-white/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewToggle('grid')}
                      className={`h-7 w-7 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewToggle('list')}
                      className={`h-7 w-7 p-0 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Mobile Filter Trigger */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl lg:hidden border-white/80 bg-white/30">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto border-white/70 bg-white/95">
                      <SheetHeader>
                        <SheetTitle className="text-foreground">Bộ lọc</SheetTitle>
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
                <div className="sticky top-24 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60 p-4 shadow-sm overflow-y-auto max-h-[calc(100vh-8rem)]">
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
                  action={<Button variant="outline" className="rounded-full" onClick={clearFilters}>Xóa bộ lọc</Button>}
                />
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className={`${viewMode === 'grid'
                    ? `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${!showFilters ? 'xl:grid-cols-5' : ''} gap-4 md:gap-6`
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
                        <div key={product.id} className="flex gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-[1.65rem] border border-white/60 hover:shadow-lg transition-all duration-300">
                          <div className="w-24 h-24 bg-white/50 border border-white/40 rounded-xl overflow-hidden shrink-0">
                            <img src={getImageUrl(product.images[0], { width: 200 })} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-foreground truncate text-base">{product.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <div className="flex items-center text-amber-500 font-semibold">
                                  <span className="mr-0.5">&#9733;</span> {product.rating?.toFixed(1)}
                                </div>
                                <span>|</span>
                                <span>{product.reviewCount} đánh giá</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {product.variants.slice(0, 3).map((v, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] h-5 px-2 font-normal rounded-full">
                                    {v.scent}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-primary text-base">{formatCurrency(product.basePrice)}</span>
                              <Button size="sm" className="h-9 rounded-full text-xs transition-all duration-300 active:scale-95" onClick={() => product.variants[0] && handleAddToCart(product, product.variants[0])}>
                                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Thêm vào giỏ
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  {data && data.totalPages > 1 && (
                    <div className="flex justify-center pt-8 border-t border-white/40">
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
