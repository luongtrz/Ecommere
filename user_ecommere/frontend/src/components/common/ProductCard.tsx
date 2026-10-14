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
  onAddToCart,
}: ProductCardProps) {
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
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-teal-200 hover:-translate-y-1.5 transition-all duration-300"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
          <Link to={`/p/${slug}`} className="block aspect-square overflow-hidden">
            <img
              src={getImageUrl(images[0], { width: 500 })}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                <Flame className="h-3 w-3 fill-white" />
                -{discountPercent}%
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-teal-800 shadow-xs border border-teal-100">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Chính Hãng Thái Lan
            </span>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(event) => {
              event.preventDefault();
              toggleItem({ productId: id, name, slug, image: images[0], price: finalPrice });
            }}
            className={cn(
              'absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 shadow-sm',
              isWishlisted
                ? 'bg-rose-50 text-rose-500 shadow-md shadow-rose-500/15'
                : 'bg-white/80 text-slate-400 hover:bg-white hover:text-rose-500',
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart className={cn('h-4 w-4 transition-transform duration-200', isWishlisted && 'fill-rose-500 scale-110')} />
          </button>

          {/* Quick View Hover Action */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(true)}
              className="pointer-events-auto w-full rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md py-2 text-xs font-bold shadow-md transition duration-200 active:scale-95"
            >
              Xem nhanh
            </button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col p-4">
          <Link to={`/p/${slug}`} className="group-hover:text-teal-700 transition-colors">
            <h3 className="line-clamp-2 text-sm font-bold text-slate-800 leading-snug min-h-[2.5rem]">
              {name}
            </h3>
          </Link>

          {/* Rating & Trust */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-700">{rating > 0 ? rating.toFixed(1) : '4.9'}</span>
            </div>
            <span>·</span>
            <span>{reviewCount > 0 ? `${reviewCount} đánh giá` : 'Đã bán 120+'}</span>
          </div>

          {/* Pricing */}
          <div className="mt-auto pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-teal-700">
                {formatCurrency(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
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
            className="h-10 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-teal-700/20 active:scale-[0.98]"
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
