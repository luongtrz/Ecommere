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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/p/${slug}`}>
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={getImageUrl(images[0])}
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/p/${slug}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary mb-2">
            {name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Rating value={rating} />
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(finalPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
              <Badge variant="destructive" className="text-xs">
                {formatDiscount(price, salePrice)}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={onAddToCart}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Thêm vào giỏ
        </Button>
      </CardFooter>
    </Card>
  );
}
