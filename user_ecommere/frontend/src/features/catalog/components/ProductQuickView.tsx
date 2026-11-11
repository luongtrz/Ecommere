import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '@/features/cart/hooks/useCart';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl, cn } from '@/lib/utils';
import { Minus, Plus, ShoppingCart, Loader2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ProductQuickViewProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ slug, open, onOpenChange }: ProductQuickViewProps) {
  const { data: product, isLoading } = useProductDetail(slug);
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId) || product?.variants[0];
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: product.images[0],
      price: selectedVariant.salePrice ?? selectedVariant.price,
      quantity,
      scent: selectedVariant.scent,
      volumeMl: selectedVariant.volumeMl,
    });

    onOpenChange(false);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: product.variants[0]?.salePrice ?? product.variants[0]?.price ?? 0,
    });
  };

  const finalPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? 0;
  const originalPrice = selectedVariant?.price ?? 0;
  const hasDiscount = selectedVariant?.salePrice != null && selectedVariant.salePrice < originalPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl lg:max-w-4xl p-0 overflow-hidden gap-0 border border-border bg-card shadow-md rounded-lg flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
        {isLoading || !product ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-[360px]">
            <VisuallyHidden.Root>
              <DialogTitle>Xem nhanh sản phẩm</DialogTitle>
              <DialogDescription>Xem nhanh thông tin sản phẩm</DialogDescription>
            </VisuallyHidden.Root>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Left: Images */}
            <div className="w-full md:w-1/2 bg-muted/30 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border">
              <div className="relative aspect-[4/5] md:aspect-square w-full overflow-hidden rounded-lg bg-muted border border-border mb-3">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                {hasDiscount && (
                  <span className="absolute top-2.5 left-2.5 rounded-sm bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {formatDiscount(originalPrice, finalPrice)}
                  </span>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 justify-center overflow-x-auto pb-1 scrollbar-none">
                  {product.images.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        'h-14 w-14 rounded-md border overflow-hidden flex-shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selectedImage === idx
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border hover:border-foreground/30'
                      )}
                    >
                      <img
                        src={getImageUrl(img, { width: 120 })}
                        alt={`${product.name} ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="mb-2 flex items-center justify-between gap-2 pr-8">
                {product.category?.name ? (
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {product.category.name}
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-label={isWishlisted ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isWishlisted && 'text-destructive hover:text-destructive'
                  )}
                >
                  <Heart className={cn('h-4 w-4 transition-colors', isWishlisted && 'fill-destructive text-destructive')} />
                </button>
              </div>

              <DialogTitle className="font-sans text-xl md:text-2xl font-semibold leading-snug text-foreground">
                {product.name}
              </DialogTitle>

              <div className="my-3 flex items-baseline gap-2.5">
                <span className="text-xl md:text-2xl font-semibold tabular text-foreground">
                  {formatCurrency(finalPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through tabular">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              {product.description ? (
                <DialogDescription className="mb-5 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Xem nhanh thông tin sản phẩm
                </DialogDescription>
              )}

              <div className="space-y-4 mb-6">
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Phiên bản:
                    </label>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn phiên bản">
                      {product.variants.map((v) => {
                        const isSelected = (selectedVariantId || product.variants[0]?.id) === v.id;
                        const isOutOfStock = v.stock === 0;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isOutOfStock}
                            onClick={() => {
                              setSelectedVariantId(v.id);
                              setQuantity(1);
                            }}
                            className={cn(
                              'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              isSelected
                                ? 'border-primary bg-secondary text-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                              isOutOfStock && 'cursor-not-allowed opacity-50 line-through'
                            )}
                          >
                            <span>{v.scent}</span> - <span>{v.volumeMl}ml</span>
                            {isOutOfStock && <span className="ml-1 text-muted-foreground">(Hết hàng)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Số lượng:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Giảm số lượng"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium tabular text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                      disabled={quantity >= (selectedVariant?.stock || 99)}
                      aria-label="Tăng số lượng"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 space-y-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="w-full"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {selectedVariant?.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/p/${slug}`} onClick={() => onOpenChange(false)}>
                    Xem chi tiết sản phẩm
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
