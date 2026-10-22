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
  MapPin,
  Phone,
  ChevronRight,
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
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-teal-50 text-teal-700 border-teal-200';
  };

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <div className="container max-w-6xl py-8 md:py-12 flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="uppercase tracking-wider text-[11px] font-semibold text-teal-600 block mb-1">
                Trung tâm tài khoản
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-sans">
                Tài khoản của tôi
              </h1>
              <p className="text-sm text-slate-600 mt-0.5 font-normal">
                Quản lý thông tin và hoạt động của bạn
              </p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="self-start sm:self-auto rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 hover:border-rose-200 px-4 py-2 font-medium text-xs transition-colors shadow-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 flex-1">
            {/* Left Column: Profile & Menu */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
              {/* Quick Profile */}
              <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-teal-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-sm shrink-0 font-sans">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900 truncate font-sans">
                      {user.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`${getRoleColor(user.role)} px-2.5 py-0.5 rounded-full text-[10px] mt-1 font-semibold tracking-wider uppercase border`}
                    >
                      {user.role === 'ADMIN'
                        ? 'Quản trị viên'
                        : 'Khách hàng thân thiết'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 shrink-0"
                    onClick={() => setIsProfileDialogOpen(true)}
                    aria-label="Cài đặt thông tin"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Menu */}
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-slate-200 bg-slate-50/70">
                  <CardTitle className="font-sans text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Danh mục
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1">
                  {[
                    {
                      icon: ShoppingBag,
                      label: 'Đơn hàng của tôi',
                      path: '/orders',
                    },
                    { icon: MapPin, label: 'Sổ địa chỉ', path: '/addresses' },
                    {
                      icon: Heart,
                      label: 'Danh sách yêu thích',
                      path: '/wishlist',
                    },
                    { icon: Shield, label: 'Bảo mật tài khoản', path: '#' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => item.path !== '#' && navigate(item.path)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all duration-200 group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors border border-slate-200/60">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm text-slate-700 group-hover:text-slate-900 transition-colors font-sans">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 sm:px-8 border-b border-slate-200 bg-slate-50/70">
                  <CardTitle className="font-sans flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    <User className="h-5 w-5 text-teal-600" />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                          Email
                        </p>
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {user.email || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                          Số điện thoại
                        </p>
                        <p className="font-medium text-sm text-slate-900">
                          {user.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                          Ngày tham gia
                        </p>
                        <p className="font-medium text-sm text-slate-900">
                          {user.createdAt
                            ? formatDate(user.createdAt)
                            : 'Không rõ'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                          Trạng thái
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="font-medium text-sm text-emerald-700">
                            Đang hoạt động
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Thống kê hoạt động
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200 transition-all duration-200 hover:shadow-sm">
                        <div className="font-semibold text-3xl text-slate-900 tabular-nums">
                          0
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-1">
                          Đơn hàng
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200 transition-all duration-200 hover:shadow-sm">
                        <div className="font-semibold text-3xl text-slate-900 tabular-nums">
                          0
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-1">
                          Đánh giá
                        </div>
                      </div>
                    </div>
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
      </div>
    </>
  );
}
