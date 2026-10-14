import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/cart/hooks/useCart';

export function CartBadge() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative flex h-9 w-9 items-center justify-center">
      <ShoppingCart className="h-5 w-5 text-slate-700" />
      {itemCount > 0 ? (
        <Badge
          variant="destructive"
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold tabular-nums text-white shadow-sm border-2 border-white"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      ) : null}
    </div>
  );
}
