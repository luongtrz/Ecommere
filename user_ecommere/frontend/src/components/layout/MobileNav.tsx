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
      <div className="glass-panel flex h-16 items-center justify-around rounded-[2rem] px-2 shadow-luxury border border-border/80 bg-card/90 backdrop-blur-2xl">
        {navItems.map((item, index) => {
          const isActive = item.href ? location.pathname === item.href : false;

          if (item.action) {
            return (
              <button
                key={index}
                type="button"
                onClick={item.action}
                className="flex h-full w-full min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl text-muted-foreground transition active:scale-95 hover:text-foreground"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground border border-card shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={item.href!}
              className={cn(
                'flex h-full w-full min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110 text-primary')} />
              <span className={cn('text-[10px] tracking-wide', isActive ? 'font-bold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
