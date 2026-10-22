import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '@/features/cart/hooks/useCart';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl, cn } from '@/lib/utils';
import { Minus, Plus, ShoppingCart, Loader2, Heart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ProductQuickViewProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({
  slug,
  open,
  onOpenChange,
}: ProductQuickViewProps) {
  const { data: product, isLoading } = useProductDetail(slug);
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Reset state when product loads or changes
  if (product && !selectedVariantId && product.variants.length > 0) {
    // This might cause infinite loop if not handled carefully, better to calculate derived state
  }

  const selectedVariant =
    product?.variants.find((v) => v.id === selectedVariantId) ||
    product?.variants[0];
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
    }); // addItem now auto-opens drawer

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
  const hasDiscount =
    selectedVariant?.salePrice != null &&
    selectedVariant.salePrice < originalPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto md:overflow-hidden gap-0 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[92vh] flex flex-col md:flex-row">
        {/* Helper for accessibility if needed */}
        <VisuallyHidden.Root>
          <DialogTitle>{product?.name || 'Xem nhanh sản phẩm'}</DialogTitle>
          <DialogDescription>Xem nhanh thông tin sản phẩm</DialogDescription>
        </VisuallyHidden.Root>

        {isLoading || !product ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            {/* Left: Images */}
            <div className="w-full md:w-1/2 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-center relative flex-shrink-0">
              <div className="aspect-square relative overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200 mb-4 flex items-center justify-center p-4">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-200 ease-out hover:scale-105"
                />
                {hasDiscount && (
                  <Badge className="absolute top-3 left-3 bg-rose-600 text-white font-semibold hover:bg-rose-700 rounded-md px-2.5 py-0.5 text-xs shadow-sm border-0">
                    {formatDiscount(originalPrice, finalPrice)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide">
                {product.images.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`Xem ảnh ${idx + 1}`}
                    className={cn(
                      'w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0 transition-all duration-150 bg-white p-1',
                      selectedImage === idx
                        ? 'border-teal-600 ring-2 ring-teal-600/20'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100',
                    )}
                  >
                    <img
                      src={getImageUrl(img, { width: 100 })}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto md:max-h-[92vh] bg-white">
              <div className="mb-2 flex justify-between items-center pr-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                  {product.category?.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleWishlist}
                  aria-label="Thêm vào yêu thích"
                  className={cn(
                    'rounded-full transition-colors h-8 w-8',
                    isWishlisted
                      ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100',
                  )}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      isWishlisted && 'fill-rose-600 text-rose-600 scale-110',
                    )}
                  />
                </Button>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-2 leading-snug">
                {product.name}
              </h2>

              <div className="flex items-baseline gap-3 mb-4">
                <span
                  className={cn(
                    'text-2xl font-semibold tabular-nums',
                    hasDiscount ? 'text-rose-600' : 'text-slate-900',
                  )}
                >
                  {formatCurrency(finalPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-base text-slate-400 line-through tabular-nums">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              <div className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                {product.description}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="quickview-variant"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block"
                  >
                    Phiên bản:
                  </label>
                  <Select
                    value={selectedVariantId || product.variants[0]?.id}
                    onValueChange={(val) => {
                      setSelectedVariantId(val);
                      setQuantity(1);
                    }}
                  >
                    <SelectTrigger
                      id="quickview-variant"
                      className="w-full rounded-lg border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-slate-200 bg-white text-slate-900">
                      {product.variants.map((v) => (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                          disabled={v.stock === 0}
                          className="rounded-md"
                        >
                          <span className="font-medium">{v.scent}</span> -{' '}
                          {v.volumeMl}ml
                          {v.stock === 0 && (
                            <span className="text-rose-600 ml-2">
                              (Hết hàng)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span
                    id="quickview-quantity-label"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block"
                  >
                    Số lượng:
                  </span>
                  <div
                    role="group"
                    aria-labelledby="quickview-quantity-label"
                    className="flex items-center h-10 w-32 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Giảm số lượng"
                      className="h-full w-9 rounded-l-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="flex-1 text-center font-semibold text-sm text-slate-900 tabular-nums">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setQuantity(
                          Math.min(selectedVariant?.stock || 99, quantity + 1),
                        )
                      }
                      aria-label="Tăng số lượng"
                      className="h-full w-9 rounded-r-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 space-y-2.5">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="w-full h-11 rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 font-semibold text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {selectedVariant?.stock === 0
                    ? 'Tạm hết hàng'
                    : 'Thêm vào giỏ'}
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full h-10 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors duration-150"
                >
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
