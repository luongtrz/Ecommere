import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Phone,
} from 'lucide-react';
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
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-transparent font-medium'
      : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 border-transparent font-medium';
  };

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="container max-w-6xl py-8 md:py-12 space-y-8 font-sans">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tài khoản của tôi
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            Quản lý thông tin cá nhân và hoạt động mua sắm
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-24 w-24 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-700 text-2xl font-bold shadow-sm">
                    {getInitials(user.name)}
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-slate-900">
                      {user.name}
                    </h2>
                    <Badge
                      variant="secondary"
                      className={getRoleColor(user.role)}
                    >
                      {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-slate-700 shadow-sm"
                    onClick={() => setIsProfileDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2 text-teal-600" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-rose-600 text-base font-bold">
                  Hành động tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={logout}
                    className="flex-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-bold">
                  <User className="h-5 w-5 text-teal-600" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="font-medium text-slate-900 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Số điện thoại
                      </p>
                      <p className="font-medium text-slate-900 tabular-nums">
                        {user.phone || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 bg-slate-50 md:col-span-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Ngày tham gia
                      </p>
                      <p className="font-medium text-slate-900">
                        {user.createdAt
                          ? formatDate(user.createdAt)
                          : 'Không rõ'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-bold">
                  <Shield className="h-5 w-5 text-teal-600" />
                  Bảo mật tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Xác thực hai lớp
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        Mã OTP bảo mật
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-transparent font-medium"
                    >
                      Đang bật
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Mã hóa kết nối
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        Bảo mật SSL / TLS
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-transparent font-medium"
                    >
                      Chuẩn cao cấp
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Section */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-bold">
                  <Settings className="h-5 w-5 text-teal-600" />
                  Phiên hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Phiên quản trị hiện tại
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-transparent text-[10px] py-0 px-2 font-medium"
                      >
                        Đang hoạt động
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Khu vực làm việc Thai Spray Admin Control Platform
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 font-medium">
                    Phiên hiện thời
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900 text-base sm:text-lg font-bold">
                  Hoạt động nhanh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-200 transition-all text-slate-900 rounded-lg group shadow-sm"
                    onClick={() => navigate('/admin/orders')}
                  >
                    <ShoppingBag className="h-5 w-5 mr-3 text-teal-600 shrink-0 transition-transform group-hover:scale-110" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-sm">
                        Đơn hàng của tôi
                      </div>
                      <div className="text-xs text-slate-500">
                        Xem lịch sử mua hàng
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-200 transition-all text-slate-900 rounded-lg group shadow-sm"
                  >
                    <Heart className="h-5 w-5 mr-3 text-teal-600 shrink-0 transition-transform group-hover:scale-110" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-sm">
                        Danh sách yêu thích
                      </div>
                      <div className="text-xs text-slate-500">
                        Sản phẩm đã lưu
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-200 transition-all text-slate-900 rounded-lg md:col-span-2 group shadow-sm"
                  >
                    <Shield className="h-5 w-5 mr-3 text-teal-600 shrink-0 transition-transform group-hover:scale-110" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-sm">
                        Bảo mật tài khoản
                      </div>
                      <div className="text-xs text-slate-500">Đổi mật khẩu</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
