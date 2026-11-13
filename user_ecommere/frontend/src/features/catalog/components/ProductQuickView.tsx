import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '@/features/cart/hooks/useCart';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl, cn } from '@/lib/utils';
import { Minus, Plus, ShoppingCart, Loader2, Heart, Check } from 'lucide-react';
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
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 shadow-md md:max-h-[85vh] md:flex-row lg:max-w-4xl">
        {isLoading || !product ? (
          <div className="flex min-h-[360px] flex-1 items-center justify-center p-12">
            <VisuallyHidden.Root>
              <DialogTitle>Xem nhanh sản phẩm</DialogTitle>
              <DialogDescription>Xem nhanh thông tin sản phẩm</DialogDescription>
            </VisuallyHidden.Root>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Left: Images */}
            <div className="flex w-full flex-col justify-center border-b border-border bg-muted/30 p-6 md:w-1/2 md:border-b-0 md:border-r">
              <div className="relative mb-3 aspect-[4/5] w-full overflow-hidden rounded-lg border border-border bg-muted md:aspect-square">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                {hasDiscount && (
                  <span className="absolute left-2.5 top-2.5 rounded-sm bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {formatDiscount(originalPrice, finalPrice)}
                  </span>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {product.images.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        'h-14 w-14 shrink-0 overflow-hidden rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
            <div className="flex w-full flex-col overflow-y-auto p-6 md:w-1/2 md:p-8">
              {product.category?.name ? (
                <div className="mb-2 pr-10">
                  <span className="text-xs font-medium text-muted-foreground">
                    {product.category.name}
                  </span>
                </div>
              ) : null}

              <DialogTitle className="text-xl font-semibold leading-snug text-foreground md:text-2xl">
                {product.name}
              </DialogTitle>

              <div className="my-3 flex items-baseline gap-2.5">
                <span className="text-xl font-semibold tabular text-foreground md:text-2xl">
                  {formatCurrency(finalPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm tabular text-muted-foreground line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              {product.description ? (
                <DialogDescription className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Xem nhanh thông tin sản phẩm
                </DialogDescription>
              )}

              <div className="mb-6 space-y-4">
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <span className="mb-2 block text-xs font-medium text-muted-foreground">
                      Phiên bản:
                    </span>
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
                              'inline-flex min-h-11 items-center rounded-md border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                                : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-secondary/40',
                              isOutOfStock && 'cursor-not-allowed opacity-50 line-through text-muted-foreground'
                            )}
                          >
                            {isSelected && <Check className="mr-1.5 h-4 w-4 shrink-0" />}
                            <span>{v.scent}</span> - <span>{v.volumeMl}ml</span>
                            {isOutOfStock && <span className="ml-1 text-xs opacity-80">(Hết hàng)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <span id="quantity-label" className="mb-2 block text-xs font-medium text-muted-foreground">
                    Số lượng:
                  </span>
                  <div className="flex items-center gap-2" role="group" aria-labelledby="quantity-label">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Giảm số lượng"
                      className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selectedVariant?.stock || 99}
                      value={quantity}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (!Number.isNaN(parsed)) {
                          setQuantity(Math.max(1, Math.min(selectedVariant?.stock || 99, parsed)));
                        }
                      }}
                      aria-label="Số lượng"
                      className="h-11 w-14 rounded-md border border-border bg-background text-center text-sm font-medium tabular text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock || 99, q + 1))}
                      disabled={quantity >= (selectedVariant?.stock || 99)}
                      aria-label="Tăng số lượng"
                      className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Action Area: Add to Cart + Wishlist (no collision with modal 'X') + Details link */}
              <div className="mt-auto space-y-2 pt-6">
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    className="h-11 flex-1 text-sm font-semibold"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {selectedVariant?.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleWishlist}
                    aria-label={isWishlisted ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
                    className={cn(
                      'h-11 w-11 shrink-0 border-border bg-card p-0 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isWishlisted && 'border-destructive/30 text-destructive hover:text-destructive'
                    )}
                  >
                    <Heart className={cn('h-5 w-5 transition-colors', isWishlisted && 'fill-destructive text-destructive')} />
                  </Button>
                </div>
                <Button variant="outline" asChild className="h-11 w-full text-sm font-semibold">
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
