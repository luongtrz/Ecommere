import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/cart/hooks/useCart';

export function CartBadge() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="relative flex h-9 w-9 items-center justify-center"
      aria-label={itemCount > 0 ? `Giỏ hàng, ${itemCount} sản phẩm` : 'Giỏ hàng'}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {itemCount > 0 ? (
        <Badge
          className="tabular absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full p-0 px-1 text-xs font-semibold"
          aria-label={`${itemCount} sản phẩm`}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      ) : null}
    </div>
  );
}
