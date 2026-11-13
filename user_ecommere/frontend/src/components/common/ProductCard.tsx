import { memo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl, cn } from '@/lib/utils';
import { ProductQuickView } from '@/features/catalog/components/ProductQuickView';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { usePrefetchProduct } from '@/features/catalog/hooks/useProductDetail';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  salePrice?: number;
  rating?: number;
  reviewCount?: number;
  variants?: Array<{
    stock: number;
    price?: number;
    salePrice?: number | null;
  }>;
  onAddToCart?: () => void;
}

export const ProductCard = memo(function ProductCard({
  id,
  name,
  slug,
  images,
  price,
  salePrice,
  rating = 0,
  reviewCount = 0,
  variants,
  onAddToCart,
}: ProductCardProps) {
  const selectedVariant = variants?.[0];
  const hasVariantPrice =
    selectedVariant && typeof selectedVariant.price === 'number';
  const effectivePrice = hasVariantPrice ? selectedVariant.price! : price;
  const effectiveSalePrice = hasVariantPrice
    ? (selectedVariant.salePrice ?? undefined)
    : salePrice;

  const hasDiscount =
    effectiveSalePrice != null && effectiveSalePrice < effectivePrice;
  const finalPrice =
    hasDiscount && effectiveSalePrice != null
      ? effectiveSalePrice
      : effectivePrice;
  const discountPercent =
    hasDiscount && effectiveSalePrice != null
      ? Math.max(
          1,
          Math.round(
            ((effectivePrice - effectiveSalePrice) / effectivePrice) * 100,
          ),
        )
      : 0;
  const isOutOfStock =
    variants !== undefined && (!selectedVariant || selectedVariant.stock === 0);

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { toggleItem, isInWishlist } = useWishlist();
  const prefetchProduct = usePrefetchProduct();
  const isWishlisted = isInWishlist(id);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current);
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchProduct(slug);
    }, 200); // 200ms debounce
  }, [prefetchProduct, slug]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  return (
    <>
      <div
        className="group flex h-full flex-col"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Area */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
          <Link to={`/p/${slug}`} className="block h-full w-full">
            <img
              src={getImageUrl(images[0], { width: 500 })}
              alt={name}
              loading="lazy"
              decoding="async"
              className={cn(
                'h-full w-full object-cover transition-transform duration-300 motion-reduce:transform-none group-hover:scale-[1.03]',
                isOutOfStock && 'opacity-75',
              )}
            />
          </Link>

          {/* Badges */}
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1">
            {hasDiscount && (
              <span className="rounded-sm bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Giảm {discountPercent}%
              </span>
            )}
            {isOutOfStock && (
              <span className="rounded-sm border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                Hết hàng
              </span>
            )}
          </div>

          {/* Wishlist Button (44px hit area on mobile) */}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              toggleItem({
                productId: id,
                name,
                slug,
                image: images[0],
                price: finalPrice,
              });
            }}
            className={cn(
              'absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isWishlisted && 'text-destructive hover:text-destructive',
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-colors',
                isWishlisted && 'fill-destructive text-destructive',
              )}
            />
          </button>

          {/* Quick-view Trigger (hover-capable devices only, hidden on touch screens) */}
          <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:hidden">
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(true)}
              className="w-full rounded-md border border-border bg-card py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Xem nhanh
            </button>
          </div>
        </div>

        {/* Text Block */}
        <div className="flex flex-1 flex-col pt-3">
          <Link
            to={`/p/${slug}`}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="text-base font-semibold leading-snug line-clamp-2 min-h-[2.75rem] text-foreground transition-colors group-hover:underline">
              {name}
            </h3>
          </Link>

          {/* Reserved slot for ratings to prevent uneven price baselines */}
          <div className="mt-1.5 flex min-h-[1.25rem] items-center">
            {reviewCount > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-medium tabular text-foreground">
                  {rating.toFixed(1)}
                </span>
                <span>·</span>
                <span className="tabular">{reviewCount} đánh giá</span>
              </div>
            ) : null}
          </div>

          {/* Price Row */}
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-base font-semibold tabular text-foreground">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm tabular text-muted-foreground line-through">
                {formatCurrency(effectivePrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Button (44px on mobile, text-sm font-semibold, solid style) */}
          <div className="mt-3">
            <Button
              variant={isOutOfStock ? 'secondary' : 'default'}
              disabled={isOutOfStock}
              onClick={onAddToCart}
              className="h-11 w-full text-sm font-semibold"
            >
              {isOutOfStock ? (
                'Hết hàng'
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Thêm vào giỏ
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isQuickViewOpen ? (
        <ProductQuickView
          slug={slug}
          open={isQuickViewOpen}
          onOpenChange={setIsQuickViewOpen}
        />
      ) : null}
    </>
  );
});
