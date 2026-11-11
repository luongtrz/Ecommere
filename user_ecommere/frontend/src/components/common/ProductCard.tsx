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
  variants?: Array<{ stock: number }>;
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
  const finalPrice = salePrice ?? price;
  const hasDiscount = salePrice != null && salePrice < price;
  const isOutOfStock = variants !== undefined && (!selectedVariant || selectedVariant.stock === 0);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { toggleItem, isInWishlist } = useWishlist();
  const prefetchProduct = usePrefetchProduct();
  const isWishlisted = isInWishlist(id);
  const discountPercent = hasDiscount && salePrice != null ? Math.max(1, Math.round(((price - salePrice) / price) * 100)) : 0;
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
              className="h-full w-full object-cover transition-transform duration-300 motion-reduce:transform-none group-hover:scale-[1.03]"
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
              <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Hết hàng
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              toggleItem({ productId: id, name, slug, image: images[0], price: finalPrice });
            }}
            className={cn(
              'absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isWishlisted && 'text-destructive hover:text-destructive'
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart className={cn('h-4 w-4 transition-colors', isWishlisted && 'fill-destructive text-destructive')} />
          </button>

          {/* Quick-view Trigger */}
          <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(true)}
              className="w-full rounded-md border border-border bg-card py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <h3 className="font-sans text-sm md:text-base font-medium leading-snug line-clamp-2 text-foreground transition-colors group-hover:underline">
              {name}
            </h3>
          </Link>

          {reviewCount > 0 ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium text-foreground tabular">{rating.toFixed(1)}</span>
              <span>·</span>
              <span className="tabular">{reviewCount} đánh giá</span>
            </div>
          ) : null}

          {/* Price Row */}
          <div className="mt-auto pt-2 flex items-baseline gap-2">
            <span className="text-base font-semibold tabular text-foreground">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through tabular">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className="w-full text-xs font-medium"
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </div>

      {isQuickViewOpen ? (
        <ProductQuickView slug={slug} open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen} />
      ) : null}
    </>
  );
});
