import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductDetail } from '../hooks/useProductDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Rating } from '@/components/common/Rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
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
      <div className="container py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return <div className="container py-12">Không tìm thấy sản phẩm</div>;
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
      
      <div className="container py-8">
        <Breadcrumb
          items={[
            { label: 'Sản phẩm', href: '/catalog' },
            { label: product.category?.name || '', href: `/c/${product.category?.slug}` },
            { label: product.name },
          ]}
          className="mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
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
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <Rating value={product.rating || 0} size="md" showValue />
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount || 0} đánh giá)
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(finalPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                  <Badge variant="destructive">
                    {formatDiscount(originalPrice, finalPrice)}
                  </Badge>
                </>
              )}
            </div>

            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Chọn biến thể:</label>
                  <Select
                    value={selectedVariantId || product.variants[0]?.id}
                    onValueChange={setSelectedVariantId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.scent} - {variant.volumeMl}ml
                          {variant.stock === 0 && ' (Hết hàng)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Số lượng:</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(selectedVariant?.stock || 999, quantity + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Còn {selectedVariant?.stock || 0} sản phẩm
                  </p>
                </div>
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full mb-4"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Thêm vào giỏ hàng
            </Button>

            <div className="prose prose-sm max-w-none">
              <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
