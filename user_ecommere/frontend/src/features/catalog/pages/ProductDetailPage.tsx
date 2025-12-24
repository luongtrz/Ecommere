import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductDetail } from '../hooks/useProductDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Rating } from '@/components/common/Rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { ShoppingCart, Minus, Plus, Heart, Share2, Truck, Shield, RefreshCw, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductDetailPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { data: product, isLoading } = useProductDetail(productSlug!);
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId) || product?.variants[0];

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: product.images[0],
      price: selectedVariant.salePrice || selectedVariant.price,
      quantity,
      scent: selectedVariant.scent,
      volumeMl: selectedVariant.volumeMl,
    });

    setQuantity(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-gray-600 mb-6">Sản phẩm bạn tìm kiếm có thể đã bị xóa hoặc không tồn tại.</p>
          <Button asChild>
            <Link to="/catalog">Quay lại danh sách sản phẩm</Link>
          </Button>
        </div>
      </div>
    );
  }

  const finalPrice = selectedVariant?.salePrice || selectedVariant?.price || 0;
  const originalPrice = selectedVariant?.price || 0;
  const hasDiscount = selectedVariant?.salePrice && selectedVariant.salePrice < originalPrice;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description}
        image={getImageUrl(product.images[0])}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Product Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container py-4">
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: product.category?.name || '', href: `/c/${product.category?.slug}` },
                { label: product.name },
              ]}
              className="mb-4"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                  <Link to={`/c/${product.category?.slug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" />
                    {product.category?.name}
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Rating value={product.rating || 0} size="sm" />
                  <span className="font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                  <span>({product.reviewCount || 0} đánh giá)</span>
                </div>
                <Badge variant="secondary">
                  {selectedVariant?.stock || 0} còn lại
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-lg">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-5xl font-bold text-blue-600">
                    {formatCurrency(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-3xl text-gray-500 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        -{formatDiscount(originalPrice, finalPrice)}
                      </Badge>
                    </>
                  )}
                </div>

                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              {/* Purchase Options */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Thông tin mua hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Biến thể sản phẩm:</label>
                    <Select
                      value={selectedVariantId || product.variants[0]?.id}
                      onValueChange={setSelectedVariantId}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                            <div className="flex items-center justify-between w-full">
                              <span>{variant.scent} - {variant.volumeMl}ml</span>
                              {variant.stock === 0 && (
                                <Badge variant="destructive" className="ml-2">Hết hàng</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Số lượng:</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="h-8 w-8"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(Math.min(selectedVariant?.stock || 999, quantity + 1))}
                          disabled={quantity >= (selectedVariant?.stock || 0)}
                          className="h-8 w-8"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm text-gray-600">
                        Còn {selectedVariant?.stock || 0} sản phẩm
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  <ShoppingCart className="mr-3 h-6 w-6" />
                  {selectedVariant?.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" className="h-14 border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                    <Heart className="mr-2 h-5 w-5" />
                    Yêu thích
                  </Button>
                  <Button variant="outline" size="lg" className="h-14 border-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600">
                    <Share2 className="mr-2 h-5 w-5" />
                    Chia sẻ
                  </Button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Cam kết của chúng tôi</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">Giao hàng tận nơi</div>
                    <div className="text-sm text-gray-600">Miễn phí giao hàng toàn quốc</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">Bảo hành chính hãng</div>
                    <div className="text-sm text-gray-600">Đảm bảo chất lượng 100%</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <RefreshCw className="h-8 w-8 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">Đổi trả 7 ngày</div>
                    <div className="text-sm text-gray-600">Hoàn tiền nếu không hài lòng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="mt-16">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">i</span>
                  </div>
                  Thông tin chi tiết sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose prose-gray max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                    {product.description}
                  </div>
                </div>

                {/* Additional Product Info */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông số kỹ thuật:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Dung tích:</span>
                      <span className="font-medium">{selectedVariant?.volumeMl}ml</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Mùi hương:</span>
                      <span className="font-medium">{selectedVariant?.scent}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tồn kho:</span>
                      <span className="font-medium">{selectedVariant?.stock} sản phẩm</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Danh mục:</span>
                      <span className="font-medium">{product.category?.name}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
