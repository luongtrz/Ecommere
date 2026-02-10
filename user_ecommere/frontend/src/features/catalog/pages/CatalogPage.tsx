import { useSearchParams } from 'react-router-dom';
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
import { Search, Grid3X3, List, SlidersHorizontal, ShoppingBag } from 'lucide-react';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';
  const viewMode = searchParams.get('view') || 'grid';

  const { data, isLoading } = useProducts({
    page,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: sortBy as any,
    search: searchQuery || undefined,
  });

  const { addItem } = useCart();

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), sort: sortBy, q: searchQuery });
  };

  const handleSortChange = (value: string) => {
    setSearchParams({ page: '1', sort: value, q: searchQuery });
  };

  const handleSearchChange = (value: string) => {
    setSearchParams({ page: '1', sort: sortBy, q: value });
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

  const clearFilters = () => {
    setSearchParams({});
  };

  const handleViewToggle = (mode: string) => {
    setSearchParams({ page: page.toString(), sort: sortBy, q: searchQuery, view: mode });
  };

  const handleFilterClick = () => {
    alert('Tinh nang bo loc dang duoc phat trien. Hien tai ban co the su dung tim kiem va sap xep.');
  };

  return (
    <>
      <SEO title="San pham" />

      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="container py-8">
            <div className="mb-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bo suu tap san pham</h1>
              <p className="text-sm text-gray-500">Kham pha cac loai nuoc hoa xit thom chat luong cao</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tim kiem san pham..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 h-11 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sap xep:</span>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-11 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle & Filters */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-11 rounded-xl border-gray-200 hover:bg-gray-50" onClick={handleFilterClick}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Bo loc
                  </Button>
                  {(sortBy !== 'newest' || searchQuery) && (
                    <Button variant="ghost" onClick={clearFilters} className="h-11 text-xs text-gray-500 hover:text-gray-700">
                      Xoa bo loc
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Filters */}
              {(sortBy !== 'newest' || searchQuery) && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Dang loc:</span>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Badge variant="secondary" className="flex items-center gap-1 rounded-full px-3">
                        Tim kiem: "{searchQuery}"
                        <button
                          onClick={() => handleSearchChange('')}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          x
                        </button>
                      </Badge>
                    )}
                    {sortBy !== 'newest' && (
                      <Badge variant="secondary" className="flex items-center gap-1 rounded-full px-3">
                        Sap xep: {PRODUCT_SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
                        <button
                          onClick={() => handleSortChange('newest')}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          x
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="container py-8">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {isLoading ? 'Dang tai...' : `${data?.total || 0} san pham`}
              </h2>
              {!isLoading && data?.totalPages && data.totalPages > 1 && (
                <span className="text-sm text-gray-400">
                  Trang {page} / {data.totalPages}
                </span>
              )}
            </div>

            {/* View Options */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewToggle('grid')}
                className={`rounded-lg h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewToggle('list')}
                className={`rounded-lg h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : data?.products.length === 0 ? (
            <EmptyState
              title="Khong tim thay san pham"
              description={searchQuery ? "Khong co san pham nao khop voi tim kiem cua ban" : "Chua co san pham nao trong danh muc nay"}
            />
          ) : (
            <>
              <div className={`${viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'
                  : 'space-y-4'
                }`}>
                {data?.products.map((product, index) => (
                  viewMode === 'grid' ? (
                    <div
                      key={product.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        slug={product.slug}
                        images={product.images}
                        price={product.basePrice}
                        rating={product.rating}
                        reviewCount={product.reviewCount}
                        onAddToCart={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                      />
                    </div>
                  ) : (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-0.5 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 mx-auto md:mx-0">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-center md:text-left">
                          <div className="mb-2">
                            <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 leading-tight">{product.name}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-2">
                              <div className="flex items-center gap-1">
                                <span className="text-amber-400 text-base md:text-lg">*</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {product.rating?.toFixed(1) || '0.0'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({product.reviewCount || 0} danh gia)
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs rounded-full">
                                {product.variants?.length || 0} bien the
                              </Badge>
                            </div>
                            {product.description && (
                              <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                              {product.variants?.slice(0, 3).map((variant: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs rounded-full">
                                  {variant.scent} - {variant.volumeMl}ml
                                </Badge>
                              ))}
                              {product.variants && product.variants.length > 3 && (
                                <Badge variant="outline" className="text-xs rounded-full">
                                  +{product.variants.length - 3} nua
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="text-xl md:text-2xl font-bold text-blue-600 mb-3">
                              {formatCurrency(product.basePrice)}
                            </div>
                            <Button
                              size="default"
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md rounded-xl w-full md:w-auto"
                              onClick={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Them vao gio
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={data.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
