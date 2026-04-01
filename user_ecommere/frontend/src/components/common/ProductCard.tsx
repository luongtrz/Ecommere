import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { memo, useState } from 'react';
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
  const hasDiscount = salePrice && salePrice < price;

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { toggleItem, isInWishlist } = useWishlist();
  const prefetchProduct = usePrefetchProduct();
  const isWishlisted = isInWishlist(id);

  return (
    <>
      <Card
        className="group overflow-hidden border hover:shadow-md transition-shadow duration-200 flex flex-col h-full bg-white"
        onMouseEnter={() => prefetchProduct(slug)}
      >
        <div className="relative overflow-hidden">
          <Link to={`/p/${slug}`}>
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={getImageUrl(images[0], { width: 400 })}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleItem({ productId: id, name, slug, image: images[0], price: finalPrice });
            }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 text-muted-foreground hover:text-red-500'}`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
          </button>

          {/* Sale badge */}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              Sale
            </span>
          )}
        </div>

        <CardContent className="p-3 flex-1 flex flex-col">
          <Link to={`/p/${slug}`}>
            <h3 className="text-sm font-medium line-clamp-2 text-foreground mb-1.5 min-h-[2.5rem] leading-snug">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">{rating.toFixed(1)} ({reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-base font-semibold text-foreground">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-3 pt-0">
          <Button
            onClick={onAddToCart}
            variant="outline"
            className="w-full h-9 text-xs"
            size="sm"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
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
