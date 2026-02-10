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
import { ShoppingCart, Minus, Plus, Heart, Share2, Truck, Shield, RefreshCw, ArrowLeft, Search } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Khong tim thay san pham</h1>
          <p className="text-gray-500 mb-6">San pham ban tim kiem co the da bi xoa hoac khong ton tai.</p>
          <Button asChild className="rounded-full px-6">
            <Link to="/catalog">Quay lai danh sach san pham</Link>
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

      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        {/* Product Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="container py-4">
            <Breadcrumb
              items={[
                { label: 'San pham', href: '/catalog' },
                { label: product.category?.name || '', href: `/c/${product.category?.slug}` },
                { label: product.name },
              ]}
              className="mb-4"
            />

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                <Link to={`/c/${product.category?.slug}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  {product.category?.name}
                </Link>
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Rating value={product.rating || 0} size="sm" />
                  <span className="font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                  <span>({product.reviewCount || 0} danh gia)</span>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {selectedVariant?.stock || 0} con lai
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4 animate-fade-in">
              <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-xl overflow-hidden transition-all duration-300 ${selectedImage === index
                      ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md'
                      : 'border border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
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
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-4xl md:text-5xl font-bold text-blue-600">
                    {formatCurrency(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-2xl text-gray-400 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                      <Badge className="bg-red-500 hover:bg-red-500 text-white text-sm px-3 py-1 rounded-lg">
                        -{formatDiscount(originalPrice, finalPrice)}
                      </Badge>
                    </>
                  )}
                </div>

                <p className="text-gray-500 text-base leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              {/* Purchase Options */}
              <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Thong tin mua hang
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Bien the san pham:</label>
                    <Select
                      value={selectedVariantId || product.variants[0]?.id}
                      onValueChange={setSelectedVariantId}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                            <div className="flex items-center justify-between w-full">
                              <span>{variant.scent} - {variant.volumeMl}ml</span>
                              {variant.stock === 0 && (
                                <Badge variant="destructive" className="ml-2">Het hang</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">So luong:</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="h-9 w-9 rounded-lg"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(Math.min(selectedVariant?.stock || 999, quantity + 1))}
                          disabled={quantity >= (selectedVariant?.stock || 0)}
                          className="h-9 w-9 rounded-lg"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm text-gray-500">
                        Con {selectedVariant?.stock || 0} san pham
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 rounded-2xl transition-all"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  {selectedVariant?.stock === 0 ? 'Het hang' : 'Them vao gio hang'}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" className="h-12 border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all">
                    <Heart className="mr-2 h-4 w-4" />
                    Yeu thich
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500 transition-all">
                    <Share2 className="mr-2 h-4 w-4" />
                    Chia se
                  </Button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5 text-center">Cam ket cua chung toi</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium text-sm text-gray-900 mb-0.5">Giao hang</div>
                    <div className="text-xs text-gray-500">Mien phi toan quoc</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium text-sm text-gray-900 mb-0.5">Chinh hang</div>
                    <div className="text-xs text-gray-500">Dam bao 100%</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                      <RefreshCw className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium text-sm text-gray-900 mb-0.5">Doi tra</div>
                    <div className="text-xs text-gray-500">Trong 7 ngay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">i</span>
                  </div>
                  Thong tin chi tiet san pham
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose prose-gray max-w-none">
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line text-base">
                    {product.description}
                  </div>
                </div>

                {/* Additional Product Info */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thong so ky thuat:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">Dung tich:</span>
                      <span className="font-medium">{selectedVariant?.volumeMl}ml</span>
                    </div>
                    <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">Mui huong:</span>
                      <span className="font-medium">{selectedVariant?.scent}</span>
                    </div>
                    <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">Ton kho:</span>
                      <span className="font-medium">{selectedVariant?.stock} san pham</span>
                    </div>
                    <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">Danh muc:</span>
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
