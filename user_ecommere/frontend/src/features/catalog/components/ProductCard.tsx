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
  const discountPercent =
    hasDiscount && salePrice != null
      ? Math.max(1, Math.round(((price - salePrice) / price) * 100))
      : 0;
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
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
          <Link to={`/p/${slug}`} className="block aspect-square overflow-hidden p-4 flex items-center justify-center">
            <img
              src={getImageUrl(images[0], { width: 500 })}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-200 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                <Flame className="h-3 w-3 fill-white" />
                -{discountPercent}%
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200 shadow-sm">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              Chính Hãng Thái Lan
            </span>
          </div>

          {/* Wishlist Button */}
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
            aria-label="Thêm vào yêu thích"
            className={cn(
              'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95',
              isWishlisted
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'text-slate-400 hover:text-rose-600 hover:border-slate-300',
            )}
          >
            <Heart className={cn('h-4 w-4 transition-colors', isWishlisted && 'fill-rose-600 text-rose-600')} />
          </button>

          {/* Quick View Hover Action */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(true)}
              className="pointer-events-auto w-full rounded-lg border border-slate-200 bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-teal-600 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-150 backdrop-blur-sm"
            >
              Xem nhanh
            </button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col p-4">
          <Link to={`/p/${slug}`}>
            <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-slate-900 hover:text-teal-600 transition-colors duration-150">
              {name}
            </h3>
          </Link>

          {/* Rating & Trust */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-900 tabular-nums">{rating > 0 ? rating.toFixed(1) : '4.9'}</span>
            </div>
            <span>·</span>
            <span className="text-slate-500">{reviewCount > 0 ? `${reviewCount} đánh giá` : 'Đã bán 120+'}</span>
          </div>

          {/* Pricing */}
          <div className="mt-auto pt-3">
            <div className="flex items-baseline gap-2">
              <span className={cn('text-base md:text-lg font-semibold tabular-nums', hasDiscount ? 'text-rose-600' : 'text-slate-900')}>
                {formatCurrency(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
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
            className="h-10 w-full rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            size="sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Thêm vào giỏ
          </Button>
        </CardFooter>
      </Card>

      {isQuickViewOpen && (
        <ProductQuickView
          slug={slug}
          open={isQuickViewOpen}
          onOpenChange={setIsQuickViewOpen}
        />
      )}
    </>
  );
});
