import { useSearchParams, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductSearch } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, SlidersHorizontal, Package, TrendingUp, Grid3X3, List, ShoppingBag } from 'lucide-react';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const viewMode = searchParams.get('view') || 'grid';

  const { data, isLoading } = useProductSearch(query);
  const { addItem } = useCart();

  const handleSearchChange = (newQuery: string) => {
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery.trim(), sort: sortBy, view: viewMode });
    }
  };

  const handleSortChange = (value: string) => {
    setSearchParams({ q: query, sort: value, view: viewMode });
  };

  const handleViewToggle = (mode: string) => {
    setSearchParams({ q: query, sort: sortBy, view: mode });
  };

  const handleFilterClick = () => {
    // TODO: Implement filter modal/sidebar
    alert('Tính năng bộ lọc đang được phát triển. Hiện tại bạn có thể sử dụng tìm kiếm và sắp xếp.');
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

  const clearSearch = () => {
    setSearchParams({});
  };

  return (
    <>
      <SEO title={`Tìm kiếm: ${query}`} />

      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container py-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                <Link to="/catalog" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách
                </Link>
              </Button>
            </div>

            {/* Search Input */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Tìm kiếm sản phẩm..."
                      value={query}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-12 h-12 text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchChange((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sắp xếp:</span>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-[180px] h-12">
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

                    <Button variant="outline" size="lg" className="h-12" onClick={handleFilterClick}>
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Bộ lọc
                    </Button>

                    {query && (
                      <Button variant="ghost" onClick={clearSearch} className="h-12 text-gray-500 hover:text-gray-700">
                        Xóa tìm kiếm
                      </Button>
                    )}
                  </div>
                </div>

                {/* Search Info */}
                {query && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Tìm kiếm cho: <span className="font-medium">"{query}"</span>
                        </span>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {data?.total || 0} kết quả
                      </Badge>
                    </div>

                    {!isLoading && data?.total === 0 && (
                      <div className="text-sm text-gray-500">
                        Thử tìm với từ khóa khác hoặc{' '}
                        <Link to="/catalog" className="text-blue-600 hover:underline">
                          xem tất cả sản phẩm
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        <div className="container py-8">
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : data?.products.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Search className="h-16 w-16 text-gray-300" />}
                title="Không tìm thấy sản phẩm"
                description={`Không có sản phẩm nào khớp với từ khóa "${query}". Hãy thử tìm kiếm với từ khóa khác.`}
                action={
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild>
                      <Link to="/catalog" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Xem tất cả sản phẩm
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={() => setSearchParams({})}>
                      Xóa tìm kiếm
                    </Button>
                  </div>
                }
              />

              {/* Search Suggestions */}
              <div className="mt-8 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gợi ý tìm kiếm:</h3>
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
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left"
                      onClick={() => handleSearchChange(suggestion)}
                    >
                      <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Kết quả tìm kiếm
                  </h2>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {data?.total || 0} sản phẩm
                  </Badge>
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

              {/* Products Display */}
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
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
                    <Card key={product.id} className="p-4 md:p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm mx-auto md:mx-0">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-center md:text-left">
                          <div className="mb-3">
                            <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-2 leading-tight">{product.name}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 mb-3">
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
                            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                              {formatCurrency(product.basePrice)}
                            </div>
                            <Button
                              size="lg"
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

              {/* Load More or Pagination could go here */}
              {data && data.total > data.products.length && (
                <div className="text-center mt-8">
                  <p className="text-gray-600 mb-4">
                    Hiển thị {data.products.length} / {data.total} sản phẩm
                  </p>
                  <Button variant="outline">
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
