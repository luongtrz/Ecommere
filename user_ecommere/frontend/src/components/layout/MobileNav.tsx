import { Link, useLocation } from 'react-router-dom';
import { Grid3X3, Home, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  const navItems = [
    { label: 'Trang chủ', icon: Home, href: '/' },
    { label: 'Khám phá', icon: Grid3X3, href: '/catalog' },
    { label: 'Giỏ hàng', icon: ShoppingBag, action: openCart, badge: totalItems },
    { label: 'Tài khoản', icon: User, href: user ? '/account' : '/login' },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="glass-panel flex h-16 items-center justify-around rounded-[1.75rem] px-2 pb-safe">
        {navItems.map((item, index) => {
          const isActive = item.href ? location.pathname === item.href : false;

          if (item.action) {
            return (
              <button
                key={index}
                onClick={item.action}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground transition"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={item.href!}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl transition',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
              <span className={cn('text-[11px]', isActive && 'font-semibold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
