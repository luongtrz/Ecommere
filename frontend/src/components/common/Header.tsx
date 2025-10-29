import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBox } from './SearchBox';
import { CartBadge } from './CartBadge';
import { CategoryNav } from './CategoryNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Thai Spray</span>
        </Link>

        <div className="flex-1 max-w-xl mx-auto">
          <SearchBox />
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/cart">
            <CartBadge />
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/account">Tài khoản</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">Đơn hàng</Link>
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Quản trị</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline">
              <Link to="/login">Đăng nhập</Link>
            </Button>
          )}
        </nav>
      </div>
      <CategoryNav />
    </header>
  );
}
