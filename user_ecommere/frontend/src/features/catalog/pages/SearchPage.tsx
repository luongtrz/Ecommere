import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SEO } from '@/lib/seo';
import { useProductSearch } from '../hooks/useProducts';
import type { Product, ProductFilters } from '../api/products.api';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
 '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, SlidersHorizontal, Package, TrendingUp, Grid3X3, List, ShoppingBag, Star, X } from 'lucide-react';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const viewMode = searchParams.get('view') || 'grid';
  const category = searchParams.get('category') || searchParams.get('categorySlug') || undefined;

  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const searchFilters: ProductFilters = {
    sortBy: sortBy as any,
    ...(category ? { categorySlug: category } : {}),
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
      if (debouncedSearch.trim()) {
        setSearchParams({ q: debouncedSearch.trim(), sort: sortBy, view: viewMode });
      } else {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('q');
        setSearchParams(nextParams);
      }
    }
  }, [debouncedSearch, query, sortBy, viewMode, setSearchParams, searchParams]);

  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [query, sortBy, category]);

  useEffect(() => {
    if (!data || isPlaceholderData) return;

    if (page === 1) {
      setAllProducts(data.products);
    } else if (data.page === page) {
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const nextProducts = data.products.filter((p) => !existingIds.has(p.id));
        return [...prev, ...nextProducts];
      });
    }
  }, [data, page, isPlaceholderData]);

  const productsToShow =
    allProducts.length > 0
      ? allProducts
      : page === 1 && data && !isPlaceholderData
      ? data.products
      : [];

  const hasNextPage = Boolean(
    data &&
    (data.hasNextPage ?? (data.page < data.totalPages)) &&
    productsToShow.length < data.total
  );

  const handleLoadMore = () => {
    if (!isFetching && hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSortChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', value);
    setSearchParams(nextParams);
  };

  const handleViewToggle = (mode: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', mode);
    setSearchParams(nextParams);
  };

  const handleFilterClick = () => {
    alert('Tính năng bộ lọc đang được phát triển. Hiện tại bạn có thể sử dụng tìm kiếm và sắp xếp.');
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
    setSearchParams({});
  };

  const isInitialLoading =
    (isLoading || isPlaceholderData) && productsToShow.length === 0 && !!query;

  return (
    <>
      <SEO title={`Tìm kiếm: ${query}`} />

      <div className="min-h-screen bg-slate-50">
        {/* Search Header */}
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container py-4 md:py-6">
            <div className="flex items-center gap-4 mb-3">
              <Button variant="ghost" size="sm" asChild className="rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900">
                <Link to="/catalog" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách
                </Link>
              </Button>
            </div>

            {/* Search Input Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-11 pr-10 h-11 text-xs md:text-sm bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-all"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:bg-slate-100 rounded-full p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap uppercase tracking-wider">
                      Sắp xếp:
                    </span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-[150px] h-11 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 px-4 focus:ring-1 focus:ring-teal-500 hover:bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-md">
                        {PRODUCT_SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs rounded-lg focus:bg-teal-50 focus:text-teal-700 cursor-pointer">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 px-4"
                    onClick={handleFilterClick}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                    Bộ lọc
                  </Button>

                  {searchInput && (
                    <Button
                      variant="ghost"
                      onClick={clearSearch}
                      className="h-11 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg px-4"
                    >
                      Xóa tìm kiếm
                    </Button>
                  )}
                </div>
              </div>

              {/* Search Info */}
              {query && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Tìm kiếm cho: <span className="font-semibold text-slate-900">"{query}"</span>
                      </span>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 rounded-md text-[10px] h-5 px-2 bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                      <Package className="h-3 w-3" />
                      {data?.total || 0} kết quả
                    </Badge>
                  </div>

                  {!isLoading && !isPlaceholderData && data?.total === 0 && (
                    <div className="text-xs text-slate-500">
                      Thử tìm với từ khóa khác hoặc{' '}
                      <Link to="/catalog" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
                        xem tất cả sản phẩm
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="container py-8 md:py-12">
          {isInitialLoading ? (
            <div className="py-24 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : data && data.total === 0 ? (
            <div className="py-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-16 text-center max-w-xl mx-auto shadow-sm">
                <EmptyState
                  icon={<Search className="h-12 w-12 text-slate-300" />}
                  title="Không tìm thấy sản phẩm"
                  description={`Không có sản phẩm nào khớp với từ khóa "${query}". Hãy thử tìm kiếm với từ khóa khác.`}
                  action={
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <Button asChild className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white focus-visible:ring-2 focus-visible:ring-teal-500 px-6">
                        <Link to="/catalog" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Xem tất cả sản phẩm
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6"
                        onClick={() => setSearchParams({})}
                      >
                        Xóa tìm kiếm
                      </Button>
                    </div>
                  }
                />
              </div>

              {/* Search Suggestions */}
              <div className="mt-12 max-w-2xl mx-auto">
                <h3 className="text-lg font-sans font-bold text-slate-900 mb-4">Gợi ý tìm kiếm:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    'Nước hoa chanh',
                    'Nước hoa bạc hà',
                    'Nước hoa dâu',
                    'Nước hoa cam',
                    'Nước hoa vanilla',
                    'Nước hoa lavender',
                    'Nước hoa trà xanh',
                    'Nước hoa bạc hà'
                  ].map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start h-auto py-2.5 px-3.5 text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-500 text-xs text-slate-700 transition-all"
                      onClick={() => setSearchInput(suggestion)}
                    >
                      <Search className="h-3.5 w-3.5 mr-2 shrink-0 text-slate-400" />
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-900 tracking-tight">
                    Kết quả tìm kiếm
                  </h2>
                  <Badge variant="outline" className="flex items-center gap-1 rounded-md border-slate-200 bg-slate-50 text-slate-600 text-xs font-normal">
                    <TrendingUp className="h-3 w-3 text-teal-600" />
                    {data?.total || 0} sản phẩm
                  </Badge>
                </div>

                {/* View Options */}
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
              </div>

              {/* Products Display */}
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
                  : 'space-y-4'
              }`}>
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
                    <div
                      key={product.id}
                      className="flex flex-col sm:flex-row gap-4 md:gap-6 bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="w-full sm:w-32 md:w-36 aspect-square sm:aspect-auto sm:h-36 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={getImageUrl(product.images[0], { width: 300 })}
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
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-semibold text-slate-700 tabular-nums">
                                {product.rating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-slate-500 tabular-nums">
                                ({product.reviewCount || 0} đánh giá)
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5 rounded-md border-slate-200 bg-slate-50 text-slate-600 font-normal">
                              {product.variants?.length || 0} biến thể
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-slate-600 text-xs leading-relaxed mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {product.variants?.slice(0, 3).map((variant: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-[10px] h-5 px-2 font-normal rounded-md border border-slate-200 bg-slate-100 text-slate-700">
                                {variant.scent} - {variant.volumeMl}ml
                              </Badge>
                            ))}
                            {product.variants && product.variants.length > 3 && (
                              <Badge variant="outline" className="text-[10px] h-5 px-2 rounded-md border-slate-200 bg-slate-50 text-slate-500">
                                +{product.variants.length - 3} nữa
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="font-sans font-bold text-rose-600 text-base md:text-lg tabular-nums">
                            {formatCurrency(product.basePrice)}
                          </span>
                          <Button
                            size="sm"
                            className="h-9 rounded-lg px-4 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 transition-all duration-200 active:scale-95"
                            onClick={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                          >
                            <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Thêm vào giỏ
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="text-center mt-10">
                  <p className="text-xs text-slate-500 mb-4">
                    Hiển thị {productsToShow.length} / {data?.total || 0} sản phẩm
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-6"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                  >
                    Xem thêm sản phẩm
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
