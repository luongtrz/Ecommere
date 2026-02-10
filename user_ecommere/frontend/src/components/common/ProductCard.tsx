import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Eye, Heart } from 'lucide-react';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { useState } from 'react';
import { ProductQuickView } from '@/features/catalog/components/ProductQuickView';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';

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

export function ProductCard({
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
  const isWishlisted = isInWishlist(id);

  return (
    <>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full bg-white rounded-2xl">
        <div className="relative overflow-hidden">
          <Link to={`/p/${slug}`}>
            <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
              <img
                src={getImageUrl(images[0])}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </Link>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleItem({ productId: id, name, slug, image: images[0], price: finalPrice });
            }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${isWishlisted ? 'bg-rose-50 text-rose-500' : 'bg-white/80 text-gray-400 hover:text-rose-500 hover:bg-white'} shadow-sm`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>

          {/* Quick View Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <Button
              variant="secondary"
              size="sm"
              className="pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 hover:bg-white text-gray-900 shadow-lg rounded-full px-4 font-medium"
              onClick={(e) => {
                e.preventDefault();
                setIsQuickViewOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Xem nhanh
            </Button>
          </div>

          {/* Sale badge */}
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-lg pointer-events-none">
              {formatDiscount(price, salePrice)}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <Link to={`/p/${slug}`}>
            <h3 className="text-sm font-semibold line-clamp-2 text-gray-800 group-hover:text-primary transition-colors duration-200 mb-2 min-h-[2.5rem] leading-snug">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < Math.floor(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                    }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={onAddToCart}
            className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            size="sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Thêm vào giỏ</span>
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
}
