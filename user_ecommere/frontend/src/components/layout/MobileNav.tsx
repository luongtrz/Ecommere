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
    <nav
      aria-label="Điều hướng di động"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <div className="grid h-16 grid-cols-4 items-center">
        {navItems.map((item, index) => {
          const isActive = item.href ? location.pathname === item.href : false;

          if (item.action) {
            return (
              <button
                key={index}
                type="button"
                onClick={item.action}
                className="relative flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="tabular absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={item.href!}
              className={cn(
                'relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive ? (
                <span className="absolute inset-x-3 top-0 h-[2px] bg-accent" aria-hidden="true" />
              ) : null}
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
