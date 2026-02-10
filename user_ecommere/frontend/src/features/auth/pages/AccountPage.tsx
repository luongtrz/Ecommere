import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield, ShoppingBag, Heart, Settings, LogOut, MapPin, Phone, ChevronRight } from 'lucide-react';
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

  const getRoleColor = (role: string) => {
    return role === 'ADMIN'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-indigo-100 text-indigo-700 border-indigo-200';
  };

  return (
    <>
      <SEO title="Tài khoản" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-12">
        {/* Header Background */}
        <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="container max-w-5xl -mt-20 relative z-10 px-4">
          <div className="grid gap-8 lg:grid-cols-12">

            {/* Left Column: Profile Card */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
                <CardContent className="pt-8 pb-8 px-6 text-center relative">
                  <div className="relative inline-block mb-4">
                    <div className="h-28 w-28 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white relative z-10">
                      {getInitials(user.name)}
                    </div>
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                  <div className="flex justify-center mb-6">
                    <Badge variant="secondary" className={`${getRoleColor(user.role)} px-3 py-1 rounded-full shadow-sm`}>
                      {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng thân thiết'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500 font-medium">Đơn hàng</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500 font-medium">Đánh giá</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsProfileDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Menu */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Danh mục</h3>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { icon: ShoppingBag, label: 'Đơn hàng của tôi', path: '/orders', color: 'text-blue-600 bg-blue-50' },
                    { icon: MapPin, label: 'Sổ địa chỉ', path: '/addresses', color: 'text-green-600 bg-green-50' },
                    { icon: Heart, label: 'Danh sách yêu thích', path: '/wishlist', color: 'text-rose-600 bg-rose-50' },
                    { icon: Shield, label: 'Bảo mật tài khoản', path: '#', color: 'text-purple-600 bg-purple-50' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => item.path !== '#' && navigate(item.path)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                          <item.icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={logout}
                className="w-full rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none h-12 font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>

            {/* Right Column: Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Welcome Banner */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-50 to-transparent opacity-50" />
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Xin chào, {user.name}!</h2>
                  <p className="text-gray-500 text-sm">Chào mừng bạn quay trở lại Thai Spray Shop.</p>
                </div>
                <div className="relative z-10">
                  <Button onClick={() => navigate('/catalog')} className="rounded-xl bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200">
                    Mua sắm ngay
                  </Button>
                </div>
              </div>

              {/* Personal Information */}
              <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-gray-50 bg-white px-6 py-5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                        <p className="font-semibold text-gray-900 break-all">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-green-100 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</p>
                        <p className="font-semibold text-gray-900">{user.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-100 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Ngày tham gia</p>
                        <p className="font-semibold text-gray-900">
                          {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-amber-100 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái</p>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <p className="font-semibold text-gray-900">Đang hoạt động</p>
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
