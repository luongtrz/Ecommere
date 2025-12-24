import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Rating } from './Rating';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';

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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/p/${slug}`}>
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={getImageUrl(images[0])}
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <CardContent className="p-3 flex-1 flex flex-col">
        <Link to={`/p/${slug}`}>
          <h3 className="text-sm font-semibold line-clamp-2 hover:text-primary mb-1.5 min-h-[2.5rem]">
            {name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Rating value={rating} />
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-base font-bold text-primary">
            {formatCurrency(finalPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                {formatDiscount(price, salePrice)}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button
          onClick={onAddToCart}
          className="w-full flex items-center justify-center gap-1.5 h-8 text-xs"
          size="sm"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Thêm vào giỏ</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
