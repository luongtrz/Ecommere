import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function MobileNav() {
    const location = useLocation();
    const { totalItems, openCart } = useCart();
    const { user } = useAuth();

    const navItems = [
        { label: 'Trang chu', icon: Home, href: '/' },
        { label: 'San pham', icon: Grid3X3, href: '/catalog' },
        { label: 'Gio hang', icon: ShoppingBag, action: openCart, badge: totalItems },
        { label: 'Tai khoan', icon: User, href: user ? '/account' : '/login' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item, index) => {
                    const isActive = item.href ? location.pathname === item.href : false;

                    if (item.action) {
                        return (
                            <button
                                key={index}
                                onClick={item.action}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                                    "text-gray-500 hover:text-blue-600"
                                )}
                            >
                                <div className="relative">
                                    <item.icon className="h-6 w-6" />
                                    {item.badge && item.badge > 0 ? (
                                        <Badge className="absolute -top-2 -right-2 h-4 min-w-[16px] p-0 px-1 flex items-center justify-center rounded-full bg-red-600 text-[10px] text-white animate-scale-in">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </Badge>
                                    ) : null}
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            to={item.href!}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                            <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
