import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield, ShoppingBag, Heart, Settings, LogOut, Phone } from 'lucide-react';
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
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 border'
      : 'bg-muted text-muted-foreground border-border border';
  };

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="container max-w-6xl py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Tài khoản của tôi</h1>
          <p className="text-sm text-muted-foreground font-medium">Quản lý thông tin cá nhân và hoạt động mua sắm</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border bg-card/80 backdrop-blur-xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-2xl font-black shadow-lg shadow-primary/20">
                    {getInitials(user.name)}
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                    <Badge variant="secondary" className={getRoleColor(user.role)}>
                      {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-border bg-background/50 hover:bg-muted/50 hover:border-primary/40 transition-colors font-medium text-foreground"
                    onClick={() => setIsProfileDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2 text-primary" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="border-destructive/30 bg-card/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-destructive text-lg font-bold">Hành động tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button variant="destructive" onClick={logout} className="flex-1 rounded-xl font-bold shadow-md shadow-destructive/20">
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
            <Card className="border-border bg-card/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-muted/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="font-medium text-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-muted/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Số điện thoại</p>
                      <p className="font-medium text-foreground">{user.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-muted/30 md:col-span-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ngày tham gia</p>
                      <p className="font-medium text-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-border bg-card/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
                  <Shield className="h-5 w-5 text-primary" />
                  Bảo mật tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/30">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Xác thực hai lớp</p>
                      <p className="text-sm font-semibold text-foreground">Mã OTP bảo mật</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25">
                      Đang bật
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/30">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mã hóa kết nối</p>
                      <p className="text-sm font-semibold text-foreground">Bảo mật SSL / TLS</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25">
                      Chuẩn cao cấp
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Section */}
            <Card className="border-border bg-card/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
                  <Settings className="h-5 w-5 text-primary" />
                  Phiên hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">Phiên quản trị hiện tại</p>
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 text-[10px] py-0 px-2">
                        Đang hoạt động
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Khu vực làm việc Thai Spray Admin Control Platform</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 font-medium">Phiên hiện thời</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border bg-card/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-bold">Hoạt động nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start border-border bg-background/50 hover:bg-muted/50 hover:border-primary/40 transition-colors text-foreground rounded-xl"
                    onClick={() => navigate('/admin/orders')}
                  >
                    <ShoppingBag className="h-5 w-5 mr-3 text-primary shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-foreground">Đơn hàng của tôi</div>
                      <div className="text-sm text-muted-foreground">Xem lịch sử mua hàng</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start border-border bg-background/50 hover:bg-muted/50 hover:border-primary/40 transition-colors text-foreground rounded-xl"
                  >
                    <Heart className="h-5 w-5 mr-3 text-primary shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-foreground">Danh sách yêu thích</div>
                      <div className="text-sm text-muted-foreground">Sản phẩm đã lưu</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start border-border bg-background/50 hover:bg-muted/50 hover:border-primary/40 transition-colors text-foreground rounded-xl md:col-span-2"
                  >
                    <Shield className="h-5 w-5 mr-3 text-primary shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-foreground">Bảo mật tài khoản</div>
                      <div className="text-sm text-muted-foreground">Đổi mật khẩu</div>
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
