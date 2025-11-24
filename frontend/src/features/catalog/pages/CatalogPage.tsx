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
import { Card, CardContent } from '@/components/ui/card';
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
    // TODO: Implement filter modal/sidebar
    alert('Tính năng bộ lọc đang được phát triển. Hiện tại bạn có thể sử dụng tìm kiếm và sắp xếp.');
  };

  return (
    <>
      <SEO title="Sản phẩm" />

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b">
          <div className="container py-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Bộ sưu tập sản phẩm</h1>
              <p className="text-sm text-gray-600">Khám phá các loại nước hoa xịt thơm chất lượng cao</p>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 h-10 text-sm"
                    />
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Sắp xếp:</span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="h-10 text-sm">
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
                    <Button variant="outline" size="sm" className="h-10" onClick={handleFilterClick}>
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Bộ lọc
                    </Button>
                    {(sortBy !== 'newest' || searchQuery) && (
                      <Button variant="ghost" onClick={clearFilters} className="h-10 text-xs text-gray-500 hover:text-gray-700">
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                </div>

                {/* Active Filters */}
                {(sortBy !== 'newest' || searchQuery) && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm font-medium text-gray-700">Bộ lọc đang áp dụng:</span>
                    <div className="flex flex-wrap gap-2">
                      {searchQuery && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Tìm kiếm: "{searchQuery}"
                          <button
                            onClick={() => handleSearchChange('')}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {sortBy !== 'newest' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Sắp xếp: {PRODUCT_SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
                          <button
                            onClick={() => handleSortChange('newest')}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        <div className="container py-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {isLoading ? 'Đang tải...' : `${data?.total || 0} sản phẩm`}
              </h2>
              {!isLoading && data?.totalPages && data.totalPages > 1 && (
                <span className="text-sm text-gray-500">
                  Trang {page} / {data.totalPages}
                </span>
              )}
            </div>

            {/* View Options */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewToggle('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewToggle('list')}
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
              title="Không tìm thấy sản phẩm"
              description={searchQuery ? "Không có sản phẩm nào khớp với tìm kiếm của bạn" : "Chưa có sản phẩm nào trong danh mục này"}
            />
          ) : (
            <>
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                  : 'space-y-3'
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
                    <Card key={product.id} className="p-3 md:p-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm mx-auto md:mx-0">
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
                                <span className="text-yellow-400 text-base md:text-lg">★</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {product.rating?.toFixed(1) || '0.0'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({product.reviewCount || 0} đánh giá)
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {product.variants?.length || 0} biến thể
                              </Badge>
                            </div>
                            {product.description && (
                              <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                              {product.variants?.slice(0, 3).map((variant: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {variant.scent} - {variant.volumeMl}ml
                                </Badge>
                              ))}
                              {product.variants && product.variants.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.variants.length - 3} nữa
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="text-xl md:text-2xl font-bold text-blue-600 mb-2">
                              {formatCurrency(product.basePrice)}
                            </div>
                            <Button
                              size="default"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md w-full md:w-auto"
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

              {data && data.totalPages > 1 && (
                <div className="flex justify-center">
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
