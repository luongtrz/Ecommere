import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield, ShoppingBag, Heart, Settings, LogOut, MapPin, Phone } from 'lucide-react';
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
    return role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tài khoản của tôi</h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân và hoạt động mua sắm</p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {getInitials(user.name)}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                    <Badge variant="secondary" className={getRoleColor(user.role)}>
                      {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsProfileDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Số điện thoại</p>
                      <p className="font-medium">{user.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                      <p className="font-medium">
                        {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Hoạt động nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => navigate('/orders')}
                  >
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Đơn hàng của tôi</div>
                      <div className="text-sm text-muted-foreground">Xem lịch sử mua hàng</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => navigate('/addresses')}
                  >
                    <MapPin className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Sổ địa chỉ</div>
                      <div className="text-sm text-muted-foreground">Quản lý địa chỉ giao hàng</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <Heart className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Danh sách yêu thích</div>
                      <div className="text-sm text-muted-foreground">Sản phẩm đã lưu</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <Shield className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Bảo mật tài khoản</div>
                      <div className="text-sm text-muted-foreground">Đổi mật khẩu</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="shadow-lg border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Hành động tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button variant="destructive" onClick={logout} className="flex-1">
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
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
