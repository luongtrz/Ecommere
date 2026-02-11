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
      <div className="container py-4 max-w-6xl h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-4 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tài khoản của tôi
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quản lý thông tin và hoạt động của bạn
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 pb-4">
          {/* Left Column: Profile & Menu */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1">
            {/* Quick Profile */}
            <Card className="shadow-sm border border-gray-100 overflow-hidden shrink-0">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{user.name}</h2>
                  <Badge variant="secondary" className={`${getRoleColor(user.role)} px-2 py-0.5 rounded-full text-[10px] mt-1`}>
                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng thân thiết'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setIsProfileDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </Button>
              </CardContent>
            </Card>

            {/* Menu */}
            <Card className="shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4 border-b bg-gray-50/50">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Danh mục</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1 flex-1 overflow-y-auto">
                {[
                  { icon: ShoppingBag, label: 'Đơn hàng của tôi', path: '/orders', color: 'text-blue-600 bg-blue-50' },
                  { icon: MapPin, label: 'Sổ địa chỉ', path: '/addresses', color: 'text-green-600 bg-green-50' },
                  { icon: Heart, label: 'Danh sách yêu thích', path: '/wishlist', color: 'text-rose-600 bg-rose-50' },
                  { icon: Shield, label: 'Bảo mật tài khoản', path: '#', color: 'text-purple-600 bg-purple-50' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => item.path !== '#' && navigate(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto pr-1">
            <Card className="shadow-sm border border-gray-100 h-full flex flex-col">
              <CardHeader className="py-4 px-6 border-b bg-gray-50/30 shrink-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-blue-600" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-blue-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-sm text-gray-900 truncate">{user.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-green-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Số điện thoại</p>
                      <p className="font-semibold text-sm text-gray-900">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-purple-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Ngày tham gia</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-amber-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="font-semibold text-sm text-gray-900">Đang hoạt động</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm text-gray-900">Thống kê hoạt động</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500 font-medium mt-1">Đơn hàng</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500 font-medium mt-1">Đánh giá</div>
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
    </>
  );
}
