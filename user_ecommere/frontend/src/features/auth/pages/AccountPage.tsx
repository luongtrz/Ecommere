import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LogOut, Settings, ChevronRight } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { formatDate } from '@/lib/utils';
import { ProfileFormDialog } from '@/features/users/components/ProfileFormDialog';

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
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
        <div className="pb-6 border-b border-border mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
            Tài khoản của tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin và hoạt động của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 md:gap-10">
          {/* Left Column on Desktop / Ordered below details on mobile */}
          <aside className="contents md:block md:space-y-6">
            {/* User Identity Box */}
            <div className="order-1 md:order-none flex items-center gap-3 p-4 sm:p-0 rounded-lg sm:rounded-none bg-card sm:bg-transparent border sm:border-0 sm:border-b border-border sm:pb-6">
              <div className="h-12 w-12 rounded-full bg-secondary text-foreground flex items-center justify-center font-sans text-base font-semibold border border-border shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-base leading-snug text-foreground truncate">
                  {user.name}
                </h2>
                <Badge variant="secondary" className="rounded-sm text-xs mt-1 font-normal">
                  {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng thân thiết'}
                </Badge>
              </div>
            </div>

            {/* Account Navigation */}
            <div className="order-3 md:order-none">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Danh mục
              </h3>
              <nav aria-label="Menu tài khoản" className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.path !== '#' && !item.active) {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full min-h-11 px-4 py-2.5 rounded-md text-sm text-left flex items-center justify-between transition-colors ${
                      item.active
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Logout Button */}
            <div className="order-4 md:order-none pt-2 md:pt-4">
              <Button
                variant="outline"
                onClick={() => setIsLogoutDialogOpen(true)}
                className="w-full min-h-11 justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </aside>

          {/* Right Column: Details (comes first on mobile) */}
          <div className="order-2 md:order-none space-y-8">
            <div className="border border-border rounded-lg bg-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground">
                  Thông tin cá nhân
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 sm:min-h-9 px-3 text-sm"
                  onClick={() => setIsProfileDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-1.5" />
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
              <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground mb-4">
                Thống kê hoạt động
              </h2>
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

        {/* In-page Logout Confirmation Dialog */}
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Đăng xuất
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto min-h-11 sm:min-h-9"
                onClick={() => setIsLogoutDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto min-h-11 sm:min-h-9"
                onClick={async () => {
                  setIsLogoutDialogOpen(false);
                  await logout();
                }}
              >
                Xác nhận đăng xuất
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
