import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { formatDate } from '@/lib/utils';
import { ProfileFormDialog } from '@/features/users/components/ProfileFormDialog';

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { label: 'Tài khoản', path: '/account', active: true },
    { label: 'Đơn hàng của tôi', path: '/orders', active: false },
    { label: 'Sổ địa chỉ', path: '/addresses', active: false },
    { label: 'Danh sách yêu thích', path: '/wishlist', active: false },
    { label: 'Bảo mật tài khoản', path: '#', active: false },
  ];

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="container py-8 md:py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Tài khoản</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Tài khoản của tôi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý thông tin và hoạt động của bạn
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 md:gap-10">
          {/* Left Column: Profile Card & Navigation */}
          <aside className="space-y-6">
            <div className="flex items-center gap-3 pb-6 border-b border-border">
              <div className="h-12 w-12 rounded-full bg-secondary text-foreground flex items-center justify-center font-serif text-base font-medium border border-border shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                <Badge variant="secondary" className="rounded-sm text-xs mt-1 font-normal">
                  {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng thân thiết'}
                </Badge>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Danh mục
              </h2>
              <nav aria-label="Menu tài khoản" className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.path !== '#' && !item.active) {
                        navigate(item.path);
                      }
                    }}
                    className={`text-left text-sm py-2 pl-3 transition-colors ${
                      item.active
                        ? 'border-l-2 border-accent font-medium text-foreground'
                        : 'border-l-2 border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Column: Details */}
          <div className="space-y-8">
            <div className="border border-border rounded-lg bg-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h2 className="font-serif text-lg font-medium text-foreground">
                  Thông tin cá nhân
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileDialogOpen(true)}
                >
                  Chỉnh sửa
                </Button>
              </div>

              <dl className="divide-y divide-border">
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
                  <dt className="text-sm text-muted-foreground">Họ và tên</dt>
                  <dd className="text-sm font-medium text-foreground sm:col-span-2">
                    {user.name}
                  </dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium text-foreground sm:col-span-2 truncate">
                    {user.email || 'Chưa cập nhật'}
                  </dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
                  <dt className="text-sm text-muted-foreground">Số điện thoại</dt>
                  <dd className="text-sm font-medium text-foreground sm:col-span-2">
                    {user.phone || 'Chưa cập nhật'}
                  </dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
                  <dt className="text-sm text-muted-foreground">Ngày tham gia</dt>
                  <dd className="text-sm font-medium text-foreground sm:col-span-2">
                    {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                  </dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
                  <dt className="text-sm text-muted-foreground">Trạng thái</dt>
                  <dd className="text-sm font-medium text-foreground sm:col-span-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span>Đang hoạt động</span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Thống kê hoạt động */}
            <div className="border border-border rounded-lg bg-card p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Thống kê hoạt động
              </h3>
              <div className="grid grid-cols-2 divide-x divide-border border border-border rounded-lg">
                <div className="p-4 text-center">
                  <div className="text-2xl font-semibold text-foreground tabular">0</div>
                  <div className="text-xs text-muted-foreground mt-1">Đơn hàng</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-2xl font-semibold text-foreground tabular">0</div>
                  <div className="text-xs text-muted-foreground mt-1">Đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProfileFormDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />
      </div>
    </>
  );
}
