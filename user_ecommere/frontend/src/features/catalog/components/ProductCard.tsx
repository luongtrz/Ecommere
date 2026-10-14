import { memo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Heart, ShoppingCart, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { ProductQuickView } from '@/features/catalog/components/ProductQuickView';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { usePrefetchProduct } from '@/features/catalog/hooks/useProductDetail';
import { cn } from '@/lib/utils';

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
    }, 200);
  }, [prefetchProduct, slug]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  return (
    <>
      <Card
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-black/[0.03] bg-card shadow-luxury hover:shadow-luxury-glow hover:-translate-y-1.5 duration-500 ease-out transition-all"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-secondary/40 border-b border-border/40">
          <Link to={`/p/${slug}`} className="block aspect-square overflow-hidden p-5 flex items-center justify-center">
            <img
              src={getImageUrl(images[0], { width: 500 })}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                <Flame className="h-3 w-3 fill-primary-foreground" />
                -{discountPercent}%
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-foreground border border-border/60 shadow-sm">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent"></span>
              Chính Hãng Thái Lan
            </span>
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              toggleItem({ productId: id, name, slug, image: images[0], price: finalPrice });
            }}
            className={cn(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90 shadow-sm border border-border/40',
              isWishlisted
                ? 'bg-card text-destructive border-destructive/20 shadow-sm'
                : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-destructive hover:scale-105',
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart className={cn('h-4 w-4 transition-transform duration-300', isWishlisted && 'fill-destructive text-destructive scale-110')} />
          </button>

          {/* Quick View Hover Action */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(true)}
              className="pointer-events-auto w-full rounded-full bg-primary/95 hover:bg-primary text-primary-foreground backdrop-blur-md py-2 text-xs font-bold uppercase tracking-wider shadow-md transition duration-300 active:scale-95 border border-primary-foreground/10"
            >
              Xem nhanh
            </button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col p-4">
          <Link to={`/p/${slug}`}>
            <h3 className="line-clamp-2 min-h-[3rem] text-base font-bold leading-snug text-foreground transition-colors duration-300 group-hover:text-accent-foreground font-serif">
              {name}
            </h3>
          </Link>

          {/* Rating & Trust */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{rating > 0 ? rating.toFixed(1) : '4.9'}</span>
            </div>
            <span>·</span>
            <span>{reviewCount > 0 ? `${reviewCount} đánh giá` : 'Đã bán 120+'}</span>
          </div>

          {/* Pricing */}
          <div className="mt-auto pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground tabular-nums">
                {formatCurrency(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatCurrency(price)}
                </span>
              )}
            </div>
          </div>
        </CardContent>

        {/* Footer Action */}
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={onAddToCart}
            disabled={variants !== undefined && (!selectedVariant || selectedVariant.stock === 0)}
            className="h-11 w-full rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/15 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            size="sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Thêm vào giỏ
          </Button>
        </CardFooter>
      </Card>

      {isQuickViewOpen && (
        <ProductQuickView slug={slug} open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen} />
      )}
    </>
  );
});
