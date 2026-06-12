import { memo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Sparkles, Star } from 'lucide-react';
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
  const finalPrice = salePrice || price;
  const hasDiscount = Boolean(salePrice && salePrice < price);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { toggleItem, isInWishlist } = useWishlist();
  const prefetchProduct = usePrefetchProduct();
  const isWishlisted = isInWishlist(id);
  const discountPercent = hasDiscount && salePrice ? Math.max(1, Math.round(((price - salePrice) / price) * 100)) : 0;
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
      <Card
        className="group flex flex-col h-full overflow-hidden rounded-[1.8rem] border border-black/[0.03] bg-white/90 shadow-luxury hover:shadow-luxury-glow hover:-translate-y-2 duration-500 ease-out transition-all"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden">
          <Link to={`/p/${slug}`}>
            <div className="aspect-square overflow-hidden bg-[linear-gradient(145deg,#FAF9F5,rgba(240,236,227,0.85))]">
              <img
                src={getImageUrl(images[0], { width: 500 })}
                alt={name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
            </div>
          </Link>
 
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {hasDiscount ? (
              <span className="rounded-full bg-primary/95 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                Giảm {discountPercent}%
              </span>
            ) : (
              <span className="rounded-full border border-accent/30 bg-white/80 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur-md shadow-sm">
                Được chọn lọc
              </span>
            )}
          </div>
 
          <button
            onClick={(event) => {
              event.preventDefault();
              toggleItem({ productId: id, name, slug, image: images[0], price: finalPrice });
            }}
            className={cn(
              'absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90 shadow-sm border border-white/50',
              isWishlisted
                ? 'bg-red-50/95 text-red-500 shadow-md shadow-red-500/10 hover:scale-105 hover:bg-red-50'
                : 'bg-white/80 text-primary/70 hover:bg-white hover:text-red-500 hover:scale-105 hover:shadow-md hover:shadow-black/5',
            )}
          >
            <Heart className={cn('h-4 w-4 transition-transform duration-300', isWishlisted && 'fill-red-500 scale-110')} />
          </button>
 
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(true)}
              className="pointer-events-auto w-full rounded-full bg-primary/95 hover:bg-primary text-primary-foreground backdrop-blur-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-xl transition duration-300 active:scale-95 border border-white/10"
            >
              Xem nhanh
            </button>
          </div>
        </div>
 
        <CardContent className="flex flex-1 flex-col p-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground/70">
            <Sparkles className="h-3 w-3 text-accent-foreground/60 fill-accent/10" />
            Mùi hương nổi bật
          </div>
 
          <Link to={`/p/${slug}`}>
            <h3 className="min-h-[3.3rem] text-base font-bold leading-snug text-foreground transition duration-300 group-hover:text-accent-foreground/90 font-serif">
              {name}
            </h3>
          </Link>
 
          {reviewCount > 0 ? (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
              <span>·</span>
              <span>{reviewCount} đánh giá</span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Phù hợp cho nhịp sống hằng ngày và không gian gọn gàng.</p>
          )}
 
          <div className="mt-auto pt-5">
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold text-foreground">{formatCurrency(finalPrice)}</span>
              {hasDiscount ? (
                <span className="pb-0.5 text-sm text-muted-foreground line-through">{formatCurrency(price)}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
 
        <CardFooter className="p-4 pt-0">
          <Button onClick={onAddToCart} className="h-11 w-full rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/15 active:scale-[0.98] font-bold uppercase tracking-wider text-xs" size="sm">
            <ShoppingCart className="mr-2 h-3.5 w-3.5" />
            Thêm vào giỏ
          </Button>
        </CardFooter>
      </Card>

      {isQuickViewOpen ? (
        <ProductQuickView slug={slug} open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen} />
      ) : null}
    </>
  );
});
