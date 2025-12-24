import { useParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Star, ShoppingBag, Grid3X3, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sort') || 'newest';
  const viewMode = searchParams.get('view') || 'grid';

  const { data: category, isLoading: isCategoryLoading } = useCategoryBySlug(categorySlug!);
  const { data: products, isLoading: isProductsLoading } = useProducts({
    categorySlug,
    sortBy: sortBy as any,
  });
  const { addItem } = useCart();

  const handleSortChange = (value: string) => {
    setSearchParams({ sort: value });
  };

  const handleViewToggle = (mode: string) => {
    setSearchParams({ sort: sortBy, view: mode });
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

  if (isCategoryLoading || isProductsLoading) {
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
            description="Danh mục bạn tìm kiếm không tồn tại"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={category.name} description={category.description} />

      <div className="min-h-screen bg-gray-50">
        {/* Category Header */}
        <div className="bg-white border-b">
          <div className="container py-6">
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: category.name },
              ]}
              className="mb-4"
            />

            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                <Link to="/catalog" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách
                </Link>
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                    <Badge variant="secondary" className="mt-1">
                      {products?.total || 0} sản phẩm
                    </Badge>
                  </div>
                </div>
                {category.description && (
                  <p className="text-gray-600 text-lg max-w-2xl">{category.description}</p>
                )}
              </div>

              {/* Category Stats */}
              <Card className="lg:w-80">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{products?.total || 0}</div>
                      <div className="text-sm text-gray-600">Sản phẩm</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {products?.products && products.products.length > 0
                          ? (products.products.reduce((acc, product) => acc + (product.rating || 0), 0) / products.products.length).toFixed(1)
                          : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Đánh giá
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="container py-8">
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Sản phẩm trong danh mục
              </h2>
              <Badge variant="outline">
                {products?.products.length || 0} sản phẩm
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Sắp xếp:</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
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

              {/* View Toggle */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm font-medium text-gray-700 mr-2">Xem:</span>
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
          </div>

          {/* Products Grid */}
          {products?.products.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Package className="h-16 w-16 text-gray-300" />}
                title="Chưa có sản phẩm"
                description="Danh mục này chưa có sản phẩm nào. Hãy quay lại sau!"
                action={
                  <Button asChild>
                    <Link to="/catalog" className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Xem tất cả sản phẩm
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
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
          )}
        </div>
      </div>
    </>
  );
}
