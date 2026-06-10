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

      <div className="min-h-screen">
        {/* Compact Header - giống CatalogPage */}
        <div className="border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="container py-4">
            {/* Breadcrumb nhỏ */}
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: category.name },
              ]}
              className="mb-3"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
                <p className="text-xs text-muted-foreground hidden md:block">{products?.total || 0} sản phẩm</p>
              </div>

              {/* Compact Toolbar - giống CatalogPage */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-9 pl-9 text-sm bg-white/60 border-white/80 rounded-xl focus:bg-white transition-all"
                  />
                  {searchQuery && (
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

        {/* Main Content with Sidebar - giống CatalogPage */}
        <div className="container py-6 min-h-[60vh]">
          <div className="flex gap-6">
            {/* Sidebar - Desktop only */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60 p-4 shadow-sm overflow-y-auto max-h-[calc(100vh-8rem)]">
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
                  action={<Button variant="outline" className="rounded-full" onClick={clearFilters}>Xóa bộ lọc</Button>}
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
                        <div key={product.id} className="flex gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-[1.65rem] border border-white/60 hover:shadow-lg transition-all duration-300">
                          <div className="w-24 h-24 bg-white/50 border border-white/40 rounded-xl overflow-hidden shrink-0">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
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
                                {product.variants.slice(0, 3).map((v: any, i: number) => (
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
